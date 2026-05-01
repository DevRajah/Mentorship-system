
const Mentor = require('../models/mentorModel');

exports.createMentor = async (req, res) => {
  try {
    const data = req.body;

    // Case: array of mentors
    if (Array.isArray(data)) {
      if (!data.length) {Mentor
        return res.status(400).json({
          success: false,
          message: "Mentors list cannot be empty"
        });
      }

      const valid = data.every(m => m.name && m.stack);
      if (!valid) {
        return res.status(400).json({
          success: false,
          message: "Each mentor must have a name and stack"
        });
      }

      const mentors = await Mentor.insertMany(data);
      return res.status(201).json({
        success: true,
        message: "Mentors registered successfully",
        count: mentors.length,
        data: mentors
      });
    }

    // Case: Single mentee object
    const { name, phoneNumber, stack } = data;

    if (!name || !stack) {
      return res.status(400).json({
        success: false,
        message: "Name and stack are required"
      });
    }

    const mentee = await Mentor.create({ name,phoneNumber, stack });

    return res.status(201).json({
      success: true,
      message: "Mentor registered successfully",
      data: mentee
    });

  } catch (err) {
    console.error("Create Mentee Error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to register mentee(s)",
      error: err.message
    });
  }
};



exports.getMentors = async (req, res) => {
  try {
    const mentors = await Mentor.find();

    return res.status(200).json({
      success: true,
      message: mentors.length
        ? "Mentees retrieved successfully"
        : "No mentees found",
      data: mentors
    });
  } catch (err) {
    console.error("Get Mentees Error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve mentees",
      error: err.message
    });
  }
};
