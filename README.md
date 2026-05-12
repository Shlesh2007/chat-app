# Chat-App 🤖

A full-stack AI chat application built by **Shlesh Darji**, CSE student at LJ University.

> Live demo: [chatingapp-six.vercel.app](https://chatingapp-six.vercel.app)

---

## ✨ Features

- 💬 **Streaming AI responses** — real-time token-by-token output
- 🧠 **Conversation memory** — AI remembers your chat history
- 📎 **File upload & analysis** — PDF, Word, Excel, CSV, images, code files
- 🎨 **Image generation** — generate images from text prompts (Pollinations.ai)
- 👤 **Profile page** — upload avatar, change username
- 🗑️ **Auto-delete toggle** — optionally delete chats older than 30 days
- 🔐 **JWT authentication** — secure register/login
- 📱 **Fully responsive** — works on mobile, tablet, and desktop
- 🌙 **Dark UI** — ChatGPT-style dark theme
- ⚡ **Fast** — powered by Groq API (llama-3.1-8b-instant)

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, Zustand, React Router |
| Backend | Node.js, Express |
| Database | Turso (cloud SQLite via libsql) |
| AI | Groq API — llama-3.1-8b-instant |
| Auth | JWT (jsonwebtoken + bcryptjs) |
| File Uploads | Multer |
| Image Gen | Pollinations.ai (free, no API key) |
| Deployment | Vercel (frontend) + Render (backend) |

---

## 🚀 Local Development

### Prerequisites
- Node.js v18+
- A free [Groq API key](https://console.groq.com)
- A free [Turso](https://turso.tech) database

### Setup

```bash
# 1. Clone the repo
git clone https://github.com/Shlesh2007/chat-app.git
cd chat-app

# 2. Install dependencies
npm run install:all

# 3. Configure backend environment
cp backend/.env.example backend/.env
# Edit backend/.env with your keys
```

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

### Run

```bash
npm run dev
```

Opens at **http://localhost:5173**

---

## ☁️ Deployment

### Backend → Render
1. Create a new **Web Service** on [Render](https://render.com)
2. Connect your GitHub repo
3. Set **Root Directory** to `backend`
4. **Build Command:** `npm install`
5. **Start Command:** `node src/server.js`
6. Add all environment variables from above

### Frontend → Vercel
1. Import your repo on [Vercel](https://vercel.com)
2. Set **Root Directory** to `frontend`
3. **Framework:** Vite
4. Add environment variable:
   ```
   VITE_BACKEND_URL = https://your-render-url.onrender.com
   ```

---

## 📁 Project Structure

```
chat-app/
├── backend/
│   ├── src/
│   │   ├── server.js              # Express entry point
│   │   ├── db/database.js         # Turso (libsql) client + schema
│   │   ├── middleware/
│   │   │   ├── auth.js            # JWT middleware
│   │   │   └── errorHandler.js
│   │   ├── routes/
│   │   │   ├── auth.js            # Register / Login
│   │   │   ├── chat.js            # Streaming AI responses (SSE)
│   │   │   ├── conversations.js   # CRUD conversations
│   │   │   ├── upload.js          # File upload & text extraction
│   │   │   ├── image.js           # Image generation
│   │   │   └── profile.js         # Avatar + settings
│   │   └── services/
│   │       ├── groq.js            # Groq streaming client
│   │       ├── ollama.js          # Local LLM fallback
│   │       ├── pdfReader.js       # PDF/Word/Excel text extraction
│   │       └── scheduler.js       # 30-day auto-delete job
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── App.jsx
    │   ├── components/
    │   │   ├── Sidebar.jsx        # Responsive sidebar with hamburger
    │   │   ├── ChatWindow.jsx     # Message list + streaming
    │   │   ├── MessageBubble.jsx  # Markdown + syntax highlighting
    │   │   ├── ChatInput.jsx      # Input + file attach menu
    │   │   ├── AttachMenu.jsx     # File type picker popup
    │   │   ├── NewChatSuggestions.jsx
    │   │   ├── WelcomeScreen.jsx
    │   │   └── UploadModal.jsx
    │   ├── pages/
    │   │   ├── ChatPage.jsx
    │   │   ├── LoginPage.jsx
    │   │   ├── RegisterPage.jsx
    │   │   └── ProfilePage.jsx
    │   ├── store/
    │   │   ├── authStore.js       # Zustand auth (persisted)
    │   │   └── chatStore.js       # Zustand chat state
    │   └── lib/
    │       ├── api.js             # Axios instance
    │       └── utils.js           # Asset URL helpers
    └── package.json
```

---

## 📱 Supported File Types

| Category | Extensions |
|----------|-----------|
| Documents | PDF, TXT, MD |
| Word | .doc, .docx |
| Spreadsheets | .xls, .xlsx, .csv |
| Code | .js, .ts, .py, .java, .c, .cpp, .go, .php, .rb, .html, .css, .json, .sql... |
| Images | JPG, PNG, GIF, WebP (for analysis) |

---

## 🔑 API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/auth/register | Create account |
| POST | /api/auth/login | Login |
| GET | /api/conversations | List conversations |
| POST | /api/conversations | New conversation |
| DELETE | /api/conversations/:id | Delete conversation |
| POST | /api/chat/:id/message | Send message (SSE stream) |
| POST | /api/upload | Upload file |
| GET | /api/upload/:id/text | Get extracted text |
| POST | /api/image/generate | Generate image |
| GET | /api/profile | Get profile |
| POST | /api/profile/avatar | Upload avatar |
| PATCH | /api/profile | Update settings |

---

## 👨‍💻 Author

**Shlesh Darji**  
CSE Student · LJ University  
GitHub: [@Shlesh2007](https://github.com/Shlesh2007)

---

*Built with ❤️ using React, Node.js, Groq, and Turso*
