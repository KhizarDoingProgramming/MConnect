# MConnect 💬

*Real-time messaging, no cap. Connect with your people instantly.*

MConnect is a modern, full-stack messaging application built for speed and reliability. Whether you're building communities, managing teams, or just staying connected, we've got you covered.

---

## ✨ What's Inside

- **Real-time Communication** — Socket.io powered messaging that actually works
- **Clean Architecture** — Monorepo setup with separated API and frontend
- **Type Safe** — TypeScript throughout the stack for peace of mind
- **Modern Stack** — Next.js, Node.js, MongoDB, and all the good stuff
- **Production Ready** — Built for scale from day one

---

## 🛠️ Tech Stack

| Layer | Tech |
|-------|------|
| **Frontend** | Next.js 14+, React, TypeScript, Tailwind CSS |
| **Backend** | Node.js, Express/Socket.io, TypeScript |
| **Database** | MongoDB |
| **Real-time** | Socket.io |
| **Monorepo** | npm workspaces |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ (non-negotiable)
- npm 8+ or pnpm
- MongoDB instance running (local or Atlas)

### Installation

```bash
# Clone and navigate
git clone <your-repo>
cd MConnect

# Install dependencies across the monorepo
npm install

# Set up environment variables
cp .env.example .env.local
# Fill in your MongoDB URI and other configs

# Start developing
npm run dev
```

This fires up both the API and web app simultaneously. Check the terminal for the URLs.

---

## 📁 Project Structure

```
MConnect/
├── apps/
│   ├── api/              # Backend server & Socket.io
│   │   └── src/
│   │       ├── server.ts # Main server setup
│   │       ├── socket.ts # Real-time events
│   │       └── models/   # Data schemas
│   └── web/              # Next.js frontend
│       ├── app/          # App router pages
│       ├── components/   # React components
│       └── lib/          # Utilities & DB client
├── packages/
│   └── shared/           # Shared types & helpers
└── package.json          # Workspace root
```

---

## 💾 Features

### Authentication
- Secure signup & login flows
- JWT-based sessions (configurable)
- Protected API routes

### Messaging
- Create chat rooms instantly
- Real-time message delivery
- See who's online
- User profiles

### Developer Experience
- Hot reload in dev mode
- Type hints across the entire codebase
- Organized folder structure
- Easy to extend

---

## 🔧 Available Scripts

```bash
npm run dev        # Start both API and web in development mode
npm run build      # Build for production
npm run start      # Run production build
npm run lint       # Check code quality
```

---

## 📚 API Endpoints

### Authentication
- `POST /api/auth/signup` — Create new account
- `POST /api/auth/login` — Login
- `POST /api/auth/logout` — Logout
- `GET /api/auth/me` — Get current user

### Messaging
- `GET /api/messages/[roomId]` — Fetch messages
- `POST /api/messages/[roomId]` — Send message

### Users
- `GET /api/users` — List users
- `POST /api/profile/update` — Update profile

---

## 🤝 Contributing

Have ideas? Found a bug? Let's fix it.

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/your-idea`)
3. Commit your changes (`git commit -m 'Add something cool'`)
4. Push and open a PR

---

## 📝 License

MIT License — Use it however you want.

---

**Built with 💙 by Mustafa. Questions? Open an issue.**
