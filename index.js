const express = require("express");
const cors = require("cors");

const videoRoutes = require("./routes/videoRoutes");
const movieRoutes = require("./routes/movieRoutes");
const videoCheckRoutes = require("./routes/videoCheckRoutes");
const movieDetailsRoutes = require("./routes/movieDetailsRoutes");

const app = express();
const port = process.env.PORT || 5555;

app.use(cors());
app.use(express.json());
app.use("/api", videoRoutes);
app.use("/api", movieRoutes);
app.use("/api", videoCheckRoutes);
app.use("/api", movieDetailsRoutes);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
