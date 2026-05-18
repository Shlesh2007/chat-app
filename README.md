# Chat-App 🤖

A full-stack AI chat application built by **Shlesh Darji**, CSE student at LJ University.

> Live: [chatingapp-six.vercel.app](https://chatapp-pi-woad.vercel.app/)

---

## Features

- Streaming AI responses
- Conversation memory
- File upload & analysis — PDF, Word, Excel, CSV, code files, images
- Image generation from text prompts
- Profile page with avatar upload
- Auto-delete toggle — delete chats older than 30 days
- JWT authentication
- Responsive design — works on mobile and desktop
- Dark theme

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, Zustand, React Router |
| Backend | Node.js, Express |
| Database | Turso (cloud SQLite) |
| AI | Groq API — llama-3.1-8b-instant |
| Auth | JWT |
| File Uploads | Multer |
| Image Generation | Pollinations.ai |
| Deployment | Vercel + Render |

---

## Local Development

### Prerequisites
- Node.js v18+
- [Groq API key](https://console.groq.com)
- [Turso](https://turso.tech) database

### Setup

```bash
git clone https://github.com/Shlesh2007/chat-app.git
cd chat-app
npm run install:all
cp backend/.env.example backend/.env
# Fill in your keys in backend/.env
npm run dev
```

Opens at **http://localhost:5173**

### Environment Variables (`backend/.env`)

```env
PORT=3001
NODE_ENV=development
JWT_SECRET=your_long_random_secret
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.1-8b-instant
TURSO_URL=libsql://your-db.turso.io
TURSO_TOKEN=your_turso_token
```

---

## Deployment

### Backend → Render
- Root Directory: `backend`
- Build Command: `npm install`
- Start Command: `node src/server.js`
- Add all env vars from above

### Frontend → Vercel
- Root Directory: `frontend`
- Framework: Vite
- Add env var: `VITE_BACKEND_URL = https://your-render-url.onrender.com`

---

## Project Structure

```
chat-app/
├── backend/
│   ├── src/
│   │   ├── server.js
│   │   ├── db/database.js
│   │   ├── middleware/
│   │   ├── routes/
│   │   └── services/
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/
    │   ├── pages/
    │   ├── store/
    │   └── lib/
    └── package.json
```

---

## Author

**Shlesh Darji** · CSE Student · LJ University  
GitHub: [@Shlesh2007](https://github.com/Shlesh2007)
