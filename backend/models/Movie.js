const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
  tmdbId: { type: Number, required: true, unique: true },
  title: { type: String, required: true },
  poster: { type: String },
  releaseYear: { type: Number },
  synopsis: { type: String },
  language: { type: String, enum: ['English', 'Hindi', 'Kannada', 'Telugu', 'Tamil', 'Malayalam', ''] },
  genres: [{ type: String, enum: ['Action', 'Thriller', 'Romance', 'Documentary', 'Horror', ''] }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Movie', movieSchema);