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

    // Roller array olarak güncelle (migration)
    if (!Array.isArray(user.roles)) {
      user.roles = ['user'];
      await user.save();
    }

    const isAdmin = user.roles?.includes('admin') || user.roles?.includes('owner');
    const isOwner = user.roles?.includes('owner');

    console.log('Auth check:', { // Debug
      username: user.username,
      roles: user.roles,
      isAdmin,
      isOwner
    });

    return NextResponse.json({
      user: {
        id: user._id,
        userId: user._id.toString(),
        username: user.username,
        email: user.email,
        roles: user.roles || ['user'],
        // Helper properties
        isAdmin,
        isOwner,
        watchedMovies: user.watchedMovies,
        createdAt: user.createdAt,
        lastUsernameChange: user.lastUsernameChange,
        bio: user.bio,
        favoriteGenre: user.favoriteGenre,
        profileImage: user.profileImage,
      }
    });
  } catch (error) {
    console.error('Me error:', error);
    return NextResponse.json({ user: null }, { status: 200 });
  }
}
