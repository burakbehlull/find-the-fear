import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { generateToken } from '@/lib/auth';

export async function POST(request) {
  try {
    await dbConnect();
    
    const { username, email, password } = await request.json();

    // Validasyon
    if (!username || !email || !password) {
      return NextResponse.json(
        { error: 'Tüm alanlar gerekli' },
        { status: 400 }
      );
    }

    // Kullanıcı var mı kontrol et
    const existingUser = await User.findOne({ 
      $or: [{ username }, { email }] 
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Kullanıcı adı veya e-posta zaten kullanımda' },
        { status: 400 }
      );
    }

    // Yeni kullanıcı oluştur
    const user = await User.create({
      username,
      email,
      password,
    });

    // Token oluştur
    const token = generateToken(user._id);

    const response = NextResponse.json(
      { 
        success: true,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
        }
      },
      { status: 201 }
    );

    // Cookie'ye token'ı ekle
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 gün
    });

    return response;
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { error: 'Kayıt işlemi başarısız' },
      { status: 500 }
    );
  }
}
