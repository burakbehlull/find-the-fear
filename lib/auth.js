import jwt from 'jsonwebtoken';
import User from '@/models/User';
import connectDB from '@/lib/mongodb';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
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
