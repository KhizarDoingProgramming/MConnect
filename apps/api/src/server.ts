import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import { SocketService } from './socket.js';
import { prisma } from './lib/prisma.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_development';

const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://127.0.0.1:3000')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(express.json());

const httpServer = createServer(app);
const socketService = new SocketService(httpServer);

const PORT = process.env.PORT || 3001;

// --- REST API ROUTES ---

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Auth Middleware for REST API
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Auth - Signup
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, username } = req.body;
    if (!email || !password || !username) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        email,
        username,
        passwordHash,
      },
    });

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ message: 'Signup successful', user: { id: user.id, username: user.username, status: user.status }, token });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Auth - Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ message: 'Login successful', user: { id: user.id, username: user.username, status: user.status }, token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Auth - Me
app.get('/api/auth/me', authenticateToken, async (req: any, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user: { id: user.id, username: user.username, status: user.status, avatarUrl: user.avatarUrl } });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Users - List all users (for dummy roster)
app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, username: true, status: true, avatarUrl: true }
    });
    const formatted = users.map(u => ({ id: u.id, name: u.username, status: u.status, avatarUrl: u.avatarUrl }));
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Messages - History for a room
app.get('/api/messages/:roomId', authenticateToken, async (req, res) => {
  try {
    const { roomId } = req.params;
    const messages = await prisma.message.findMany({
      where: { conversationId: roomId },
      include: { sender: { select: { username: true, avatarUrl: true } } },
      orderBy: { createdAt: 'asc' }
    });

    const formatted = messages.map((m: any) => ({
      id: m.id,
      senderId: m.senderId,
      senderName: m.sender.username,
      senderAvatar: m.sender.avatarUrl,
      roomId: m.conversationId,
      type: m.type,
      content: m.content,
      imageUrl: m.imageUrl,
      timestamp: m.createdAt
    }));
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

httpServer.listen(PORT, () => {
  console.log(`API Server running on port ${PORT}`);
});
