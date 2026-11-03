import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { verifyAuth } from '@/lib/auth';

// PATCH - Profil güncelle
export async function PATCH(request) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Giriş yapmalısınız' },
        { status: 401 }
      );
    }

    await connectDB();

    const body = await request.json();
    const { bio, profileImage, favoriteGenre, showMovies } = body;

    const updateData = {};

    if (bio !== undefined) updateData.bio = bio;
    if (profileImage !== undefined) updateData.profileImage = profileImage;
    if (favoriteGenre !== undefined) updateData.favoriteGenre = favoriteGenre;
    if (showMovies !== undefined) updateData['privacy.showMovies'] = showMovies;

    const userData = await User.findByIdAndUpdate(
      user.userId,
      { $set: updateData },
      { new: true, select: '-password' }
    );

    return NextResponse.json({
      success: true,
      message: 'Profil güncellendi',
      user: userData,
    });
  } catch (error) {
    console.error('Profil güncelleme hatası:', error);
    return NextResponse.json(
      { success: false, message: 'Profil güncellenemedi' },
      { status: 500 }
    );
  }
}
