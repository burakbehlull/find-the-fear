import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

// PUT - Kullanıcı rolünü güncelle (sadece owner)
export async function PUT(request) {
  try {
    const currentUser = await verifyAuth(request);
    
    // Sadece owner yapabilir
    if (!currentUser || !currentUser.isOwner) {
      return NextResponse.json(
        { success: false, message: 'Bu işlem için owner yetkisi gerekli' },
        { status: 403 }
      );
    }

    const { userId, action } = await request.json();

    if (!userId || !action) {
      return NextResponse.json(
        { success: false, message: 'userId ve action gerekli' },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Kullanıcı bulunamadı' },
        { status: 404 }
      );
    }

    // Owner kendini düzenleyemez
    if (user._id.toString() === currentUser.userId) {
      return NextResponse.json(
        { success: false, message: 'Kendi rolünüzü değiştiremezsiniz' },
        { status: 400 }
      );
    }

    // Başka bir owner'ı düzenleyemez
    if (user.roles.includes('owner')) {
      return NextResponse.json(
        { success: false, message: 'Başka bir owner\'ın rolünü değiştiremezsiniz' },
        { status: 400 }
      );
    }

    // Rol güncelleme
    if (action === 'make-admin') {
      if (!user.roles.includes('admin')) {
        user.roles.push('admin');
      }
    } else if (action === 'remove-admin') {
      user.roles = user.roles.filter(r => r !== 'admin');
      // En az 'user' rolü olmalı
      if (!user.roles.includes('user')) {
        user.roles.push('user');
      }
    } else {
      return NextResponse.json(
        { success: false, message: 'Geçersiz action' },
        { status: 400 }
      );
    }

    await user.save();

    return NextResponse.json({
      success: true,
      message: action === 'make-admin' ? 'Kullanıcı admin yapıldı' : 'Admin yetkisi kaldırıldı',
      user: {
        _id: user._id,
        username: user.username,
        roles: user.roles,
      },
    });
  } catch (error) {
    console.error('Rol güncelleme hatası:', error);
    return NextResponse.json(
      { success: false, message: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}
