import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IRoom extends Document {
  name: string;
  type: 'text' | 'voice';
  isPrivate: boolean;
  members: mongoose.Types.ObjectId[];
}

const RoomSchema: Schema = new Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['text', 'voice'], required: true, default: 'text' },
  isPrivate: { type: Boolean, default: false },
  members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

export const Room: Model<IRoom> = mongoose.models.Room || mongoose.model<IRoom>('Room', RoomSchema);
