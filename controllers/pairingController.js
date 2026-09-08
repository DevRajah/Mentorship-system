const Mentor = require("../models/mentorModel");
const Mentee = require("../models/menteeModel");
const Pairing = require("../models/pairingModel");

const escapeRegex = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

//This endpoint helps to pair according to stack, randomly
exports.runPairing = async (req, res) => {
  try {
    const stack = req.query.stack;
    if (!stack) {
      return res.status(400).json({
        success: false,
        message: "Please provide a stack (e.g. ?stack=Frontend)",
      });
    }

    const stackRegex = new RegExp(`^${escapeRegex(stack.trim())}$`, "i");

    const mentors = await Mentor.find({ stack: stackRegex });
    const mentees = await Mentee.find({ stack: stackRegex });
    const pairings = await Pairing.find({ stack: stackRegex });

    // const mentors = await Mentor.find({ stack });
    // const mentees = await Mentee.find({ stack });
    // const pairings = await Pairing.find({ stack });

    const pairedMentees = new Set(pairings.map((p) => p.menteeName));
    const unpairedMentees = mentees.filter((m) => !pairedMentees.has(m.name));
    if (unpairedMentees.length === 0) {
      return res.status(200).json({
        success: false,
        message: `No more unpaired mentees available in ${stack}.`,
      });
    }

    // Count pairings per mentor
    const mentorMenteeCount = {};
    for (const p of pairings) {
      mentorMenteeCount[p.mentorName] =
        (mentorMenteeCount[p.mentorName] || 0) + 1;
    }

    // Separate mentors into two groups
    const mentorsWith0 = mentors.filter(
      (m) => (mentorMenteeCount[m.name] || 0) === 0,
    );
    const mentorsWith1 = mentors.filter(
      (m) => (mentorMenteeCount[m.name] || 0) === 1,
    );

    let availableMentors = mentorsWith0.length ? mentorsWith0 : mentorsWith1;
    if (!availableMentors.length) {
      return res.status(200).json({
        success: false,
        message: `All mentors in ${stack} have been paired with 2 mentees.`,
      });
    }

    // Pick random mentor
    const randomMentor =
      availableMentors[Math.floor(Math.random() * availableMentors.length)];

    // Pick first unpaired mentee (or random if you want, na your choice)
    const mentee = unpairedMentees[0];

    // Pair them
    await Pairing.create({
      mentorName: randomMentor.name,
      menteeName: mentee.name,
      stack,
    });

    await Mentor.updateOne(
      { name: randomMentor.name },
      { $addToSet: { mentees: mentee.name } },
    );

    return res.status(200).json({
      success: true,
      message: `Paired ${randomMentor.name} with ${mentee.name}`,
      data: {
        mentor: randomMentor.name,
        phone: randomMentor.phoneNumber,
        stack,
        mentee: mentee.name,
      },
    });
  } catch (err) {
    console.error("Pairing Error:", err);
    res.status(500).json({
      success: false,
      message: "Pairing failed",
      error: err.message,
    });
  }
};

exports.resetPairings = async (req, res) => {
  try {
    // Delete all pairings
    await Pairing.deleteMany({});

    // Clear mentor.mentees arrays
    await Mentor.updateMany({}, { $set: { mentees: [] } });

    return res.status(200).json({
      success: true,
      message: "All pairings have been reset. Mentors are now unpaired.",
    });
  } catch (err) {
    console.error("Reset Pairings Error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to reset pairings",
      error: err.message,
    });
  }
};

//With this endpoint, we are gonna be able to fetch according to stack, or just fetch all pairings, and also return mentors with 1/2 mentees
exports.getPairings = async (req, res) => {
  try {
    const stack = req.query.stack;
    const query = stack ? { stack } : {};

    const pairings = await Pairing.find(query);

    if (!pairings.length) {
      return res.status(200).json({
        success: true,
        message: `No pairings${stack ? " for " + stack : ""} found`,
        data: [],
      });
    }

    // Group pairings by mentorName
    const grouped = {};
    for (const p of pairings) {
      if (!grouped[p.mentorName]) {
        grouped[p.mentorName] = {
          mentor: p.mentorName,
          stack: p.stack,
          mentees: [],
        };
      }
      grouped[p.mentorName].mentees.push(p.menteeName);
    }

    // Fetch mentor phone numbers
    const mentorNames = Object.keys(grouped);
    const mentors = await Mentor.find({ name: { $in: mentorNames } });

    // Add phone and menteeCount to each mentor group
    for (const mentor of mentors) {
      if (grouped[mentor.name]) {
        grouped[mentor.name].phone = mentor.phoneNumber;
        grouped[mentor.name].menteeCount = grouped[mentor.name].mentees.length;
      }
    }

    const groupedArray = Object.values(grouped);

    return res.status(200).json({
      success: true,
      message: `Pairings${stack ? " for " + stack : ""} retrieved successfully`,
      data: groupedArray,
    });
  } catch (err) {
    console.error("Get Pairings Error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve pairings",
      error: err.message,
    });
  }
};

// exports.getPairings = async (req, res) => {
//   try {
//     const stack = req.query.stack;
//     const query = stack ? { stack } : {};

//     const pairings = await Pairing.find(query);

//     if (!pairings.length) {
//       return res.status(200).json({
//         success: true,
//         message: `No pairings${stack ? ' for ' + stack : ''} found`,
//         data: []
//       });
//     }

//     // Group pairings by mentorName
//     const grouped = {};
//     for (const p of pairings) {
//       if (!grouped[p.mentorName]) {
//         grouped[p.mentorName] = {
//           mentor: p.mentorName,
//           stack: p.stack,
//           mentees: []
//         };
//       }
//       grouped[p.mentorName].mentees.push(p.menteeName);
//     }

//     // Fetch mentor emails
//     const mentorNames = Object.keys(grouped);
//     const mentors = await Mentor.find({ name: { $in: mentorNames } });

//     // Add phone to each mentor group
//     for (const mentor of mentors) {
//       if (grouped[mentor.name]) {
//         grouped[mentor.name].phone = mentor.phone;
//       }
//     }

//     // Convert to array
//     const groupedArray = Object.values(grouped);

//     return res.status(200).json({
//       success: true,
//       message: `Pairings${stack ? ' for ' + stack : ''} retrieved successfully`,
//       data: groupedArray
//     });

//   } catch (err) {
//     console.error("Get Pairings Error:", err);
//     return res.status(500).json({
//       success: false,
//       message: "Failed to retrieve pairings",
//       error: err.message
//     });
//   }
// };
