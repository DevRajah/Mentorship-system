
const express = require('express');
const router = express.Router();
const { runPairing, getPairings,resetPairings } = require('../controllers/pairingController');

router.get('/run', runPairing);
router.get('/get-pairings', getPairings);
router.delete('/reset', resetPairings);

module.exports = router;
