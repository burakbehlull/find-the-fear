'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import AuthDialog from '@/components/AuthDialog';
import { Film, User, LogOut } from 'lucide-react';

export default function Navbar({ user }) {
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');

  const openAuth = (mode) => {
    setAuthMode(mode);
    setAuthOpen(true);
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.reload();
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/50 backdrop-blur-xl">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 text-xl font-light tracking-wider hover:opacity-80 transition-opacity">
            <Film className="h-5 w-5" />
            <span className="uppercase">Babadook</span>
          </Link>

          <div className="flex items-center gap-1">
            {user ? (
              <>
                <Link href="/recommendations">
                  <Button variant="ghost" className="text-sm font-light">Film Önerileri</Button>
                </Link>
                <Link href="/userpanel">
                  <Button variant="ghost" className="text-sm font-light">
                    <User className="h-4 w-4 mr-2" />
                    Panel
                  </Button>
                </Link>
                <Button variant="ghost" onClick={handleLogout} className="text-sm font-light">
                  <LogOut className="h-4 w-4 mr-2" />
                  Çıkış
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={() => openAuth('login')} className="text-sm font-light">
                  Sign in
                </Button>
                <Button 
                  onClick={() => openAuth('register')}
                  className="ml-2 bg-white text-black hover:bg-gray-200 text-sm font-light rounded-full px-6"
                >
                  Register
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      <AuthDialog 
        open={authOpen} 
        onOpenChange={setAuthOpen} 
        mode={authMode}
      />
    </>
  );
}
