import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { generateToken } from '@/lib/auth';

export async function POST(request) {
  try {
    await dbConnect();
    
    const { username, password } = await request.json();

    // Validasyon
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Kullanıcı adı ve şifre gerekli' },
        { status: 400 }
      );
    }

    // Kullanıcıyı bul
    const user = await User.findOne({ username });

    if (!user) {
      return NextResponse.json(
        { error: 'Kullanıcı bulunamadı' },
        { status: 404 }
      );
    }

    // Şifreyi kontrol et
    const isValidPassword = await user.comparePassword(password);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Geçersiz şifre' },
        { status: 401 }
      );
    }

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
      { status: 200 }
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
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Giriş işlemi başarısız' },
      { status: 500 }
    );
  }
}
