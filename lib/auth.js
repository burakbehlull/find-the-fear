import jwt from 'jsonwebtoken';
import User from '@/models/User';
import connectDB from '@/lib/mongodb';

// JWT Secret kontrolü - production'da mutlaka güçlü secret kullanılmalı
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET || JWT_SECRET === 'your-secret-key') {
  console.error('⚠️ UYARI: JWT_SECRET ayarlanmamış veya varsayılan değer kullanılıyor!');
  console.error('⚠️ Production ortamında güçlü bir JWT_SECRET kullanın!');
}

export function generateToken(userId) {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET tanımlanmamış');
  }
  
  return jwt.sign(
    { userId },
    JWT_SECRET,
    { 
      expiresIn: '7d',
      issuer: 'find-the-fear',
      audience: 'find-the-fear-users'
    }
  );
}

export function verifyToken(token) {
  try {
    if (!JWT_SECRET) {
      throw new Error('JWT_SECRET tanımlanmamış');
    }
    
    return jwt.verify(token, JWT_SECRET, {
      issuer: 'find-the-fear',
      audience: 'find-the-fear-users'
    });
  } catch (error) {
    console.error('Token verification failed:', error.message);
    return null;
  }
}

export function getUserFromRequest(request) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) return null;
    
    const decoded = verifyToken(token);
    return decoded ? decoded.userId : null;
  } catch (error) {
    return null;
  }
}


export async function verifyAuth(request) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return null;
    }
    
    const decoded = verifyToken(token);
    if (!decoded) {
      return null;
    }

    await connectDB();
    const user = await User.findById(decoded.userId).select('_id username email roles');
    
    if (!user) {
      return null;
    }

    const roles = user.roles || ['user'];
    const isAdmin = roles.includes('admin') || roles.includes('owner');
    const isOwner = roles.includes('owner');
    
    return {
      userId: user._id.toString(),
      username: user.username,
      email: user.email,
      roles,
      isAdmin,  // boolean
      isOwner,  // boolean
    };
  } catch (error) {
    console.error('Auth verification error:', error);
    return null;
  }
}

// Token yenileme fonksiyonu
export function refreshToken(oldToken) {
  try {
    const decoded = verifyToken(oldToken);
    if (!decoded) return null;
    
    // Token'ın süresinin dolmasına 1 günden az kalmışsa yenile
    const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);
    if (expiresIn < 86400) { // 24 saat
      return generateToken(decoded.userId);
    }
    
    return oldToken; // Henüz yenilemeye gerek yok
  } catch (error) {
    return null;
  }
}
