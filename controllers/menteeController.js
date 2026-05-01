
const Mentee = require('../models/menteeModel');



exports.createMentee = async (req, res) => {
  try {
    const data = req.body;

    // Case: array of mentees
    if (Array.isArray(data)) {
      if (!data.length) {
        return res.status(400).json({
          success: false,
          message: "Mentees list cannot be empty"
        });
      }

      const valid = data.every(m => m.name && m.stack);
      if (!valid) {
        return res.status(400).json({
          success: false,
          message: "Each mentee must have a name and stack"
        });
      }

      const mentees = await Mentee.insertMany(data);
      return res.status(201).json({
        success: true,
        message: "Mentees registered successfully",
        count: mentees.length,
        data: mentees
      });
    }

    // Case: Single mentee object
    const { name,email, stack } = data;

    if (!name || !stack) {
      return res.status(400).json({
        success: false,
        message: "Name and stack are required"
      });
    }

    const mentee = await Mentee.create({ name, email, stack });

    return res.status(201).json({
      success: true,
      message: "Mentee registered successfully",
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


exports.getMentees = async (req, res) => { 
  try {
    const mentees = await Mentee.find();

    return res.status(200).json({
      success: true,
      message: mentees.length
        ? "Mentees retrieved successfully"
        : "No mentees found",
      data: mentees
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
