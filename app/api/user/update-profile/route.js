import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function PUT(request) {
  try {
    // Kullanıcı kontrolü
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Giriş yapmalısınız' },
        { status: 401 }
      );
    }

    const { bio, favoriteGenre, profileImage } = await request.json();

    // Validasyon
    if (bio && bio.length > 200) {
      return NextResponse.json(
        { success: false, message: 'Bio en fazla 200 karakter olabilir' },
        { status: 400 }
      );
    }

    await connectDB();

    // Mevcut kullanıcıyı bul
    const currentUser = await User.findById(user.userId);
    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: 'Kullanıcı bulunamadı' },
        { status: 404 }
      );
    }

    // Profil bilgilerini güncelle
    if (bio !== undefined) currentUser.bio = bio;
    if (favoriteGenre !== undefined) currentUser.favoriteGenre = favoriteGenre;
    if (profileImage !== undefined) currentUser.profileImage = profileImage;

    await currentUser.save();

    return NextResponse.json({
      success: true,
      message: 'Profil güncellendi',
      user: {
        bio: currentUser.bio,
        favoriteGenre: currentUser.favoriteGenre,
        profileImage: currentUser.profileImage,
      },
    });
  } catch (error) {
    console.error('Profil güncelleme hatası:', error);
    return NextResponse.json(
      { success: false, message: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}
