
const mongoose = require('mongoose');

const mentorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  stack: { type: String, required: true },
  // email: {type: String, required: true},
  phoneNumber: {type: String, required: true},
  mentees: [String]
}, { timestamps: true });

module.exports = mongoose.model('Mentor', mentorSchema);
