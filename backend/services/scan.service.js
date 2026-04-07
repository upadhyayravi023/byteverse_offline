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
    maxShortBreaks:            settings.maxShortBreaks            ?? 3,
    maxShortBreakDurationMins: settings.maxShortBreakDurationMins ?? 30,
    maxSleepBreakDurationMins: settings.maxSleepBreakDurationMins ?? 240,
  };
};

/**
 * Perform INITIAL scan
 */
exports.initialScan = async (qrId) => {
  const participant = await Participant.findOne({ qrId });
  if (!participant) throw new AppError('Participant not found', 404);

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
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
    await session.commitTransaction();
    return log[0];
  } catch (err) {
    await session.abortTransaction();
    throw err;
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

  if (!participant.isInsideVenue) {
    throw new AppError('Participant is already outside the venue', 400);
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const log = await ScanLog.create([{
      participantId: participant._id,
      scanType: 'EXIT',
      breakType,
    }], { session });

    participant.isInsideVenue = false;
    await participant.save({ session });
    await session.commitTransaction();
    return log[0];
  } catch (err) {
    await session.abortTransaction();
    throw err;
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

  if (participant.isInsideVenue) {
    throw new AppError('Participant is already inside the venue', 400);
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    // Load configurable rules
    const { maxShortBreaks, maxShortBreakDurationMins, maxSleepBreakDurationMins } = await loadSettings(session);

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

    // ── SLEEP BREAK RULES ─────────────────────────────────────────────────────
    if (breakType === 'SLEEP') {
      // Rule 1: Only one sleep break allowed
      const allSleepExits = await ScanLog.countDocuments({
        participantId: participant._id,
        scanType: 'EXIT',
        breakType: 'SLEEP'
      }).session(session);

      if (allSleepExits > 1) {
        violationFlag = true;
        violationReasons.push(`Sleep break already taken previously (only 1 allowed).`);
      }

      // Rule 2: Sleep break duration exceeded configured limit
      if (durationMins > maxSleepBreakDurationMins) {
        violationFlag = true;
        violationReasons.push(
          `Sleep break exceeded ${maxSleepBreakDurationMins} min limit (was ${durationMins} mins).`
        );
      }
    }

    // ── SHORT BREAK RULES ─────────────────────────────────────────────────────
    else if (breakType === 'SHORT') {
      const allShortExits = await ScanLog.countDocuments({
        participantId: participant._id,
        scanType: 'EXIT',
        breakType: 'SHORT'
      }).session(session);

      // Rule 1: Short break count exceeded
      if (allShortExits > maxShortBreaks) {
        violationFlag = true;
        violationReasons.push(`Maximum of ${maxShortBreaks} short breaks exceeded.`);
      }

      // Rule 2: This individual short break duration exceeded configured limit
      if (durationMins > maxShortBreakDurationMins) {
        violationFlag = true;
        violationReasons.push(
          `Short break exceeded ${maxShortBreakDurationMins} min limit (was ${durationMins} mins).`
        );
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
    await session.commitTransaction();

    return { ...entryLog[0].toObject(), violationFlag, violationReason: violationReasons.join(' ') };
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};
