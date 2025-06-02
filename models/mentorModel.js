
const mongoose = require('mongoose');

const mentorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  stack: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Mentor', mentorSchema);
