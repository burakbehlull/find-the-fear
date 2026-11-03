import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

// GET - Tüm kullanıcıları listele (sadece admin)
export async function GET(request) {
  try {
    const user = await verifyAuth(request);
    
    if (!user || !user.isAdmin) {
      return NextResponse.json(
        { success: false, message: 'Yetkisiz erişim' },
        { status: 403 }
      );
    }

    await connectDB();

    const users = await User.find({})
      .select('username email roles createdAt watchedMovies')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      users: users.map(u => ({
        _id: u._id,
        username: u.username,
        email: u.email,
        roles: u.roles || ['user'],
        createdAt: u.createdAt,
        movieCount: u.watchedMovies?.length || 0,
      })),
    });
  } catch (error) {
    console.error('Kullanıcı listesi hatası:', error);
    return NextResponse.json(
      { success: false, message: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}
