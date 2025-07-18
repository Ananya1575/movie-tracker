const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const authRoutes = require('./routes/auth.js');
const movieRoutes = require('./routes/movies.js');
const reviewRoutes = require('./routes/reviews.js');
const watchlistRoutes = require('./routes/watchlist.js');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// CORS configuration to allow both localhost and 127.0.0.1
const corsOptions = {
  origin: ['http://localhost:8080', 'http://127.0.0.1:8080'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

app.use('/api/auth', authRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/watchlist', watchlistRoutes);

app.get('/', (req, res) => {
  res.send('Hello from the backend!');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});