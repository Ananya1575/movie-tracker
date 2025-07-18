const Watchlist = require('../models/Watchlist');

const addToWatchlist = async (req, res) => {
  const { movieId } = req.body;
  const userId = req.user.id;

  try {
    const existing = await Watchlist.findOne({ userId, movieId });
    if (existing) {
      return res.status(400).json({ message: 'Movie already in watchlist' });
    }
    const watchlistItem = new Watchlist({ userId, movieId });
    await watchlistItem.save();
    res.status(201).json(watchlistItem);
  } catch (error) {
    res.status(500).json({ message: 'Error adding to watchlist', error });
  }
};

const getWatchlist = async (req, res) => {
  const userId = req.user.id;

  try {
    const watchlist = await Watchlist.find({ userId }).populate('movieId');
    res.json(watchlist);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching watchlist', error });
  }
};

const removeFromWatchlist = async (req, res) => {
  const { movieId } = req.params;
  const userId = req.user.id;

  try {
    await Watchlist.deleteOne({ userId, movieId });
    res.json({ message: 'Movie removed from watchlist' });
  } catch (error) {
    res.status(500).json({ message: 'Error removing from watchlist', error });
  }
};

module.exports = { addToWatchlist, getWatchlist, removeFromWatchlist };