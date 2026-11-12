import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { generateToken } from '@/lib/auth';

// Input sanitization
function sanitizeInput(input) {
  if (typeof input !== 'string') return '';
  return input.trim().replace(/[<>]/g, '');
}

// Email validation
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Username validation
function isValidUsername(username) {
  // Sadece harf, rakam, alt çizgi ve tire
  const usernameRegex = /^[a-zA-Z0-9_-]+$/;
  return usernameRegex.test(username);
}

// Password strength kontrolü
function validatePasswordStrength(password) {
  const errors = [];
  
  if (password.length < 8) {
    errors.push('Şifre en az 8 karakter olmalı');
  }
  if (password.length > 100) {
    errors.push('Şifre çok uzun');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Şifre en az bir küçük harf içermeli');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Şifre en az bir büyük harf içermeli');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Şifre en az bir rakam içermeli');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Rate limiting için
const registerAttempts = new Map();
const MAX_REGISTER_ATTEMPTS = 3;
const REGISTER_LOCKOUT_TIME = 60 * 60 * 1000; // 1 saat

function checkRegisterRateLimit(clientIp) {
  const now = Date.now();
  const attempts = registerAttempts.get(clientIp) || { count: 0, lockUntil: 0 };

  if (attempts.lockUntil > now) {
    const remainingTime = Math.ceil((attempts.lockUntil - now) / 1000 / 60);
    return { allowed: false, remainingTime };
  }

  if (attempts.lockUntil > 0 && attempts.lockUntil <= now) {
    registerAttempts.delete(clientIp);
    return { allowed: true };
  }

  if (attempts.count >= MAX_REGISTER_ATTEMPTS) {
    attempts.lockUntil = now + REGISTER_LOCKOUT_TIME;
    registerAttempts.set(clientIp, attempts);
    return { allowed: false, remainingTime: 60 };
  }

  return { allowed: true };
}

function recordRegisterAttempt(clientIp) {
  const attempts = registerAttempts.get(clientIp) || { count: 0, lockUntil: 0 };
  attempts.count += 1;
  registerAttempts.set(clientIp, attempts);
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
    const email = sanitizeInput(body.email?.toLowerCase());
    const password = body.password;

    // Rate limiting
    const clientIp = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    
    const rateLimitCheck = checkRegisterRateLimit(clientIp);
    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        { 
          error: `Çok fazla kayıt denemesi. ${rateLimitCheck.remainingTime} dakika sonra tekrar deneyin.` 
        },
        { status: 429 }
      );
    }

    // Validasyon
    if (!username || !email || !password) {
      recordRegisterAttempt(clientIp);
      return NextResponse.json(
        { error: 'Tüm alanlar gerekli' },
        { status: 400 }
      );
    }

    // Username validasyonu
    if (username.length < 3 || username.length > 30) {
      recordRegisterAttempt(clientIp);
      return NextResponse.json(
        { error: 'Kullanıcı adı 3-30 karakter arasında olmalı' },
        { status: 400 }
      );
    }

    if (!isValidUsername(username)) {
      recordRegisterAttempt(clientIp);
      return NextResponse.json(
        { error: 'Kullanıcı adı sadece harf, rakam, alt çizgi ve tire içerebilir' },
        { status: 400 }
      );
    }

    // Email validasyonu
    if (!isValidEmail(email)) {
      recordRegisterAttempt(clientIp);
      return NextResponse.json(
        { error: 'Geçerli bir e-posta adresi girin' },
        { status: 400 }
      );
    }

    // Email uzunluk kontrolü
    if (email.length > 100) {
      recordRegisterAttempt(clientIp);
      return NextResponse.json(
        { error: 'E-posta adresi çok uzun' },
        { status: 400 }
      );
    }

    // Password strength kontrolü
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      recordRegisterAttempt(clientIp);
      return NextResponse.json(
        { 
          error: 'Şifre gereksinimleri karşılanmıyor',
          details: passwordValidation.errors 
        },
        { status: 400 }
      );
    }

    // Kullanıcı var mı kontrol et
    const existingUser = await User.findOne({ 
      $or: [{ username }, { email }] 
    });

    if (existingUser) {
      recordRegisterAttempt(clientIp);
      
      // Generic hata mesajı (enumeration önlemek için)
      return NextResponse.json(
        { error: 'Bu kullanıcı adı veya e-posta zaten kullanımda' },
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

    // Cookie'ye token'ı ekle - secure flags
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict', // CSRF koruması
      maxAge: 60 * 60 * 24 * 7, // 7 gün
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Register error:', error);
    
    // MongoDB duplicate key hatası
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Bu kullanıcı adı veya e-posta zaten kullanımda' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Kayıt işlemi başarısız oldu' },
      { status: 500 }
    );
  }
}
