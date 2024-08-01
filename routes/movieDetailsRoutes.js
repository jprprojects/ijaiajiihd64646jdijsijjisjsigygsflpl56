const express = require("express");
const fs = require("fs");
const path = require("path");
const getMovieDetails = require("../tmdbApi");

const router = express.Router();

// Função para adicionar um filme no início da lista
const prependMovieToFile = (filePath, newContent) => {
  try {
    // Lê o conteúdo atual do arquivo
    let currentContent = "";
    if (fs.existsSync(filePath)) {
      currentContent = fs.readFileSync(filePath, "utf8");
    }

    // Remove o cabeçalho se existir
    const cleanedContent = currentContent.replace(/^\s*#EXTM3U\s*$/, "").trim();

    // Adiciona o novo conteúdo (filme mais recente) no início
    const updatedContent = `${newContent}\n\n${cleanedContent}`;

    // Escreve o conteúdo atualizado de volta ao arquivo
    fs.writeFileSync(filePath, updatedContent);
  } catch (error) {
    throw new Error(`Failed to prepend movie: ${error.message}`);
  }
};

// Rota para adicionar filmes via POST
router.post("/moviedetails", async (req, res) => {
  const { tmdb_id, video_url } = req.body;

  if (!tmdb_id || !video_url) {
    return res
      .status(400)
      .json({ error: "tmdb_id and video_url are required" });
  }

  try {
    const movieDetails = await getMovieDetails(tmdb_id);

    const m3u8FilePath = path.join(__dirname, "../movies.m3u8");

    const newContent = `
#EXTINF:-1 tvg-id="${movieDetails.id}" tvg-name="${
      movieDetails.title
    }" tvg-logo="https://image.tmdb.org/t/p/w500${
      movieDetails.poster_path
    }" group-title="Filmes | ${movieDetails.genres
      .map((genre) => genre.name)
      .join(", ")}",${movieDetails.title}
${video_url}
    `.trim();

    // Adicionar o novo filme ao início do arquivo
    prependMovieToFile(m3u8FilePath, newContent);

    res.status(201).json({ message: "Movie added successfully", movieDetails });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rota para obter detalhes de um filme via GET
router.get("/moviedetails/:tmdb_id", async (req, res) => {
  const { tmdb_id } = req.params;

  if (!tmdb_id) {
    return res.status(400).json({ error: "tmdb_id is required" });
  }

  try {
    const movieDetails = await getMovieDetails(tmdb_id);

    res.status(200).json(movieDetails);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
