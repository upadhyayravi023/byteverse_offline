const mongoose = require('mongoose');
const Participant = require('../models/Participant.model');
const ScanLog = require('../models/ScanLog.model');
const Settings = require('../models/Settings.model');
const AppError = require('../utils/AppError');

/**
 * Helper — load settings with safe defaults
 */
const loadSettings = async (session) => {
  let settings = await Settings.findOne({ singletonId: 'STATIC_SETTINGS' }).session(session);
  if (!settings) settings = await Settings.create([{}], { session }).then(r => r[0]);
  return {
    maxShortBreaks:            settings.maxShortBreaks            ?? 4,
    maxShortBreakDurationMins: settings.maxShortBreakDurationMins ?? 30,
  };
};

/**
 * Perform INITIAL scan
 */
exports.initialScan = async (qrId) => {
  const participant = await Participant.findOne({ qrId });
  if (!participant) throw new AppError('Participant not found', 404);

  const session = await mongoose.startSession();
  try {
    return await session.withTransaction(async () => {
      const existingLog = await ScanLog.findOne({
        participantId: participant._id,
        scanType: 'ENTRY',
        breakType: 'INITIAL'
      }).session(session);

      if (existingLog) throw new AppError('Initial scan already completed', 400);

      const log = await ScanLog.create([{
        participantId: participant._id,
        scanType: 'ENTRY',
        breakType: 'INITIAL',
        violationFlag: false
      }], { session });

      participant.isInsideVenue = true;
      await participant.save({ session });
      return log[0];
    });
  } finally {
    session.endSession();
  }
};

/**
 * Perform EXIT scan
 */
exports.exitScan = async (qrId, breakType) => {
  const participant = await Participant.findOne({ qrId });
  if (!participant) throw new AppError('Participant not found', 404);

  const hasInitial = await ScanLog.findOne({ participantId: participant._id, breakType: 'INITIAL' });
  if (!hasInitial) {
    throw new AppError('Participant is registered but requires an Initial Entry scan first.', 400);
  }

  if (!participant.isInsideVenue) {
    throw new AppError('Participant is already outside the venue', 400);
  }

  const session = await mongoose.startSession();
  try {
    return await session.withTransaction(async () => {
      const log = await ScanLog.create([{
        participantId: participant._id,
        scanType: 'EXIT',
        breakType,
      }], { session });

      participant.isInsideVenue = false;
      await participant.save({ session });
      return log[0];
    });
  } finally {
    session.endSession();
  }
};

/**
 * Perform ENTRY scan & Evaluate Rule Engine
 */
exports.entryScan = async (qrId) => {
  const participant = await Participant.findOne({ qrId });
  if (!participant) throw new AppError('Participant not found', 404);

  const hasInitial = await ScanLog.findOne({ participantId: participant._id, breakType: 'INITIAL' });
  if (!hasInitial) {
    throw new AppError('Participant is registered but requires an Initial Entry scan first.', 400);
  }

  if (participant.isInsideVenue) {
    throw new AppError('Participant is already inside the venue', 400);
  }

  const session = await mongoose.startSession();
  try {
    return await session.withTransaction(async () => {
      // Load configurable rules for short break
      const { maxShortBreaks, maxShortBreakDurationMins } = await loadSettings(session);

      // Find the last EXIT log
      const lastExit = await ScanLog.findOne({
        participantId: participant._id,
        scanType: 'EXIT'
      }).sort({ timestamp: -1 }).session(session);

      if (!lastExit) {
        throw new AppError('No prior EXIT log found to match an ENTRY.', 400);
      }

      const now = new Date();
      const durationMins = Math.round((now - lastExit.timestamp) / 60000);
      const breakType = lastExit.breakType;

      let violationFlag = false;
      const violationReasons = [];

      // ── LUNCH BREAK RULES ─────────────────────────────────────────────────────
      if (breakType === 'LUNCH') {
        const allLunchExits = await ScanLog.countDocuments({
          participantId: participant._id,
          scanType: 'EXIT',
          breakType: 'LUNCH'
        }).session(session);

        if (allLunchExits > 2) {
          violationFlag = true;
          violationReasons.push(`Maximum of 2 lunch breaks exceeded.`);
        }

        if (durationMins > 45) {
          violationFlag = true;
          violationReasons.push(`Lunch break exceeded 45 min limit (was ${durationMins} mins).`);
        }
      }

      // ── BREAKFAST BREAK RULES ──────────────────────────────────────────────────
      else if (breakType === 'BREAKFAST') {
        const allBreakfastExits = await ScanLog.countDocuments({
          participantId: participant._id,
          scanType: 'EXIT',
          breakType: 'BREAKFAST'
        }).session(session);

        if (allBreakfastExits > 2) {
          violationFlag = true;
          violationReasons.push(`Maximum of 2 breakfast breaks exceeded.`);
        }

        if (durationMins > 45) {
          violationFlag = true;
          violationReasons.push(`Breakfast break exceeded 45 min limit (was ${durationMins} mins).`);
        }
      }

      // ── SHORT BREAK RULES ─────────────────────────────────────────────────────
      else if (breakType === 'SHORT') {
        const allShortExits = await ScanLog.countDocuments({
          participantId: participant._id,
          scanType: 'EXIT',
          breakType: 'SHORT'
        }).session(session);

        if (allShortExits > maxShortBreaks) {
          violationFlag = true;
          violationReasons.push(`Maximum of ${maxShortBreaks} short breaks exceeded.`);
        }

        if (durationMins > maxShortBreakDurationMins) {
          violationFlag = true;
          violationReasons.push(`Short break exceeded ${maxShortBreakDurationMins} min limit (was ${durationMins} mins).`);
        }
      }

      // Create Entry Log
      const entryLog = await ScanLog.create([{
        participantId: participant._id,
        scanType: 'ENTRY',
        breakType,
        violationFlag,
        violationReason: violationReasons.join(' ') || undefined,
        breakDurationMins: durationMins,
      }], { session });

      participant.isInsideVenue = true;
      await participant.save({ session });

      return { ...entryLog[0].toObject(), violationFlag, violationReason: violationReasons.join(' ') };
    });
  } finally {
    session.endSession();
  }
};
