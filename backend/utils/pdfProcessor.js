const fs = require("fs");
const pdfParse = require("pdf-parse");

// Extract text
const extractTextFromPDF = async (filePath) => {
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdfParse(dataBuffer);
  return data.text;
};

// Chunk text
const chunkText = (text, chunkSize = 1000, overlap = 100) => {
  const chunks = [];

  for (let i = 0; i < text.length; i += (chunkSize - overlap)) {
    const chunk = text.slice(i, i + chunkSize);
    chunks.push(chunk);
  }

  return chunks;
};

module.exports = { extractTextFromPDF, chunkText };