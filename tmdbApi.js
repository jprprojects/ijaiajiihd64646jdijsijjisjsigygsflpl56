const axios = require("axios");

const api = axios.create({
  baseURL: "https://api.themoviedb.org/3",
  params: {
    api_key: "50c7face1bc4f49590eb3d74e7111608",
    language: "pt-BR",
  },
});

const getMovieDetails = async (tmdbId) => {
  try {
    const response = await api.get(`/movie/${tmdbId}`);
    return response.data;
  } catch (error) {
    throw new Error(`Failed to fetch movie details: ${error.message}`);
  }
};

module.exports = getMovieDetails;
