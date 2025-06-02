
const Mentor = require('../models/mentorModel');
const Mentee = require('../models/menteeModel');
const Pairing = require('../models/pairingModel');

exports.runPairing = async (req, res) => {
  try {
    const mentors = await Mentor.find();
    const mentees = await Mentee.find();

    const pairs = {};
    const unmatched = [];
    const mentorMap = {};

    for (const mentor of mentors) {
      if (!mentorMap[mentor.stack]) mentorMap[mentor.stack] = [];
      mentorMap[mentor.stack].push({ ...mentor._doc, mentees: [] });
      pairs[mentor.name] = [];
    }

    for (const mentee of mentees) {
      const fieldMentors = mentorMap[mentee.stack] || [];
      const mentor = fieldMentors.find(m => m.mentees.length < 2);

      if (mentor) {
        mentor.mentees.push(mentee.name);
        pairs[mentor.name].push(mentee.name);

        const exists = await Pairing.findOne({
          mentorName: mentor.name,
          menteeName: mentee.name
        });

        if (!exists) {
          await Pairing.create({
            mentorName: mentor.name,
            menteeName: mentee.name,
            stack: mentee.stack
          });
        }
      } else {
        unmatched.push(mentee);
      }
    }

    res.status(200).json({
      success: true,
      message: unmatched.length > 0 ? "Pairing done with unmatched mentees" : "Pairing completed",
      data: { pairs, unmatched }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getPairings = async (req, res) => {
  try {
    const pairings = await Pairing.find();
    res.status(200).json({ success: true, message: "Pairings fetched", data: pairings });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
