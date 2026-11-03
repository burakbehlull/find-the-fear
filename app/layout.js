import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import { Toaster } from 'react-hot-toast';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Find The Fear - Korku Filmi Kütüphanesi',
  description: 'AI destekli korku filmi öneri ve kütüphane platformu',
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
      userId: user._id.toString(),
      username: user.username,
      email: user.email,
      role: user.role,
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
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#1f2937',
              color: '#fff',
              border: '1px solid #374151',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
        <Navbar user={user} />
        <main>{children}</main>
      </body>
    </html>
  );
}
