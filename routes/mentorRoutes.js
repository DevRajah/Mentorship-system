
const express = require('express');
const router = express.Router();
const { createMentor, getMentors } = require('../controllers/mentorController');

router.post('/post-mentors', createMentor);
router.get('/get-mentors', getMentors);

module.exports = router;
