import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMessage extends Document {
  roomId: string;
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
  timestamp: { type: Date, default: Date.now },
}, { timestamps: true });

export const Message: Model<IMessage> = mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema);
