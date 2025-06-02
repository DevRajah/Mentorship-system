
const express = require('express');
const router = express.Router();
const { createMentee, getMentees } = require('../controllers/menteeController');

router.post('/post-mentees', createMentee);
router.get('/get-mentees', getMentees);

module.exports = router;
