const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  // using a singleton identifier
  singletonId: { type: String, default: 'STATIC_SETTINGS', unique: true },
  maxShortBreaks: { type: Number, default: 3 },
});

module.exports = mongoose.model('Settings', settingsSchema);
