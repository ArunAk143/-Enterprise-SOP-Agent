# Enterprise SOP Agent

A complete MERN-style SOP assistant project for the week-wise implementation plan.

## Features

- Week 1: PDF upload, text extraction, 1000 character chunks with overlap, and searchable local index.
- Week 2: Retrieval engine that finds relevant SOP chunks for a user query.
- Week 3: Chat agent with streamed Server-Sent Events responses and an "I don't know" guard when SOP context is missing.
- Week 4: Source citations, chat history persistence, feedback, and analytics for queries, latency, documents, and chunks.

The project uses a local JSON database so it runs without paid services. It is structured so MongoDB Atlas, Atlas Vector Search, and Gemini can be added later by replacing the local storage and answer generation layer.

## Run The Project

Open two terminals.

Backend:

```bash
cd backend
npm install
npm start
```

Frontend:

```bash
cd frontend
npm install
npm start
```

Then open:

```text
http://localhost:3000
```

## How To Use

1. Register the first account. The first account is created as `admin`.
2. Go to Admin and upload one or more PDF SOP files.
3. Go to Chat and ask questions about the uploaded SOPs.
4. Review citations below each answer.
5. Go to Analytics to verify query count, latency, indexed documents, and chunks.

## API

- `GET /api/auth/status`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/admin/documents`
- `POST /api/admin/documents/upload`
- `DELETE /api/admin/documents/:id`
- `POST /api/chat/ask`
- `GET /api/chat/history`
- `GET /api/features/suggestions`
- `POST /api/features/feedback`
- `GET /api/features/analytics`

