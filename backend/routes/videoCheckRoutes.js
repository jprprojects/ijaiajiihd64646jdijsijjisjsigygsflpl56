const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const path = require("path");

const router = express.Router();

const baseUrl = "https://gofilmes.me/genero/lancamentos?p=";

// Função para obter o número total de páginas
const getTotalPages = async () => {
  try {
    const { data } = await axios.get(baseUrl + 1);
    const $ = cheerio.load(data);
    const totalPages = parseInt($("ul.pagination li a").last().text());
    return totalPages;
  } catch (error) {
    throw new Error(`Failed to get total pages: ${error.message}`);
  }
};

// Função para verificar se a página do filme contém um link tf.php
const checkMoviePage = async (url) => {
  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    const tfPageLink = $('a[href*="tf.php"]').first().attr("href");
    return tfPageLink ? true : false;
  } catch (error) {
    throw new Error(`Failed to check movie page: ${error.message}`);
  }
};

// Função para processar uma página
const processPage = async (pageNumber) => {
  try {
    const { data } = await axios.get(baseUrl + pageNumber);
    const $ = cheerio.load(data);
    const movies = [];

    $(".poster").each((index, element) => {
      const $element = $(element);
      const title = $element.find(".t").text().trim();
      const year = $element.find(".ano").text().trim();
      const rating = $element.find(".rate").text().trim();
      const imgSrc = $element.find("img.thumb").attr("src");
      const detailUrl = $element.find(".t").attr("href").trim();
      const description = $element.find(".t-sin").text().trim();
      const duration = $element.find(".t-tempo").text().trim();

      movies.push({
        title,
        year,
        rating,
        imgSrc,
        detailUrl,
        description,
        duration,
      });
    });

    return movies;
  } catch (error) {
    throw new Error(`Failed to process page ${pageNumber}: ${error.message}`);
  }
};

// Função para processar todas as páginas
const processAllPages = async () => {
  try {
    const totalPages = await getTotalPages();
    let allMovies = [];

    for (let i = 1; i <= totalPages; i++) {
      const movies = await processPage(i);
      allMovies = allMovies.concat(movies);
    }

    return allMovies;
  } catch (error) {
    throw new Error(`Failed to process all pages: ${error.message}`);
  }
};

// Rota para iniciar o processamento
router.get("/check", async (req, res) => {
  try {
    const movies = await processAllPages();
    /*  const m3u8Content = movies
      .map((movie) => `#EXTINF:-1,${movie.title}\n${movie.detailUrl}`)
      .join("\n");

    fs.writeFileSync(path.join(__dirname, "../movies.m3u8"), m3u8Content);
*/
    res.json({ message: "Processing complete", movies });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
