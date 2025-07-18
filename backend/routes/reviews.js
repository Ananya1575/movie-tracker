const express = require('express');
const router = express.Router();
const { postReview, getReviewsByMovie, getUserReviews } = require('../controllers/reviewController');
const auth = require('../middleware/auth');

router.post('/', auth, postReview);
router.get('/:movieId', getReviewsByMovie);
router.get('/user', auth, getUserReviews);

module.exports = router;