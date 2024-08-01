import axios from "axios";
import cheerio from "cheerio";

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
      const mainPage = await axios.get(uri);
      const $ = cheerio.load(mainPage.data);
      const tfPageUrl = this.extractHref($, "tf.php");

      if (!tfPageUrl) {
        throw new Error("Link to 'tf.php' not found");
      }

      const fullTfPageUrl = new URL(tfPageUrl, uri).href;
      const tfPage = await axios.get(fullTfPageUrl);
      const tfHtml = tfPage.data;
      const scriptContent = this.extractScriptContent(tfHtml, 3);

      if (!scriptContent) {
        throw new Error("Quarto script não encontrado");
      }

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
      const response = await axios.get(uri);
      const $ = cheerio.load(response.data);
      const srcs = this.extractIframes($);
      const results = await Promise.all(
        srcs.map(async (src) => await this.multi(src))
      );
      return results;
    } catch (error) {
      throw new Error(`Failed to fetch Blogger videos: ${error.message}`);
    }
  }

  async CloudVideo({ uri }) {
    try {
      const its = uri.replace("https://cloudvideo.tv/", "");
      const response = await axios.get(uri);
      const $ = cheerio.load(response.data);
      const videoHlsOnly = this.extractVideoHlsOnly($);
      const todos = this.extractCloudVideoData($, its);

      const updatedData = await Promise.all(
        todos.data.map(async (item) => {
          item.url = await this.cloud(item.url);
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
      const response = await axios.get(uri);
      const $ = cheerio.load(response.data);
      const item = this.extractGooglePhotosScript($);
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

  async Mp4Upload(uri) {
    try {
      const response = await axios.get(uri);
      const $ = cheerio.load(response.data);
      const scriptContent = this.extractMp4UploadScript($);
      return this.explodeMp4Upload(scriptContent);
    } catch (error) {
      throw new Error(`Failed to fetch Mp4Upload: ${error.message}`);
    }
  }

  async RapidVideo(uri) {
    try {
      const response = await axios.get(uri);
      const $ = cheerio.load(response.data);
      const src = this.extractRapidVideoSrc($);
      return src;
    } catch (error) {
      throw new Error(`Failed to fetch RapidVideo: ${error.message}`);
    }
  }

  // Helper functions to parse HTML and extract needed data
  extractHref($, substring) {
    // Implement a way to extract href from HTML content using cheerio
    return null; // Replace with actual implementation
  }

  extractScriptContent(html, index) {
    // Implement a way to extract specific script content using cheerio
    return null; // Replace with actual implementation
  }

  extractIframes($) {
    // Implement a way to extract src from iframe tags using cheerio
    return []; // Replace with actual implementation
  }

  extractVideoHlsOnly($) {
    // Implement a way to extract video HLS URL using cheerio
    return null; // Replace with actual implementation
  }

  extractCloudVideoData($, its) {
    // Implement a way to extract CloudVideo data using cheerio
    return { data: [] }; // Replace with actual implementation
  }

  extractGooglePhotosScript($) {
    // Implement a way to extract Google Photos script using cheerio
    return []; // Replace com implementação real
  }

  extractMp4UploadScript($) {
    // Implement a way to extract Mp4Upload script usando cheerio
    return ""; // Replace com implementação real
  }

  extractRapidVideoSrc($) {
    // Implement a way to extract RapidVideo src usando cheerio
    return null; // Replace com implementação real
  }

  async cloud(i) {
    try {
      const response = await axios.get(i);
      const $ = cheerio.load(response.data);
      // Implement a way to extract the href attribute using cheerio
      return null; // Replace with actual implementation
    } catch (error) {
      throw new Error(`Failed to fetch Cloud link: ${error.message}`);
    }
  }

  async multi(i) {
    try {
      const response = await axios.get(i);
      const $ = cheerio.load(response.data);
      // Implement a way to parse video config using cheerio
      return {}; // Replace with actual implementation
    } catch (error) {
      throw new Error(`Failed to fetch multi source: ${error.message}`);
    }
  }

  async explodeMp4Upload(i) {
    const t = i.split("video|")[1];
    const m = t.split("|282");
    if (i.includes("|www2|")) {
      return `https://www2.mp4upload.com:282/d/${m[0]}/video.mp4`;
    } else if (i.includes("|s3|")) {
      return `https://s3.mp4upload.com:282/d/${m[0]}/video.mp4`;
    }
  }
}

export default new Grab();
