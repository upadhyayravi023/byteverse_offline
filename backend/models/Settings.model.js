const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  singletonId: { type: String, default: 'STATIC_SETTINGS', unique: true },

  // Short break rules
  maxShortBreaks:          { type: Number, default: 3  },  // count limit
  maxShortBreakDurationMins: { type: Number, default: 30 }, // per-break duration limit (mins)

  // Sleep break rules
  maxSleepBreakDurationMins: { type: Number, default: 240 }, // per-break duration limit (mins) — 4 hrs
});

module.exports = mongoose.model('Settings', settingsSchema);
