import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { differenceInDays } from 'date-fns';

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

    const { username } = await request.json();

    if (!username || username.length < 3) {
      return NextResponse.json(
        { success: false, message: 'Kullanıcı adı en az 3 karakter olmalı' },
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

    // 7 günlük kontrol
    if (currentUser.lastUsernameChange) {
      const daysSinceChange = differenceInDays(new Date(), new Date(currentUser.lastUsernameChange));
      if (daysSinceChange < 7) {
        return NextResponse.json(
          { success: false, message: `Kullanıcı adını değiştirmek için ${7 - daysSinceChange} gün beklemelisiniz` },
          { status: 403 }
        );
      }
    }

    // Kullanıcı adı zaten kullanılıyor mu?
    const existingUser = await User.findOne({ username });
    if (existingUser && existingUser._id.toString() !== currentUser._id.toString()) {
      return NextResponse.json(
        { success: false, message: 'Bu kullanıcı adı zaten kullanılıyor' },
        { status: 409 }
      );
    }

    // Kullanıcı adını güncelle
    currentUser.username = username;
    currentUser.lastUsernameChange = new Date();
    await currentUser.save();

    return NextResponse.json({
      success: true,
      message: 'Kullanıcı adı güncellendi',
      user: {
        username: currentUser.username,
        lastUsernameChange: currentUser.lastUsernameChange,
      },
    });
  } catch (error) {
    console.error('Kullanıcı adı güncelleme hatası:', error);
    return NextResponse.json(
      { success: false, message: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}
