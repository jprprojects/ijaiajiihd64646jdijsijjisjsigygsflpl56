const express = require("express");
const router = express.Router();
const Grab = require("../grab");

router.get("/video", async (req, res) => {
  const { uri } = req.query;
  try {
    const video = await Grab.getVideo(uri);
    res.json(video);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
