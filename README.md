# Chat-App 🤖 — Next-Gen AI Assistant

A state-of-the-art, full-stack AI chat application built by **Shlesh Darji**, CSE student at LJ University.

🌐 **Official Live Website**: [https://chatapp-pi-woad.vercel.app](https://chatapp-pi-woad.vercel.app/)  
⚙️ **Backend API Service**: [https://chat-app-fn2c.onrender.com](https://chat-app-fn2c.onrender.com)

[![Live Application](https://img.shields.io/badge/Live_App-https%3A%2F%2Fchatapp--pi--woad.vercel.app-6366f1?style=for-the-badge&logo=vercel)](https://chatapp-pi-woad.vercel.app/)
[![Backend API](https://img.shields.io/badge/Backend_API-Render-06b6d4?style=for-the-badge&logo=render)](https://chat-app-fn2c.onrender.com)

---

## 🌟 Key Features

### 🔐 Authentication & OAuth 2.0
- **Real Google OAuth 2.0 Popup**: Single-click sign in via official Google Accounts popup with automatic profile picture & email synchronization.
- **Real GitHub OAuth 2.0 Popup**: Single-click developer sign in via GitHub OAuth authorization with avatar sync.
- **Interactive Anti-Robot Security Puzzle**: Slide-to-Align human verification puzzle for password reset & security.
- **Master Admin Override**: Hardcoded master administrative login override (`admin` / `admin123`).

### 🎨 Design System & 4-Theme Engine
- **4 Custom Themes**:
  - 🌌 **Cyber Dark** (Default neon glassmorphic dark mode)
  - 🌿 **Emerald Mint** (Refreshing dark emerald & teal palette)
  - 🌌 **Midnight Sapphire** (Deep sapphire navy blue palette)
  - ☀️ **Crisp Light** (Ultra-clean modern light mode)
- **Glassmorphic Aesthetics**: Modern GPU-accelerated backdrop blurs, ambient glowing background meshes, and micro-animations.

### 📱 60fps Native Mobile Experience
- **Always Sticky Bottom Bar**: Fixed input bar (`100dvh`) with `Ask AI anything...` placeholder, paperclip attachment menu (`📎`), and send button (`➤`).
- **Overscroll Protection**: Scroll boundaries (`overscroll-contain`) prevent mobile browser elastic bounce from shifting the input bar.
- **Slide-out Mobile Drawer**: Touch-friendly collapsible sidebar drawer (`animate-slideRight`) with tap-outside dismissal.
- **Mobile Responsive 2x2 Grid**: 4 suggestion prompt cards organized in a balanced 2x2 grid across all devices.

### 🤖 AI Capabilities & Image Generation
- **Ultra-Fast Streaming**: Powered by **Groq API** (`qwen/qwen3.6-27b`) with clean reasoning tag filtering (`<think>`).
- **AI Image Generation & Styling**: Instant Text-to-Image & Image-to-Image prompts (e.g. Studio Ghibli anime style, professional business suit photo).
- **Direct Local File Downloads**: Direct Blob fetch to download generated images straight into local `Downloads/` folder.
- **Multi-Format File Analysis**: Upload and analyze PDFs, Word documents, Excel sheets, CSVs, code files, and images via paperclip.

### 💳 Payments & Admin Dashboard
- **Razorpay Rupee Credits**: Rupee to Paise (100x) unit conversion for starter, popular, and pro credit packs.
- **Direct SBI Bank Account Settlement**: Support for linking personal SBI account numbers & IFSC codes in Razorpay dashboard.
- **Admin Control Panel**: View user details, message history, spam violation logs, and block/unblock users.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, Zustand, Lucide Icons, React Markdown, Remark GFM |
| **Backend** | Node.js, Express, Cors, Helmet, Rate Limiter |
| **Database** | Turso (Cloud LibSQL / SQLite) |
| **AI Models** | Groq API (`qwen/qwen3.6-27b`), Ollama (Local LLM fallback) |
| **OAuth 2.0** | Google Identity Services, GitHub OAuth 2.0 |
| **Image Generation** | Pollinations.ai Engine |
| **Payments** | Razorpay Node SDK (Rupee / Paise) |
| **Deployment** | Vercel (Frontend) + Render (Backend) |

---

## 🚀 Local Development Setup

### Prerequisites
- Node.js v18+
- [Groq API Key](https://console.groq.com)
- [Turso Database](https://turso.tech)

### Installation

1. **Clone Repository**:
   ```bash
   git clone https://github.com/Shlesh2007/chat-app.git
   cd chat-app
   ```

2. **Install Dependencies**:
   ```bash
   npm run install:all
   ```

3. **Configure Environment Variables**:
   
   **Frontend (`frontend/.env`)**:
   ```env
   VITE_API_URL=http://localhost:3001/api
   VITE_BACKEND_URL=http://localhost:3001
   VITE_GOOGLE_CLIENT_ID=311510791510-57sj4ek9rsf5tec7meqigl93sqbqcu1b.apps.googleusercontent.com
   VITE_GITHUB_CLIENT_ID=Ov23lig2Ojitx2TBIb03
   ```

   **Backend (`backend/.env`)**:
   ```env
   PORT=3001
   NODE_ENV=development
   JWT_SECRET=your_jwt_secret_key
   GROQ_API_KEY=your_groq_api_key
   GROQ_MODEL=qwen/qwen3.6-27b
   TURSO_URL=libsql://your-db.turso.io
   TURSO_TOKEN=your_turso_token
   GOOGLE_CLIENT_ID=311510791510-57sj4ek9rsf5tec7meqigl93sqbqcu1b.apps.googleusercontent.com
   GITHUB_CLIENT_ID=Ov23lig2Ojitx2TBIb03
   RAZORPAY_KEY_ID=your_razorpay_key_id
   RAZORPAY_KEY_SECRET=your_razorpay_secret
   ```

4. **Run Development Server**:
   ```bash
   npm run dev
   ```
   Opens application at `http://localhost:5173`.

---

## 🌐 Production Deployment

### Frontend (Vercel)
- **Framework Preset**: Vite
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Environment Variables**:
  - `VITE_BACKEND_URL = https://chat-app-fn2c.onrender.com`
  - `VITE_GOOGLE_CLIENT_ID = 311510791510-57sj4ek9rsf5tec7meqigl93sqbqcu1b.apps.googleusercontent.com`
  - `VITE_GITHUB_CLIENT_ID = Ov23lig2Ojitx2TBIb03`

### Backend (Render)
- **Environment**: Node
- **Root Directory**: `backend`
- **Build Command**: `npm install`
- **Start Command**: `node src/server.js`
- **Environment Variables**: Add all keys from `backend/.env`.

---

## 📁 Project Structure

```
chat-app/
├── backend/
│   ├── src/
│   │   ├── server.js          # Express entry point
│   │   ├── db/database.js     # Turso database connection
│   │   ├── middleware/        # Auth & error handling middleware
│   │   ├── routes/            # Auth, chat, admin, image, payment routes
│   │   └── services/          # Groq, Ollama, & RAG services
│   └── package.json
└── frontend/
    ├── public/
    │   └── oauth-callback.html # OAuth popup window handler
    ├── src/
    │   ├── components/        # Sidebar, ChatWindow, ChatInput, MessageBubble
    │   ├── pages/             # ChatPage, LoginPage, RegisterPage, AdminPage, ProfilePage
    │   ├── store/             # Zustand chatStore, authStore, theme Store
    │   └── lib/               # Axios API client, theme configuration
    └── package.json
```

---

## 👤 Author

**Shlesh Darji** · CSE Student · LJ University  
GitHub: [@Shlesh2007](https://github.com/Shlesh2007)
