const Movie = require('../models/Movie');

const getMovies = async (req, res) => {
  try {
    const { language, genre, search } = req.query;
    let query = {};

    if (language) query.language = language;
    if (genre) query.genres = { $in: [genre] };
    if (search) query.title = { $regex: search, $options: 'i' };

    const movies = await Movie.find(query);
    res.json(movies);
  } catch (error) {
    console.error('Error in getMovies:', error);
    res.status(500).json({ message: 'Error fetching movies', error: error.message });
  }
};

const getMovieById = async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }
    res.json(movie);
  } catch (error) {
    console.error('Error in getMovieById:', error);
    res.status(500).json({ message: 'Error fetching movie', error: error.message });
  }
};

module.exports = { getMovies, getMovieById };