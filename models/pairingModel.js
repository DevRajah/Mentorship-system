
const mongoose = require('mongoose');

const pairingSchema = new mongoose.Schema({
  mentorName: { type: String, required: true },
  menteeName: { type: String, required: true },
  stack: { type: String, required: true }
}, { timestamps: true });

pairingSchema.index({ mentorName: 1, menteeName: 1 }, { unique: true });

module.exports = mongoose.model('Pairing', pairingSchema);
