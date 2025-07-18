const Review = require('../models/Review');
const auth = require('../middleware/auth');

const postReview = async (req, res) => {
  const { movieId, rating, reviewText } = req.body;
  const userId = req.user.userId;

  try {
    const review = new Review({
      userId,
      movieId,
      rating,
      reviewText
    });
    await review.save();
    res.status(201).json(review);
  } catch (error) {
    console.error('Error posting review:', error);
    res.status(500).json({ message: 'Error posting review', error: error.message });
  }
};

const getReviewsByMovie = async (req, res) => {
  try {
    const reviews = await Review.find({ movieId: req.params.movieId })
      .populate('userId', 'name')
      .populate('movieId', 'title poster');
    res.json(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ message: 'Error fetching reviews', error: error.message });
  }
};

const getUserReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ userId: req.user.userId })
      .populate('movieId', 'title poster');
    res.json(reviews);
  } catch (error) {
    console.error('Error fetching user reviews:', error);
    res.status(500).json({ message: 'Error fetching user reviews', error: error.message });
  }
};

module.exports = { postReview, getReviewsByMovie, getUserReviews };