import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function PUT(request) {
  try {
    // Kullanıcı kontrolü
    const authResult = await verifyAuth(request);
    if (!authResult.authenticated) {
      return NextResponse.json(
        { success: false, message: 'Giriş yapmalısınız' },
        { status: 401 }
      );
    }

    const { email } = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { success: false, message: 'Geçerli bir email adresi girin' },
        { status: 400 }
      );
    }

    await connectDB();

    // Mevcut kullanıcıyı bul
    const user = await User.findById(authResult.user.userId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Kullanıcı bulunamadı' },
        { status: 404 }
      );
    }

    // Email zaten kullanılıyor mu?
    const existingUser = await User.findOne({ email });
    if (existingUser && existingUser._id.toString() !== user._id.toString()) {
      return NextResponse.json(
        { success: false, message: 'Bu email adresi zaten kullanılıyor' },
        { status: 409 }
      );
    }

    // Email'i güncelle
    user.email = email;
    await user.save();

    return NextResponse.json({
      success: true,
      message: 'Email güncellendi',
      user: {
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Email güncelleme hatası:', error);
    return NextResponse.json(
      { success: false, message: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}
