const Mentor = require('../models/mentorModel');
const Mentee = require('../models/menteeModel');
const Pairing = require('../models/pairingModel');

//This endpoint helps to pair according to stack
exports.runPairing = async (req, res) => {
  try {
    const stack = req.query.stack;

    // Let's load existing pairings
    const existingPairings = await Pairing.find(stack ? { stack } : {});
    const pairedMentees = new Set(existingPairings.map(p => p.menteeName));

    const mentorCountMap = {};
    for (const pairing of existingPairings) {
      mentorCountMap[pairing.mentorName] = (mentorCountMap[pairing.mentorName] || 0) + 1;
    }

    // This part filers mentors who still have slots less than 2
    const mentors = (stack ? await Mentor.find({ stack }) : await Mentor.find())
      .filter(m => (mentorCountMap[m.name] || 0) < 2);

    //This part filters mentees who are not yet paired
    const mentees = (stack ? await Mentee.find({ stack }) : await Mentee.find())
      .filter(m => !pairedMentees.has(m.name));

    // We then build a map of available mentors by stack
    const mentorMap = {};
    for (const mentor of mentors) {
      if (!mentorMap[mentor.stack]) mentorMap[mentor.stack] = [];
      mentorMap[mentor.stack].push({
        ...mentor._doc,
        menteeCount: mentorCountMap[mentor.name] || 0
      });
    }

    const newPairs = {};
    const unmatched = [];

    for (const mentee of mentees) {
      const candidates = mentorMap[mentee.stack] || [];
      const mentor = candidates.find(m => m.menteeCount < 2);

      if (mentor) {
        mentor.menteeCount++;
        newPairs[mentor.name] = newPairs[mentor.name] || [];
        newPairs[mentor.name].push(mentee.name);

        await Pairing.create({
          mentorName: mentor.name,
          menteeName: mentee.name,
          stack: mentee.stack
        });
      } else {
        unmatched.push(mentee.name);
      }
    }

    return res.status(200).json({
      success: true,
      message: unmatched.length > 0
        ? `Pairing done for ${stack || 'all stacks'} with unmatched mentees`
        : `Pairing completed for ${stack || 'all stacks'}`,
      data: {
        newPairs,
        unmatched
      }
    });

  } catch (err) {
    console.error("Pairing Error:", err);
    return res.status(500).json({
      success: false,
      message: "Pairing failed",
      error: err.message
    });
  }
};



//With this endpoint, we are gonna be able to fetch according to stack, or just fetch all pairings
exports.getPairings = async (req, res) => {
  try {
    const stack = req.query.stack;

    const query = stack ? { stack } : {};
    const pairings = await Pairing.find(query);

    return res.status(200).json({
      success: true,
      message: pairings.length
        ? `Pairings${stack ? ' for ' + stack : ''} retrieved successfully`
        : `No pairings${stack ? ' for ' + stack : ''} found`,
      data: pairings
    });

  } catch (err) {
    console.error("Get Pairings Error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve pairings",
      error: err.message
    });
  }
};


//ignore the below. The above works better in real world lol


exports.runPairings = async (req, res) => {
  try {
    // const mentors = await Mentor.find();
    // const mentees = await Mentee.find();

    const stack = req.query.stack;

    //Here's where i ran the filter. Filter if stack is passed, otherwise get all
    const mentors = stack
      ? await Mentor.find({ stack })
      : await Mentor.find();

    const mentees = stack
      ? await Mentee.find({ stack })
      : await Mentee.find();


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
      message: unmatched.length > 0
        ? `Pairing done for ${stack || 'all stacks'}, some mentees unmatched`
        : `Pairing completed for ${stack || 'all stacks'}`,
      data: { pairs, unmatched }
    });

    // res.status(200).json({
    //   success: true,
    //   message: unmatched.length > 0 ? "Pairing done with unmatched mentees" : "Pairing completed",
    //   data: { pairs, unmatched }
    // });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getPairingss = async (req, res) => {
  try {
    const pairings = await Pairing.find();
    res.status(200).json({ success: true, message: "Pairings fetched", data: pairings });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};