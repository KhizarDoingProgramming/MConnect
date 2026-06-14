import mongoose, { Schema, Document } from 'mongoose';

export interface IRoom extends Document {
  name: string;
  type: 'text' | 'voice';
  isPrivate: boolean;
  members: mongoose.Types.ObjectId[];
  roles: Map<string, string[]>;
}

const RoomSchema: Schema = new Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['text', 'voice'], required: true },
  isPrivate: { type: Boolean, default: false },
  members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  roles: {
    type: Map,
    of: [String],
    default: new Map()
  }
}, { timestamps: true });

RoomSchema.index({ members: 1 });

export const Room = mongoose.model<IRoom>('Room', RoomSchema);
