const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// Routes
const uploadRoute = require("./routes/uploadRoute");
app.use("/api", uploadRoute);

// Test route
app.get("/", (req, res) => {
  res.send("Backend running");
});

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});