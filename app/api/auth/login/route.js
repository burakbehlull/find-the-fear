import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { generateToken } from '@/lib/auth';

// Rate limiting için basit in-memory store
const loginAttempts = new Map();
const MAX_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 dakika

// Input sanitization
function sanitizeInput(input) {
  if (typeof input !== 'string') return '';
  return input.trim().replace(/[<>]/g, '');
}

// Rate limiting kontrolü
function checkRateLimit(identifier) {
  const now = Date.now();
  const attempts = loginAttempts.get(identifier) || { count: 0, lockUntil: 0 };

  // Kilitlendiyse kontrol et
  if (attempts.lockUntil > now) {
    const remainingTime = Math.ceil((attempts.lockUntil - now) / 1000 / 60);
    return { allowed: false, remainingTime };
  }

  // Kilitleme süresi geçtiyse sıfırla
  if (attempts.lockUntil > 0 && attempts.lockUntil <= now) {
    loginAttempts.delete(identifier);
    return { allowed: true };
  }

  // Deneme sayısını kontrol et
  if (attempts.count >= MAX_ATTEMPTS) {
    attempts.lockUntil = now + LOCKOUT_TIME;
    loginAttempts.set(identifier, attempts);
    return { allowed: false, remainingTime: 15 };
  }

  return { allowed: true };
}

// Başarısız giriş denemesini kaydet
function recordFailedAttempt(identifier) {
  const attempts = loginAttempts.get(identifier) || { count: 0, lockUntil: 0 };
  attempts.count += 1;
  loginAttempts.set(identifier, attempts);
}

// Başarılı girişte sıfırla
function resetAttempts(identifier) {
  loginAttempts.delete(identifier);
}

export async function POST(request) {
  try {
    await connectDB();
    
    const body = await request.json();
    
    // Input validation
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Geçersiz istek' },
        { status: 400 }
      );
    }

    const username = sanitizeInput(body.username);
    const password = body.password;

    // Validasyon
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Kullanıcı adı ve şifre gerekli' },
        { status: 400 }
      );
    }

    // Username uzunluk kontrolü
    if (username.length < 3 || username.length > 30) {
      return NextResponse.json(
        { error: 'Geçersiz kullanıcı adı formatı' },
        { status: 400 }
      );
    }

    // Şifre uzunluk kontrolü
    if (password.length < 6 || password.length > 100) {
      return NextResponse.json(
        { error: 'Geçersiz şifre formatı' },
        { status: 400 }
      );
    }

    // Rate limiting kontrolü
    const clientIp = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const identifier = `${clientIp}_${username}`;
    
    const rateLimitCheck = checkRateLimit(identifier);
    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        { 
          error: `Çok fazla başarısız deneme. ${rateLimitCheck.remainingTime} dakika sonra tekrar deneyin.` 
        },
        { status: 429 }
      );
    }

    // Kullanıcıyı bul
    const user = await User.findOne({ username }).select('+password');

    // Generic hata mesajı (username enumeration önlemek için)
    if (!user) {
      recordFailedAttempt(identifier);
      return NextResponse.json(
        { error: 'Kullanıcı adı veya şifre hatalı' },
        { status: 401 }
      );
    }

    // Şifreyi kontrol et
    const isValidPassword = await user.comparePassword(password);

    if (!isValidPassword) {
      recordFailedAttempt(identifier);
      return NextResponse.json(
        { error: 'Kullanıcı adı veya şifre hatalı' },
        { status: 401 }
      );
    }

    // Başarılı giriş - rate limit sıfırla
    resetAttempts(identifier);

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

    // Cookie'ye token'ı ekle - secure flags
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict', // CSRF koruması için strict
      maxAge: 60 * 60 * 24 * 7, // 7 gün
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Giriş işlemi başarısız oldu' },
      { status: 500 }
    );
  }
}
