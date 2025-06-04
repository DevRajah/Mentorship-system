const Mentor = require('../models/mentorModel');
const Mentee = require('../models/menteeModel');
const Pairing = require('../models/pairingModel');


function groupByField(pairs, mentorsList) {
  const result = {};

  for (const mentorName in pairs) {
    const mentor = mentorsList.find(m => m.name === mentorName);
    const stack = mentor?.stack || 'unknown';

    if (!result[stack]) result[stack] = {};
    result[stack][mentorName] = pairs[mentorName];
  }

  return result;
}


//This endpoint helps to pair according to stack
exports.runPairing = async (req, res) => {
  try {
    const stack = req.query.stack;

    const existingPairings = await Pairing.find(stack ? { stack } : {});
    const pairedMentees = new Set(existingPairings.map(p => p.menteeName));

    const mentorCountMap = {};
    for (const p of existingPairings) {
      mentorCountMap[p.mentorName] = (mentorCountMap[p.mentorName] || 0) + 1;
    }

    const mentors = (stack ? await Mentor.find({ stack }) : await Mentor.find());
    const mentees = (stack ? await Mentee.find({ stack }) : await Mentee.find());

    const unpairedMentees = mentees.filter(m => !pairedMentees.has(m.name));
    const newPairs = {};
    const unmatched = [];

    const mentorMap = {};
    for (const mentor of mentors) {
      const currentCount = mentorCountMap[mentor.name] || 0;
      if (!mentorMap[mentor.stack]) mentorMap[mentor.stack] = [];

      mentorMap[mentor.stack].push({
        ...mentor._doc,
        menteeCount: currentCount,
        assigned: currentCount > 0 ? true : false
      });

      newPairs[mentor.name] = [];
    }

    const firstPassMentees = [...unpairedMentees];
    const secondPassMentees = [];

    // Here, we ensure all mentors get at least one mentee ===
    for (const mentor of mentors) {
      if ((mentorCountMap[mentor.name] || 0) >= 2) continue;

      const matchIndex = firstPassMentees.findIndex(
        m => m.stack === mentor.stack && !pairedMentees.has(m.name)
      );

      if (matchIndex !== -1) {
        const mentee = firstPassMentees.splice(matchIndex, 1)[0];
        mentorCountMap[mentor.name] = (mentorCountMap[mentor.name] || 0) + 1;
        newPairs[mentor.name].push(mentee.name);

        // await Pairing.create({
        //   mentorName: mentor.name,
        //   menteeName: mentee.name,
        //   stack: mentee.stack
        // });
        await Pairing.findOneAndUpdate(
          { mentorName: mentor.name, menteeName: mentee.name },
          { $setOnInsert: { stack: mentee.stack } },
          { upsert: true, new: true }
        );

        await Mentor.updateOne(
          { name: mentor.name },
          { $addToSet: { mentees: mentee.name } }
        );
        
        

        pairedMentees.add(mentee.name);
      }
    }

    //Here, we assign remaining mentees to mentors with < 2
    secondPassMentees.push(...firstPassMentees);

    for (const mentee of secondPassMentees) {
      const mentorsInField = mentorMap[mentee.stack] || [];

      const mentor = mentorsInField.find(m => mentorCountMap[m.name] < 2);

      if (mentor) {
        mentorCountMap[mentor.name]++;
        newPairs[mentor.name].push(mentee.name);

        // await Pairing.create({
        //   mentorName: mentor.name,
        //   menteeName: mentee.name,
        //   stack: mentee.stack
        // });

        await Pairing.findOneAndUpdate(
          { mentorName: mentor.name, menteeName: mentee.name },
          { $setOnInsert: { stack: mentee.stack } },
          { upsert: true, new: true }
        );

        await Mentor.updateOne(
          { name: mentor.name },
          { $addToSet: { mentees: mentee.name } }
        );
        
        

        pairedMentees.add(mentee.name);
      } else {
        unmatched.push(mentee.name);
      }
    }

    res.status(200).json({
      success: true,
      message: unmatched.length > 0
        ? `Pairing done for ${stack || 'all fields'} with unmatched mentees`
        : `Fair pairing completed for ${stack || 'all fields'}`,
        data: {
          groupedPairs: groupByField(newPairs, mentors),
          unmatched
        }
        
    });

  } catch (err) {
    console.error("Pairing Error:", err);
    res.status(500).json({
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

    if (!pairings.length) {
      return res.status(200).json({
        success: true,
        message: `No pairings${stack ? ' for ' + stack : ''} found`,
        data: []
      });
    }

    // Group pairings by mentorName
    const grouped = {};
    for (const p of pairings) {
      if (!grouped[p.mentorName]) {
        grouped[p.mentorName] = {
          mentor: p.mentorName,
          stack: p.stack,
          mentees: []
        };
      }
      grouped[p.mentorName].mentees.push(p.menteeName);
    }

    // Fetch mentor emails
    const mentorNames = Object.keys(grouped);
    const mentors = await Mentor.find({ name: { $in: mentorNames } });

    // Add email to each mentor group
    for (const mentor of mentors) {
      if (grouped[mentor.name]) {
        grouped[mentor.name].email = mentor.email;
      }
    }

    // Convert to array
    const groupedArray = Object.values(grouped);

    return res.status(200).json({
      success: true,
      message: `Pairings${stack ? ' for ' + stack : ''} retrieved successfully`,
      data: groupedArray
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