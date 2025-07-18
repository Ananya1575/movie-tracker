const Watched = require('../models/Watched');

// Mark a movie as watched (with optional rating/review)
const markAsWatched = async (req, res) => {
  const { movieId, rating, reviewText } = req.body;
  const userId = req.user.userId;

  try {
    // Prevent duplicate watched entries
    const existing = await Watched.findOne({ userId, movieId });
    if (existing) {
      return res.status(400).json({ message: 'Movie already marked as watched' });
    }
    const watched = new Watched({ userId, movieId, rating, reviewText });
    await watched.save();
    res.status(201).json(watched);
  } catch (error) {
    res.status(500).json({ message: 'Error marking as watched', error });
  }
};

// Get all watched movies for a user
const getWatchedMovies = async (req, res) => {
  const userId = req.user.userId;
  try {
    const watched = await Watched.find({ userId }).populate('movieId');
    res.json(watched);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching watched movies', error });
  }
};

// Update watched entry (rating/review)
const updateWatched = async (req, res) => {
  const { watchedId } = req.params;
  const { rating, reviewText } = req.body;
  const userId = req.user.userId;
  try {
    const watched = await Watched.findOneAndUpdate(
      { _id: watchedId, userId },
      { rating, reviewText },
      { new: true }
    );
    if (!watched) return res.status(404).json({ message: 'Watched entry not found' });
    res.json(watched);
  } catch (error) {
    res.status(500).json({ message: 'Error updating watched entry', error });
  }
};

// Remove watched entry
const removeWatched = async (req, res) => {
  const { watchedId } = req.params;
  const userId = req.user.userId;
  try {
    const result = await Watched.deleteOne({ _id: watchedId, userId });
    if (result.deletedCount === 0) return res.status(404).json({ message: 'Watched entry not found' });
    res.json({ message: 'Watched entry removed' });
  } catch (error) {
    res.status(500).json({ message: 'Error removing watched entry', error });
  }
};

module.exports = { markAsWatched, getWatchedMovies, updateWatched, removeWatched }; 