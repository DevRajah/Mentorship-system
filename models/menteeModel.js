
const mongoose = require('mongoose');

const menteeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  stack: { type: String, required: true },
   //email: {type: String, required: true},
  //phone: {type: String, required: true},
}, { timestamps: true }); 

module.exports = mongoose.model('Mentee', menteeSchema);
