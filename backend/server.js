const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { extractTextFromPDF, chunkText } = require("./utils/pdfProcessor");

const app = express();
const PORT = process.env.PORT || 4000;
const DATA_DIR = path.join(__dirname, "data");
const UPLOAD_DIR = path.join(__dirname, "uploads");
const DB_FILE = path.join(DATA_DIR, "db.json");

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const initialDb = {
  users: [],
  documents: [],
  chunks: [],
  chats: [],
  queryLogs: [],
  feedback: []
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function readDb() {
  if (!fs.existsSync(DB_FILE)) return clone(initialDb);
  return { ...clone(initialDb), ...JSON.parse(fs.readFileSync(DB_FILE, "utf8")) };
}

function writeDb(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

function id(prefix) {
  return `${prefix}_${crypto.randomBytes(8).toString("hex")}`;
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.pbkdf2Sync(password, salt, 120000, 32, "sha256").toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(":");
  return hashPassword(password, salt).split(":")[1] === hash;
}

function tokenize(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

function scoreChunk(question, chunk) {
  const q = new Set(tokenize(question));
  const words = tokenize(chunk.text);
  if (!q.size || !words.length) return 0;
  let score = 0;
  for (const word of words) if (q.has(word)) score += 1;
  return score / Math.sqrt(words.length);
}

function auth(req, res, next) {
  const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  const db = readDb();
  const user = db.users.find((u) => u.token === token);
  if (!user) return res.status(401).json({ message: "Please sign in again." });
  req.user = user;
  req.db = db;
  next();
}

function adminOnly(req, res, next) {
  if (req.user.role !== "admin") return res.status(403).json({ message: "Admin access required." });
  next();
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
    filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
  }),
  fileFilter: (_req, file, cb) => {
    cb(file.mimetype === "application/pdf" ? null : new Error("Only PDF files are allowed."), file.mimetype === "application/pdf");
  }
});

app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.get("/", (_req, res) => {
  res.json({ ok: true, name: "Enterprise SOP Agent API" });
});

app.get("/api/health", (_req, res) => {
  const db = readDb();
  res.json({ ok: true, documents: db.documents.length, chunks: db.chunks.length });
});

app.get("/api/auth/status", (_req, res) => {
  res.json({ hasUsers: readDb().users.length > 0 });
});

app.post("/api/auth/register", (req, res) => {
  const { firstName, lastName, email, phone, password, confirmPassword } = req.body;
  if (![firstName, lastName, email, phone, password, confirmPassword].every(Boolean)) {
    return res.status(400).json({ message: "All fields are required." });
  }
  if (password !== confirmPassword) return res.status(400).json({ message: "Passwords do not match." });
  if (password.length < 8) return res.status(400).json({ message: "Password must be at least 8 characters." });

  const db = readDb();
  if (db.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(409).json({ message: "That email is already registered." });
  }

  const user = {
    _id: id("usr"),
    firstName,
    lastName,
    email,
    phone,
    role: db.users.length === 0 ? "admin" : "employee",
    passwordHash: hashPassword(password),
    token: id("tok"),
    createdAt: new Date().toISOString()
  };
  db.users.push(user);
  writeDb(db);
  res.status(201).json({ message: "Account created." });
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  const db = readDb();
  const user = db.users.find((u) => u.email.toLowerCase() === String(email || "").toLowerCase());
  if (!user || !verifyPassword(password || "", user.passwordHash)) {
    return res.status(401).json({ message: "Invalid email or password." });
  }
  user.token = id("tok");
  writeDb(db);
  res.json({
    token: user.token,
    user: { _id: user._id, firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role }
  });
});

app.get("/api/me", auth, (req, res) => {
  const { passwordHash, token, ...safeUser } = req.user;
  res.json(safeUser);
});

app.get("/api/admin/documents", auth, adminOnly, (req, res) => {
  res.json(req.db.documents);
});

app.post("/api/admin/documents/upload", auth, adminOnly, upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "Upload a PDF file." });
  const title = req.body.title || req.file.originalname;
  const text = await extractTextFromPDF(req.file.path);
  const chunks = chunkText(text, 1000, 100);
  const db = readDb();
  const document = {
    _id: id("doc"),
    title,
    originalFileName: req.file.originalname,
    storedFileName: req.file.filename,
    version: 1,
    totalChunks: chunks.length,
    createdAt: new Date().toISOString()
  };
  db.documents.push(document);
  chunks.forEach((text, index) => {
    db.chunks.push({
      _id: id("chk"),
      documentId: document._id,
      documentTitle: document.title,
      text,
      page: 1,
      section: index + 1,
      index,
      keywords: [...new Set(tokenize(text))].slice(0, 80)
    });
  });
  writeDb(db);
  res.status(201).json(document);
});

app.delete("/api/admin/documents/:id", auth, adminOnly, (req, res) => {
  const db = req.db;
  const doc = db.documents.find((d) => d._id === req.params.id);
  db.documents = db.documents.filter((d) => d._id !== req.params.id);
  db.chunks = db.chunks.filter((c) => c.documentId !== req.params.id);
  if (doc?.storedFileName) {
    fs.rm(path.join(UPLOAD_DIR, doc.storedFileName), { force: true }, () => {});
  }
  writeDb(db);
  res.json({ ok: true });
});

app.get("/api/features/suggestions", auth, (req, res) => {
  const db = req.db;
  const topics = db.chunks.flatMap((c) => c.keywords || []).slice(0, 120);
  const fallback = [
    "What is the refund policy?",
    "Summarize the escalation process.",
    "Which documents mention approval steps?",
    "What should I do first for a high priority issue?"
  ];
  const custom = [...new Set(topics)].slice(0, 4).map((t) => `What does the SOP say about ${t}?`);
  res.json(custom.length ? custom : fallback);
});

app.get("/api/chat/history", auth, (req, res) => {
  res.json(req.db.chats.filter((c) => c.userId === req.user._id).slice(-40));
});

app.post("/api/chat/ask", auth, async (req, res) => {
  const started = Date.now();
  const question = String(req.body.question || "").trim();
  if (!question) return res.status(400).json({ message: "Question is required." });

  const db = req.db;
  const matches = db.chunks
    .map((chunk) => ({ ...chunk, score: scoreChunk(question, chunk) }))
    .filter((chunk) => chunk.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  let answer;
  if (!matches.length) {
    answer = "I don't know from the uploaded SOPs yet. Please upload the relevant policy PDF or ask about a topic covered in the current knowledge base.";
  } else {
    const context = matches
      .map((m, i) => `Source ${i + 1}: ${m.text.replace(/\s+/g, " ").slice(0, 450)}`)
      .join("\n\n");
    answer =
      `Based on the SOP knowledge base, here is the most relevant guidance:\n\n${context}\n\n` +
      "Use the citations below to open the source PDF section and verify the exact wording before taking action.";
  }

  const citations = matches.map((m) => ({
    documentId: m.documentId,
    documentTitle: m.documentTitle,
    chunkId: m._id,
    page: m.page,
    section: m.section
  }));

  db.chats.push({ _id: id("msg"), userId: req.user._id, role: "user", text: question, createdAt: new Date().toISOString() });
  db.chats.push({ _id: id("msg"), userId: req.user._id, role: "assistant", text: answer, citations, createdAt: new Date().toISOString() });
  db.queryLogs.push({ _id: id("qry"), userId: req.user._id, question, latencyMs: Date.now() - started, matchedChunks: citations.length, createdAt: new Date().toISOString() });
  writeDb(db);

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive"
  });
  for (const token of answer.match(/.{1,28}(\s|$)/g) || [answer]) {
    res.write(`event: token\ndata: ${JSON.stringify({ token })}\n\n`);
    await new Promise((resolve) => setTimeout(resolve, 12));
  }
  res.write(`event: done\ndata: ${JSON.stringify({ citations })}\n\n`);
  res.end();
});

app.post("/api/features/feedback", auth, (req, res) => {
  const db = req.db;
  db.feedback.push({ _id: id("fbk"), userId: req.user._id, ...req.body, createdAt: new Date().toISOString() });
  writeDb(db);
  res.json({ ok: true });
});

app.get("/api/features/analytics", auth, (req, res) => {
  const db = req.db;
  const logs = db.queryLogs;
  const counts = new Map();
  logs.forEach((l) => counts.set(l.question, (counts.get(l.question) || 0) + 1));
  res.json({
    totalQueries: logs.length,
    answeredMessages: db.chats.filter((m) => m.role === "assistant").length,
    avgLatencyMs: logs.length ? logs.reduce((sum, l) => sum + l.latencyMs, 0) / logs.length : 0,
    documents: db.documents.length,
    chunks: db.chunks.length,
    topQueries: [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([question, count]) => ({ _id: question, count }))
  });
});

app.use((err, _req, res, _next) => {
  res.status(400).json({ message: err.message || "Request failed." });
});

app.listen(PORT, () => {
  console.log(`Enterprise SOP Agent API running on http://localhost:${PORT}`);
});
