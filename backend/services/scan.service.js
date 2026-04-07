const mongoose = require('mongoose');
const Participant = require('../models/Participant.model');
const ScanLog = require('../models/ScanLog.model');
const Settings = require('../models/Settings.model');
const AppError = require('../utils/AppError');

/**
 * Perform INITIAL scan
 */
exports.initialScan = async (qrId) => {
  const participant = await Participant.findOne({ qrId });
  if (!participant) throw new AppError('Participant not found', 404);

  // atomic start
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const existingLog = await ScanLog.findOne({ participantId: participant._id, scanType: 'ENTRY', breakType: 'INITIAL' }).session(session);
    if (existingLog) {
       throw new AppError('Initial scan already completed', 400);
    }
    
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
    // Determine the last EXIT
    const lastExit = await ScanLog.findOne({ 
      participantId: participant._id, 
      scanType: 'EXIT' 
    }).sort({ timestamp: -1 }).session(session);

    if (!lastExit) {
      throw new AppError('No prior EXIT log found to match an ENTRY.', 400);
    }

    const now = new Date();
    // Duration in minutes
    const durationMins = Math.floor((now - lastExit.timestamp) / 60000);
    const breakType = lastExit.breakType;

    let violationFlag = false;
    let violationReason = '';

    // RULE ENGINE EVALUATION
    if (breakType === 'SLEEP') {
      // 1. Is this the first sleep break? 
      // Check prior exits for sleep break
      const allSleepExits = await ScanLog.find({
        participantId: participant._id,
        scanType: 'EXIT',
        breakType: 'SLEEP'
      }).session(session);

      if (allSleepExits.length > 1) {
        violationFlag = true;
        violationReason += 'Sleep break already taken previously. ';
      }

      if (durationMins > 240) {
        violationFlag = true;
        violationReason += `Sleep break exceeded 4 hours (was ${durationMins} mins). `;
      }
    } else if (breakType === 'SHORT') {
      // Find all past short exits
      const allShortExits = await ScanLog.find({
        participantId: participant._id,
        scanType: 'EXIT',
        breakType: 'SHORT'
      }).sort({ timestamp: 1 }).session(session);

      let settings = await Settings.findOne({ singletonId: 'STATIC_SETTINGS' }).session(session);
      const maxShort = settings ? settings.maxShortBreaks : 3;

      if (allShortExits.length > maxShort) {
        violationFlag = true;
        violationReason += `Maximum of ${maxShort} short breaks exceeded. `;
      }

      if (durationMins > 30) {
         violationFlag = true;
         violationReason += `Short break exceeded 30 minutes (was ${durationMins} mins). `;
      }

      // Calculate cumulative short break duration from prior logs
      // Need all entry-exit pairs for short breaks
      let cumulativeMs = 0;
      const allLogs = await ScanLog.find({
        participantId: participant._id,
        breakType: 'SHORT'
      }).sort({ timestamp: 1 }).session(session);

      let currentShortExit = null;
      for (const log of allLogs) {
        if (log.scanType === 'EXIT') {
           currentShortExit = log;
        } else if (log.scanType === 'ENTRY' && currentShortExit) {
           cumulativeMs += (log.timestamp - currentShortExit.timestamp);
           currentShortExit = null;
        }
      }
      
      // Add the current duration that is about to be grouped
      const cumulativeMins = Math.floor(cumulativeMs / 60000) + durationMins;

      if (cumulativeMins > 90) {
        violationFlag = true;
        violationReason += `Total short break time exceeded 90 minutes (was ${cumulativeMins} mins). `;
      }
    }

    // Create Entry Log
    const entryLog = await ScanLog.create([{
      participantId: participant._id,
      scanType: 'ENTRY',
      breakType,
      violationFlag,
      violationReason: violationReason.trim() || undefined
    }], { session });

    participant.isInsideVenue = true;
    await participant.save({ session });

    await session.commitTransaction();

    return entryLog[0];
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};
