const express = require("express");
const multer = require("multer");

const router = express.Router();

// Storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

// File filter (only PDF)
const fileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Only PDF files allowed"), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter
});

// Route
router.post("/upload", upload.single("file"), (req, res) => {
  res.json({
    message: "File upload successful",
    file: req.file.filename
  });
});

module.exports = router;