const express = require('express');
const router = express.Router();
const { markAsWatched, getWatchedMovies, updateWatched, removeWatched } = require('../controllers/watchedController');
const auth = require('../middleware/auth');

// Mark a movie as watched
router.post('/', auth, markAsWatched);
// Get all watched movies for the user
router.get('/', auth, getWatchedMovies);
// Update watched entry (rating/review)
router.put('/:watchedId', auth, updateWatched);
// Remove watched entry
router.delete('/:watchedId', auth, removeWatched);

module.exports = router; 