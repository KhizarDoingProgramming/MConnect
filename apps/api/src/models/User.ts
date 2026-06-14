import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  username: string;
  passwordHash: string;
  displayName?: string;
  customStatus?: string;
  avatarUrl?: string;
  bannerColor?: string;
  status: 'online' | 'invisible' | 'away' | 'offline';
}

const UserSchema: Schema = new Schema({
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  displayName: { type: String },
  customStatus: { type: String },
  avatarUrl: { type: String },
  bannerColor: { type: String },
  status: { type: String, enum: ['online', 'invisible', 'away', 'offline'], default: 'offline' }
}, { timestamps: true });

export const User = mongoose.model<IUser>('User', UserSchema);
