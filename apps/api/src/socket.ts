import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
  Message,
  UserStatus,
  User as SharedUser
} from '@mconnect/shared';
import cookie from 'cookie';
import jwt from 'jsonwebtoken';
import { User } from './models/User.js';
import { Message as MessageModel } from './models/Message.js';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_development';
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://127.0.0.1:3000')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

export class SocketService {
  private io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

  constructor(server: HttpServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: allowedOrigins,
        methods: ['GET', 'POST'],
        credentials: true
      }
    });
    this.initialize();
  }

  private initialize() {
    // ─── Auth Middleware ────────────────────────────────────────────────────────
    this.io.use(async (socket, next) => {
      let token = socket.handshake.auth.token;

      if (!token && socket.handshake.headers.cookie) {
        const cookies = cookie.parse(socket.handshake.headers.cookie);
        token = cookies.token;
      }

      if (!token) return next(new Error('No token'));

      try {
        const decoded = jwt.verify(token, JWT_SECRET) as { id: string; username: string };
        const userDoc = await User.findById(decoded.id);
        if (!userDoc) return next(new Error('User not found'));

        socket.data.user = {
          id: userDoc._id.toString(),
          username: userDoc.username,
          avatarUrl: userDoc.avatarUrl,
          status: userDoc.status as UserStatus,
        } as SharedUser;

        next();
      } catch {
        next(new Error('Invalid token'));
      }
    });

    // ─── Connection Handler ─────────────────────────────────────────────────────
    this.io.on('connection', async (socket) => {
      const user = socket.data.user!;

      // Mark online in DB
      await User.findByIdAndUpdate(user.id, { status: 'online' });
      this.io.emit('userStatusUpdate', user.id, 'online');

      // ── Join Room ───────────────────────────────────────────────────────────
      socket.on('joinRoom', (roomId) => {
        socket.join(roomId);
        socket.emit('roomJoined', { id: roomId, name: roomId, type: 'public', members: [user.id] });
      });

      // ── Leave Room ──────────────────────────────────────────────────────────
      socket.on('leaveRoom', (roomId) => {
        socket.leave(roomId);
        socket.emit('roomLeft', roomId);
      });

      // ── Send Message ────────────────────────────────────────────────────────
      socket.on('sendMessage', async (roomId, partialMessage) => {
        try {
          const newMsg = await MessageModel.create({
            roomId,
            senderId: user.id,
            type: partialMessage.type || 'text',
            content: (partialMessage as any).content,
            imageUrl: (partialMessage as any).imageUrl,
            caption: (partialMessage as any).caption,
            fileName: (partialMessage as any).fileName,
            fileSize: (partialMessage as any).fileSize,
            timestamp: new Date()
          });

          const message: any = {
            id: newMsg._id.toString(),
            senderId: user.id,
            senderName: user.username,
            senderAvatar: user.avatarUrl,
            roomId,
            type: newMsg.type,
            content: newMsg.content,
            imageUrl: newMsg.imageUrl,
            caption: newMsg.caption,
            fileName: newMsg.fileName,
            fileSize: newMsg.fileSize,
            timestamp: newMsg.timestamp
          };

          // Emit to ALL clients in room INCLUDING sender (for cross-browser sync)
          this.io.to(roomId).emit('message', message as Message);
        } catch (error) {
          console.error('Error saving message:', error);
          socket.emit('error', 'Failed to send message');
        }
      });

      // ── Typing ──────────────────────────────────────────────────────────────
      socket.on('typing', (roomId, isTyping) => {
        socket.to(roomId).emit('typingIndicator', roomId, user.id, isTyping);
      });

      // ── Status Update ───────────────────────────────────────────────────────
      socket.on('updateStatus', async (status: UserStatus) => {
        try {
          await User.findByIdAndUpdate(user.id, { status });
          user.status = status;
          this.io.emit('userStatusUpdate', user.id, status);
        } catch (error) {
          console.error('Error updating status:', error);
        }
      });

      // ── Disconnect ──────────────────────────────────────────────────────────
      socket.on('disconnect', async () => {
        await User.findByIdAndUpdate(user.id, { status: 'offline' });
        this.io.emit('userStatusUpdate', user.id, 'offline');
      });
    });
  }

  public getIO(): SocketIOServer {
    return this.io;
  }
}
