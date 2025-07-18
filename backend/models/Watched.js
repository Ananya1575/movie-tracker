const mongoose = require('mongoose');

const watchedSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  movieId: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie', required: true },
  watchedAt: { type: Date, default: Date.now },
  rating: { type: Number, min: 1, max: 10 },
  reviewText: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Watched', watchedSchema); 