export type UserStatus = 'online' | 'away' | 'offline';

export interface User {
  id: string;
  username: string;
  avatarUrl?: string;
  status: UserStatus;
  lastSeen?: Date;
}

export interface Room {
  id: string;
  name: string;
  type: 'public' | 'private' | 'direct';
  members: string[];
}

export interface BaseMessage {
  id: string;
  roomId: string;
  senderId: string;
  timestamp: Date;
}

export interface TextMessage extends BaseMessage {
  type: 'text';
  content: string;
}

export interface ImageMessage extends BaseMessage {
  type: 'image';
  imageUrl: string;
  caption?: string;
}

export interface FileMessage extends BaseMessage {
  type: 'file';
  fileUrl: string;
  fileName: string;
  fileSize: number;
}

export type Message = TextMessage | ImageMessage | FileMessage;

export interface ServerToClientEvents {
  message: (message: Message) => void;
  userStatusUpdate: (userId: string, status: UserStatus) => void;
  typingIndicator: (roomId: string, userId: string, isTyping: boolean) => void;
  roomJoined: (room: Room) => void;
  roomLeft: (roomId: string) => void;
  error: (message: string) => void;
  globalEventTicker: (eventText: string, metadata?: any) => void;
}

export interface ClientToServerEvents {
  sendMessage: (roomId: string, message: Omit<Message, 'id' | 'timestamp' | 'senderId'>) => void;
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
  typing: (roomId: string, isTyping: boolean) => void;
  updateStatus: (status: UserStatus) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  user: User;
}
