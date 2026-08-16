import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Babadook - Film Öneri Platformu',
  description: 'AI destekli film öneri platformu',
};

async function getUser() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;
    
    if (!token) return null;
    
    const decoded = verifyToken(token);
    if (!decoded) return null;

    await dbConnect();
    const user = await User.findById(decoded.userId).select('-password');
    
    return user ? {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
    } : null;
  } catch (error) {
    return null;
  }
}

export default async function RootLayout({ children }) {
  const user = await getUser();

  return (
    <html lang="tr">
      <body className={inter.className}>
        <Navbar user={user} />
        <main>{children}</main>
      </body>
    </html>
  );
}
