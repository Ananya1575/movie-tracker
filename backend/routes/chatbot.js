const express = require('express');
const router = express.Router();
const { getRecommendations } = require('../controllers/chatbotController');
const auth = require('../middleware/auth');

// Get personalized recommendations
router.get('/recommendations', auth, getRecommendations);

module.exports = router; 