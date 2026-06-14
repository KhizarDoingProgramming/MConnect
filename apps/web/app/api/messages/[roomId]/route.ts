import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Message } from '@/lib/models/Message';
import { User } from '@/lib/models/User';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_development';

export async function GET(req: Request, { params }: { params: { roomId: string } }) {
  try {
    const cookieHeader = req.headers.get('cookie') || '';
    const match = cookieHeader.match(/token=([^;]+)/);
    const token = match ? match[1] : null;
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    jwt.verify(token, JWT_SECRET);

    await dbConnect();
    const { roomId } = params;

    const messages = await Message.find({ roomId })
      .sort({ timestamp: 1 })
      .limit(100)
      .lean();

    // Populate sender info
    const senderIds = [...new Set(messages.map((m: any) => m.senderId?.toString()))];
    const users = await User.find({ _id: { $in: senderIds } }, '_id username avatarUrl').lean();
    const userMap: Record<string, any> = {};
    users.forEach((u: any) => { userMap[u._id.toString()] = u; });

    const enriched = messages.map((m: any) => ({
      id: m._id.toString(),
      roomId: m.roomId,
      senderId: m.senderId?.toString(),
      senderName: userMap[m.senderId?.toString()]?.username || 'Unknown',
      senderAvatar: userMap[m.senderId?.toString()]?.avatarUrl || null,
      type: m.type,
      content: m.content,
      imageUrl: m.imageUrl,
      caption: m.caption,
      fileName: m.fileName,
      fileSize: m.fileSize,
      timestamp: m.timestamp,
    }));

    return NextResponse.json(enriched);
  } catch (error) {
    console.error('Messages fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}
