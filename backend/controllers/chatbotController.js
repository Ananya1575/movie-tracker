const { GoogleGenerativeAI } = require('@google/generative-ai');
const Watched = require('../models/Watched');
const Movie = require('../models/Movie');

// Make sure to set GEMINI_API_KEY in your environment variables
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const getRecommendations = async (req, res) => {
  const userId = req.user.userId;
  try {
    // Fetch user's watched movies with ratings and reviews
    const watched = await Watched.find({ userId }).populate('movieId');
    if (!watched.length) {
      return res.status(200).json({ message: 'You have not watched any movies yet.' });
    }
    // Prepare user history for prompt
    const history = watched.map(w => {
      return `Title: ${w.movieId.title}, Rating: ${w.rating || 'N/A'}, Review: ${w.reviewText || 'N/A'}`;
    }).join('\n');

    // Compose prompt for Gemini
    const prompt = `I have watched and rated the following movies:\n${history}\nBased on my preferences, recommend 5 movies from a general movie database. Reply only with the recommendations and a short reason for each.`;

    // Call Gemini AI
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const result = await model.generateContent(prompt);
    const response = result.response.text();

    res.json({ recommendations: response });
  } catch (error) {
    console.error('Gemini AI error:', error);
    res.status(500).json({ message: 'Error generating recommendations', error: error.message });
  }
};

module.exports = { getRecommendations }; 