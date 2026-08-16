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
        username: user.username,
        email: user.email,
        watchedMovies: user.watchedMovies,
      }
    });
  } catch (error) {
    console.error('Me error:', error);
    return NextResponse.json({ user: null }, { status: 200 });
  }
}
