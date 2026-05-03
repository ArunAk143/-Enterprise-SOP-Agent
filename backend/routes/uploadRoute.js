const express = require("express");
const multer = require("multer");

const { extractTextFromPDF, chunkText } = require("../utils/pdfProcessor");

const router = express.Router();

// storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

// only PDF
const fileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Only PDF files allowed"), false);
  }
};

const upload = multer({ storage, fileFilter });

// route
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const filePath = req.file.path;

    // 1. Extract text
    const text = await extractTextFromPDF(filePath);

    // 2. Chunk text
    const chunks = chunkText(text);

    console.log("Total chunks:", chunks.length);
    console.log("First chunk:\n", chunks[0]);

    res.json({
      message: "PDF processed successfully",
      totalChunks: chunks.length,
      sample: chunks[0] // send first chunk
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Processing failed" });
  }
});

module.exports = router;