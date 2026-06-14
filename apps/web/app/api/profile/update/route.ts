import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { User } from '@/lib/models/User';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_development';

export async function POST(req: Request) {
  try {
    const cookieHeader = req.headers.get('cookie') || '';
    const match = cookieHeader.match(/token=([^;]+)/);
    const token = match ? match[1] : null;
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    await dbConnect();

    const body = await req.json();
    const { displayName, customStatus, avatarUrl, status } = body;

    const update: any = {};
    if (displayName !== undefined) update.displayName = displayName;
    if (customStatus !== undefined) update.customStatus = customStatus;
    if (avatarUrl !== undefined) update.avatarUrl = avatarUrl;
    if (status !== undefined) update.status = status;

    const updatedUser = await User.findByIdAndUpdate(
      decoded.id,
      update,
      { new: true }
    ).select('-passwordHash');

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
