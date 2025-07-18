const axios = require('axios');
const mongoose = require('mongoose');
const Movie = require('./models/Movie');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected for movie fetch'))
  .catch(err => console.error('MongoDB connection error:', err));

// TMDB API settings
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';
const languages = ['en', 'hi', 'kn', 'te', 'ta', 'ml'];
const genres = [28, 53, 10749, 99, 27]; // Action, Thriller, Romance, Documentary, Horror
const totalMoviesToFetch = 3500;
const moviesPerPage = 20;

// Map TMDB language codes to full names
const languageMap = {
  'en': 'English',
  'hi': 'Hindi',
  'kn': 'Kannada',
  'te': 'Telugu',
  'ta': 'Tamil',
  'ml': 'Malayalam'
};

const tmdbLocaleMap = {
  'en': 'en-US',
  'hi': 'hi-IN',
  'kn': 'kn-IN',
  'te': 'te-IN',
  'ta': 'ta-IN',
  'ml': 'ml-IN'
};

const today = new Date().toISOString().split('T')[0];
const minYear = new Date();
minYear.setFullYear(minYear.getFullYear() - 5); // 8 years ago
const minDate = minYear.toISOString().split('T')[0];

// Delay function to respect TMDB rate limits
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Fetch movies from TMDB with retry logic
async function fetchMoviesFromTMDB(language, genre, page, retries = 3) {
  try {
    const response = await axios.get(`${BASE_URL}/discover/movie`, {
      params: {
        api_key: TMDB_API_KEY,
        language: tmdbLocaleMap[language] || 'en-US',
        with_original_language: language,
        with_genres: genre,
        page: page,
        include_adult: false,
        'primary_release_date.gte': minDate,
        'primary_release_date.lte': today,
      },
    });
    return response.data.results;
  } catch (error) {
    if (retries > 0 && error.code === 'ECONNRESET') {
      console.log(`Retrying request for ${language}, genre ${genre}, page ${page}. Retries left: ${retries}`);
      await delay(1000); // Wait 1 second before retrying
      return fetchMoviesFromTMDB(language, genre, page, retries - 1);
    }
    console.error(`Error fetching movies for ${language}, genre ${genre}, page ${page}`, error.message);
    return [];
  }
}

// Map TMDB data to our schema
function mapTMDBMovieToSchema(tmdbMovie) {
  return {
    tmdbId: tmdbMovie.id,
    title: tmdbMovie.title,
    poster: tmdbMovie.poster_path ? `https://image.tmdb.org/t/p/w500${tmdbMovie.poster_path}` : null,
    releaseYear: tmdbMovie.release_date ? new Date(tmdbMovie.release_date).getFullYear() : null,
    synopsis: tmdbMovie.overview,
    language: languageMap[tmdbMovie.original_language] || tmdbMovie.original_language,
    genres: tmdbMovie.genre_ids.map(id => {
      switch (id) {
        case 28: return 'Action';
        case 53: return 'Thriller';
        case 10749: return 'Romance';
        case 99: return 'Documentary';
        case 27: return 'Horror';
        default: return null;
      }
    }).filter(genre => genre !== null),
  };
}

// Fetch and store movies
async function fetchAndStoreMovies() {
  // Clear the Movie collection before fetching
  await Movie.deleteMany({});
  let totalMoviesFetched = 0;
  for (const language of languages) {
    for (const genre of genres) {
      let page = 1;
      while (totalMoviesFetched < totalMoviesToFetch) {
        const movies = await fetchMoviesFromTMDB(language, genre, page);
        if (movies.length === 0) break;

        for (const movie of movies) {
          if (totalMoviesFetched >= totalMoviesToFetch) break;

          const movieData = mapTMDBMovieToSchema(movie);
          try {
            const existingMovie = await Movie.findOne({ tmdbId: movieData.tmdbId, language: movieData.language });
            if (!existingMovie) {
              await Movie.create(movieData);
              totalMoviesFetched++;
              console.log(`Stored movie: ${movieData.title} (${movieData.language})`);
            }
          } catch (error) {
            console.error(`Error storing movie ${movieData.title}:`, error.message);
          }
        }
        page++;
        await delay(250); // Respect TMDB rate limits (40 requests per 10 seconds)
      }
    }
  }
  console.log(`Fetched and stored ${totalMoviesFetched} movies.`);
  mongoose.disconnect();
}

fetchAndStoreMovies();