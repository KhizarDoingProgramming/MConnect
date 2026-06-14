import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { User } from '@/lib/models/User';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_development';

export async function GET(req: Request) {
  try {
    const cookieHeader = req.headers.get('cookie') || '';
    const match = cookieHeader.match(/token=([^;]+)/);
    const token = match ? match[1] : null;
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };

    await dbConnect();
    // Return ALL users except self, with full profile info
    const users = await User.find({ _id: { $ne: decoded.id } }, '_id username displayName avatarUrl customStatus status').lean();
    return NextResponse.json(users.map((u: any) => ({
      id: u._id.toString(),
      username: u.username,
      displayName: u.displayName || u.username,
      avatarUrl: u.avatarUrl || null,
      customStatus: u.customStatus || '',
      status: u.status || 'offline',
    })));
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}
