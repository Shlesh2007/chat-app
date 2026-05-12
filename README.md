# Shlesh AI — Personal AI Assistant

A full-stack AI chat application built by **Shlesh Darji**, CSE student at LJ University.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, Zustand |
| Backend | Node.js, Express, sql.js (SQLite) |
| AI | Groq API (llama-3.1-8b-instant) |
| Auth | JWT |
| Uploads | Multer (PDF, Word, Excel, images, code) |

## Features

- Streaming AI responses
- Conversation memory
- File upload & analysis (PDF, Word, Excel, CSV, images, code)
- Image generation via Pollinations.ai
- Profile page with avatar & auto-delete toggle
- JWT authentication
- Responsive dark UI

## Run Locally

```bash
# Install
npm run install:all

# Start (both backend + frontend)
npm run dev
```

Open http://localhost:5173

## Environment Variables

Copy `backend/.env.example` to `backend/.env` and fill in:

```env
GROQ_API_KEY=your_groq_api_key
JWT_SECRET=your_secret
```

---

Built by Shlesh Darji · LJ University
