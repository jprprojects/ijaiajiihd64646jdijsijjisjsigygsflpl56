const cheerio = require("cheerio");
const axios = require("axios");

class Grab {
  async getVideo(uri) {
    try {
      if (uri.includes("blogger.com")) {
        return await this.Blogger({ uri });
      } else if (uri.includes("cloudvideo.tv")) {
        return await this.CloudVideo({ uri });
      } else if (uri.includes("photos.google.com")) {
        return await this.GooglePhotos(uri);
      } else if (uri.includes("mp4upload.com")) {
        return await this.Mp4Upload(uri);
      } else if (uri.includes("rapidvideo.com")) {
        return await this.RapidVideo(uri);
      } else if (uri.includes("gofilmes.me")) {
        return await this.extractGofilmesVideo(uri);
      } else {
        throw new Error("Unsupported URL");
      }
    } catch (error) {
      throw new Error(`Failed to fetch video: ${error.message}`);
    }
  }

  async extractGofilmesVideo(uri) {
    try {
      // 1. Acessar a página principal e encontrar o link que contém 'tf.php'
      const mainPage = await axios.get(uri);
      const $main = cheerio.load(mainPage.data);
      const tfPageUrl = $main("a[href*='tf.php']").attr("href");

      if (!tfPageUrl) {
        throw new Error("Link to 'tf.php' not found");
      }

      // 2. Navegar até o link 'tf.php'
      const fullTfPageUrl = new URL(tfPageUrl, uri).href; // Resolve o URL relativo
      const tfPage = await axios.get(fullTfPageUrl);
      const $tfPage = cheerio.load(tfPage.data);

      // 3. Encontrar o URL do vídeo na página 'tf.php'
      const scripts = $tfPage("script");
      const scriptContent = scripts.eq(3).html(); // Pega o quarto script

      if (!scriptContent) {
        throw new Error("Quarto script não encontrado");
      }

      // Encontrar a URL do vídeo no conteúdo do script
      const videoUrlMatch = scriptContent.match(
        /sources:\s*\[\{'file':'(https?:\/\/[^']+)'/
      );
      const videoUrl = videoUrlMatch ? videoUrlMatch[1] : null;

      if (!videoUrl) {
        throw new Error("Video URL not found in script");
      }

      return { source: videoUrl };
    } catch (error) {
      throw new Error(
        `Failed to extract video from Gofilmes: ${error.message}`
      );
    }
  }

  async Blogger({ uri }) {
    try {
      const url = await axios.get(uri);
      const $ = cheerio.load(url.data);
      const todos = [];
      $("iframe").each((index, item) => {
        const $element = $(item);
        const src = $element.attr("src");
        if (src) {
          todos.push(src);
        }
      });
      const results = await Promise.all(todos.map((src) => multi(src)));
      return results;
    } catch (error) {
      throw new Error(`Failed to fetch Blogger videos: ${error.message}`);
    }
  }

  async CloudVideo({ uri }) {
    try {
      const its = uri.replace("https://cloudvideo.tv/", "");
      const url = await axios.get(uri);
      const $ = cheerio.load(url.data);
      const todos = {
        video_hls_only: cheerio.load(url.data)("video > source").attr("src"),
        data: [],
      };
      const promises = [];
      $("#download > a").each((i, item) => {
        const $element = $(item);
        const m = $element
          .attr("onclick")
          .replace("download_video(", "")
          .replace(")", "")
          .replace(`'${its}'`, "");
        let mode = null;
        if (m.includes(`'n'`)) mode = "n";
        if (m.includes(`'h'`)) mode = "h";
        if (m.includes(`'l'`)) mode = "l";

        if (mode) {
          todos.data.push({
            title: $element.text(),
            url: `https://cloudvideo.tv/dl?op=download_orig&id=${its}&mode=n&hash=${m
              .replace(`,'${mode}','`, "")
              .replace(`'`, "")}`,
          });
        }
      });

      const updatedData = await Promise.all(
        todos.data.map(async (item) => {
          item.url = await cloud(item.url);
          return item;
        })
      );
      todos.data = updatedData;

      return todos;
    } catch (error) {
      throw new Error(`Failed to fetch CloudVideo: ${error.message}`);
    }
  }

  async GooglePhotos(uri) {
    try {
      const fetch = await axios.get(uri);
      const $ = cheerio.load(fetch.data);
      const item = $("body > script")
        .eq(5)
        .html()
        ?.match(/\bhttps?:\/\/[^,\s()<>]+/gi);
      let source;
      if (item) {
        source = item
          .find((result) => result.includes("video-downloads"))
          ?.replace(/"$/, "");
      }
      return { source };
    } catch (error) {
      throw new Error(`Failed to fetch GooglePhotos: ${error.message}`);
    }
  }

  async Mp4Upload(i) {
    try {
      const url = await axios.get(i);
      const $ = cheerio.load(url.data)("body > script:nth-child(9)").html();
      const items = $.substring(926);
      const tt = `${items.slice(0, -15)}`;
      return explodeMp4Upload(tt);
    } catch (error) {
      throw new Error(`Failed to fetch Mp4Upload: ${error.message}`);
    }
  }

  async RapidVideo(i) {
    try {
      const url = await axios.get(i);
      return cheerio.load(url.data)("source").attr("src");
    } catch (error) {
      throw new Error(`Failed to fetch RapidVideo: ${error.message}`);
    }
  }
}

const explodeMp4Upload = async (i) => {
  const t = i.split("video|")[1];
  const m = t.split("|282");
  if (i.includes("|www2|")) {
    return `https://www2.mp4upload.com:282/d/${m[0]}/video.mp4`;
  } else if (i.includes("|s3|")) {
    return `https://s3.mp4upload.com:282/d/${m[0]}/video.mp4`;
  }
};

const cloud = async (i) => {
  const url = await axios.get(i);
  return cheerio
    .load(url.data)('a[class="btn btn-primary btn-block btn-signin"]')
    .attr("href");
};

const multi = async (i) => {
  const url = await axios.get(i);
  const $ = cheerio.load(url.data);
  const data = $("script")[0].children[0];
  const rp = JSON.parse(data.data.replace("var VIDEO_CONFIG =", ""));
  return {
    poster: rp.thumbnail,
    url: rp.streams[0].play_url,
  };
};

module.exports = new Grab();
