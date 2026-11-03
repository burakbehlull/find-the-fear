import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request) {
  try {
    await dbConnect();
    
    const userId = getUserFromRequest(request);
    
    if (!userId) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const user = await User.findById(userId).select('-password');

    if (!user) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    return NextResponse.json({
      user: {
        id: user._id,
        userId: user._id.toString(),
        username: user.username,
        email: user.email,
        role: user.role || 'user',
        watchedMovies: user.watchedMovies,
        createdAt: user.createdAt,
        lastUsernameChange: user.lastUsernameChange,
      }
    });
  } catch (error) {
    console.error('Me error:', error);
    return NextResponse.json({ user: null }, { status: 200 });
  }
}
