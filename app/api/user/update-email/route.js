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

    const { email } = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { success: false, message: 'Geçerli bir email adresi girin' },
        { status: 400 }
      );
    }

    await connectDB();

    const currentUser = await User.findById(user.userId);
    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: 'Kullanıcı bulunamadı' },
        { status: 404 }
      );
    }


    const existingUser = await User.findOne({ email });
    if (existingUser && existingUser._id.toString() !== currentUser._id.toString()) {
      return NextResponse.json(
        { success: false, message: 'Bu email adresi zaten kullanılıyor' },
        { status: 409 }
      );
    }

 
    currentUser.email = email;
    await currentUser.save();

    return NextResponse.json({
      success: true,
      message: 'Email güncellendi',
      user: {
        email: currentUser.email,
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
