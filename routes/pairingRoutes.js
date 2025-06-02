
const express = require('express');
const router = express.Router();
const { runPairing, getPairings } = require('../controllers/pairingController');

router.get('/run', runPairing);
router.get('/get-pairings', getPairings);

module.exports = router;
