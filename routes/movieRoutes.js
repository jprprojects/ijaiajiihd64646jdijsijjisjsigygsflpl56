const express = require("express");
const router = express.Router();
const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const path = require("path");

const m3u8FilePath = path.join(__dirname, "movies.m3u8");

// Função para verificar se a página do filme contém um link tf.php
const checkMoviePage = async (url) => {
  try {
    console.log(`Checking movie page: ${url}`);
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    const tfPageLink = $('a[href*="tf.php"]').attr("href");
    const hasTfLink = tfPageLink ? true : false;
    console.log(`TF Link found: ${hasTfLink}`);
    return hasTfLink;
  } catch (error) {
    console.error(`Failed to check movie page: ${error.message}`);
    return false;
  }
};

// Função para extrair informações dos filmes de uma página
const extractMoviesFromPage = async (pageUrl) => {
  try {
    console.log(`Extracting movies from page: ${pageUrl}`);
    const { data } = await axios.get(pageUrl);
    const $ = cheerio.load(data);

    const movies = [];

    const posters = $(".poster").toArray();
    for (const element of posters) {
      const $element = $(element);
      const title = $element.find(".t").text().trim();
      const year = $element.find(".ano").text().trim();
      const rating = $element.find(".rate").text().trim();
      const imgSrc = $element.find("img.thumb").attr("src");
      const detailUrl = $element.find(".t").first().attr("href").trim();
      const description = $element.find(".t-sin").text().trim();
      const duration = $element.find(".t-tempo").text().trim();
      const categories = $element
        .find(".t-gen span")
        .toArray()
        .map((el) => $(el).text().trim())
        .join(", ");

      console.log(`Checking movie: ${title}`);
      const hasTfLink = await checkMoviePage(detailUrl);
      if (hasTfLink) {
        console.log(`Movie added: ${title}`);
        const movie = {
          title,
          year,
          rating,
          imgSrc,
          detailUrl,
          description,
          duration,
          categories,
        };
        movies.push(movie);
        saveMovieToM3U8File(movie);
      } else {
        console.log(`Movie skipped (no tf.php): ${title}`);
      }
    }

    return movies;
  } catch (error) {
    console.error(`Failed to extract movies: ${error.message}`);
    return [];
  }
};

// Função para salvar um filme no arquivo m3u8
const saveMovieToM3U8File = (movie) => {
  const m3u8Entry = `#EXTINF:-1 tvg-id="${Math.random()
    .toString()
    .substring(2, 8)}" tvg-name="${movie.title}" tvg-logo="${
    movie.imgSrc
  }" group-title="Filmes | ${movie.categories}", ${movie.title}\n${
    movie.detailUrl
  }\n`;
  fs.appendFile(m3u8FilePath, m3u8Entry, (err) => {
    if (err) {
      console.error(`Failed to save movie to m3u8 file: ${err.message}`);
    } else {
      console.log(`Movie saved to m3u8 file: ${movie.title}`);
    }
  });
};

// Função para obter todas as páginas de filmes
const getAllMovies = async (baseUrl, numPages) => {
  let allMovies = [];

  for (let page = 1; page <= numPages; page++) {
    const pageUrl = `${baseUrl}?p=${page}`;
    console.log(`Processing page ${page} of ${numPages}`);
    const movies = await extractMoviesFromPage(pageUrl);
    allMovies = allMovies.concat(movies);
  }

  return allMovies;
};

// Função para obter o número total de páginas
const getTotalPages = async (url) => {
  try {
    console.log(`Getting total pages from: ${url}`);
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    const totalPages = parseInt(
      $("ul.pagination li").not(".dot").last().text().trim()
    );
    console.log(`Total pages found: ${totalPages}`);
    return totalPages;
  } catch (error) {
    console.error(`Failed to get total pages: ${error.message}`);
    return 1;
  }
};

// Rota da API para buscar filmes
router.get("/movies", async (req, res) => {
  const baseUrl = "https://gofilmes.me/genero/lancamentos";
  const initialPageUrl = `${baseUrl}?p=1`;

  try {
    const totalPages = await getTotalPages(initialPageUrl);
    console.log(`Total Pages: ${totalPages}`);
    const movies = await getAllMovies(baseUrl, totalPages);
    console.log(`Total movies found: ${movies.length}`);
    res.json(movies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
