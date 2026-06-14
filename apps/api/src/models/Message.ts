import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
  roomId: string;  // String — can be 'dm_userA_userB' or any room slug
  senderId: mongoose.Types.ObjectId;
  type: 'text' | 'image' | 'file';
  content?: string;
  imageUrl?: string;
  caption?: string;
  fileName?: string;
  fileSize?: number;
  timestamp: Date;
}

const MessageSchema: Schema = new Schema({
  roomId: { type: String, required: true, index: true },
  senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['text', 'image', 'file'], required: true },
  content: { type: String },
  imageUrl: { type: String },
  caption: { type: String },
  fileName: { type: String },
  fileSize: { type: Number },
  timestamp: { type: Date, default: Date.now, required: true }
}, { timestamps: true });

export const Message = mongoose.model<IMessage>('Message', MessageSchema);
