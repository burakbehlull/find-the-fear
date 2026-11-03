'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import AuthDialog from '@/components/AuthDialog';
import { Film, LayoutDashboard, Library, User, LogOut, Shield, Menu, X, Bookmark } from 'lucide-react';

export default function Navbar({ user }) {
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const openAuth = (mode) => {
    setAuthMode(mode);
    setAuthOpen(true);
    setMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.reload();
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/50 backdrop-blur-xl">
        <div className="container mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <Link 
            href={user ? "/dashboard" : "/"} 
            className="flex items-center gap-2 sm:gap-3 text-lg sm:text-xl font-light tracking-wider hover:opacity-80 transition-opacity"
            onClick={closeMobileMenu}
          >
            <Film className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="uppercase text-sm sm:text-base">Find The Fear</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-1">
            {user ? (
              <>
                <Link href="/dashboard">
                  <Button variant="ghost" className="text-sm font-light">
                    <LayoutDashboard className="h-4 w-4 mr-2" />
                    Dashboard
                  </Button>
                </Link>
                <Link href="/library">
                  <Button variant="ghost" className="text-sm font-light">
                    <Library className="h-4 w-4 mr-2" />
                    Kütüphane
                  </Button>
                </Link>
                <Link href="/watchlist">
                  <Button variant="ghost" className="text-sm font-light">
                    <Bookmark className="h-4 w-4 mr-2" />
                    İzleyeceklerim
                  </Button>
                </Link>
                <Link href={`/profile/${user.username}`}>
                  <Button variant="ghost" className="text-sm font-light">
                    <User className="h-4 w-4 mr-2" />
                    Profil
                  </Button>
                </Link>
                {user.isAdmin && (
                  <Link href="/admin">
                    <Button variant="ghost" className="text-sm font-light text-yellow-500 hover:text-yellow-400">
                      <Shield className="h-4 w-4 mr-2" />
                      Admin
                    </Button>
                  </Link>
                )}
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

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/10 bg-black/95 backdrop-blur-xl">
            <div className="container mx-auto px-4 py-4 space-y-2">
              {user ? (
                <>
                  <Link href="/dashboard" onClick={closeMobileMenu}>
                    <Button variant="ghost" className="w-full justify-start text-sm font-light">
                      <LayoutDashboard className="h-4 w-4 mr-2" />
                      Dashboard
                    </Button>
                  </Link>
                  <Link href="/library" onClick={closeMobileMenu}>
                    <Button variant="ghost" className="w-full justify-start text-sm font-light">
                      <Library className="h-4 w-4 mr-2" />
                      Kütüphane
                    </Button>
                  </Link>
                  <Link href="/watchlist" onClick={closeMobileMenu}>
                    <Button variant="ghost" className="w-full justify-start text-sm font-light">
                      <Bookmark className="h-4 w-4 mr-2" />
                      İzleyeceklerim
                    </Button>
                  </Link>
                  <Link href={`/profile/${user.username}`} onClick={closeMobileMenu}>
                    <Button variant="ghost" className="w-full justify-start text-sm font-light">
                      <User className="h-4 w-4 mr-2" />
                      Profil
                    </Button>
                  </Link>
                  {user.isAdmin && (
                    <Link href="/admin" onClick={closeMobileMenu}>
                      <Button variant="ghost" className="w-full justify-start text-sm font-light text-yellow-500">
                        <Shield className="h-4 w-4 mr-2" />
                        Admin
                      </Button>
                    </Link>
                  )}
                  <Button 
                    variant="ghost" 
                    onClick={() => { handleLogout(); closeMobileMenu(); }} 
                    className="w-full justify-start text-sm font-light"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Çıkış
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    variant="ghost" 
                    onClick={() => openAuth('login')} 
                    className="w-full justify-start text-sm font-light"
                  >
                    Sign in
                  </Button>
                  <Button 
                    onClick={() => openAuth('register')}
                    className="w-full bg-white text-black hover:bg-gray-200 text-sm font-light"
                  >
                    Register
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      <AuthDialog 
        open={authOpen} 
        onOpenChange={setAuthOpen} 
        mode={authMode}
      />
    </>
  );
}
