'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { User, Mail, Lock, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { format, differenceInDays } from 'date-fns';

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  
  // Form states
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Kullanıcı adı değiştirme hakkı
  const [canChangeUsername, setCanChangeUsername] = useState(true);
  const [daysUntilUsernameChange, setDaysUntilUsernameChange] = useState(0);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (!res.ok) {
        router.push('/');
        return;
      }
      
      const data = await res.json();
      setUser(data.user);
      setUsername(data.user.username);
      setEmail(data.user.email);
      
      // Kullanıcı adı değiştirme kontrolü
      if (data.user.lastUsernameChange) {
        const daysSinceChange = differenceInDays(new Date(), new Date(data.user.lastUsernameChange));
        if (daysSinceChange < 7) {
          setCanChangeUsername(false);
          setDaysUntilUsernameChange(7 - daysSinceChange);
        }
      }
    } catch (error) {
      console.error('Kullanıcı verisi yükleme hatası:', error);
      toast.error('Bir hata oluştu');
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  const handleUsernameUpdate = async (e) => {
    e.preventDefault();
    
    if (!canChangeUsername) {
      toast.error(`Kullanıcı adını değiştirmek için ${daysUntilUsernameChange} gün beklemelisiniz`);
      return;
    }
    
    if (username === user.username) {
      toast.error('Yeni kullanıcı adı mevcut kullanıcı adıyla aynı');
      return;
    }
    
    if (username.length < 3) {
      toast.error('Kullanıcı adı en az 3 karakter olmalı');
      return;
    }

    setUpdating(true);
    try {
      const res = await fetch('/api/user/update-username', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });

      const data = await res.json();
      
      if (data.success) {
        toast.success('Kullanıcı adı güncellendi! 7 gün sonra tekrar değiştirebilirsiniz.');
        fetchUserData();
      } else {
        toast.error(data.message || 'Kullanıcı adı güncellenemedi');
      }
    } catch (error) {
      console.error('Kullanıcı adı güncelleme hatası:', error);
      toast.error('Bir hata oluştu');
    } finally {
      setUpdating(false);
    }
  };

  const handleEmailUpdate = async (e) => {
    e.preventDefault();
    
    if (email === user.email) {
      toast.error('Yeni email mevcut email ile aynı');
      return;
    }
    
    if (!email.includes('@')) {
      toast.error('Geçerli bir email adresi girin');
      return;
    }

    setUpdating(true);
    try {
      const res = await fetch('/api/user/update-email', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      
      if (data.success) {
        toast.success('Email güncellendi');
        fetchUserData();
      } else {
        toast.error(data.message || 'Email güncellenemedi');
      }
    } catch (error) {
      console.error('Email güncelleme hatası:', error);
      toast.error('Bir hata oluştu');
    } finally {
      setUpdating(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    
    if (!currentPassword) {
      toast.error('Mevcut şifrenizi girin');
      return;
    }
    
    if (!newPassword || newPassword.length < 6) {
      toast.error('Yeni şifre en az 6 karakter olmalı');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast.error('Yeni şifreler eşleşmiyor');
      return;
    }

    setUpdating(true);
    try {
      const res = await fetch('/api/user/update-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      
      if (data.success) {
        toast.success('Şifre güncellendi');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        toast.error(data.message || 'Şifre güncellenemedi');
      }
    } catch (error) {
      console.error('Şifre güncelleme hatası:', error);
      toast.error('Bir hata oluştu');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center pt-20">
        <Loader2 className="h-12 w-12 animate-spin text-red-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white pt-20 pb-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-4xl font-bold mb-2">Hesap Ayarları</h1>
        <p className="text-gray-400 mb-8">Hesap bilgilerinizi yönetin</p>

        <div className="space-y-6">
          {/* Kullanıcı Adı Değiştirme */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <User className="h-5 w-5" />
                Kullanıcı Adı
              </CardTitle>
              <CardDescription className="text-gray-400">
                {canChangeUsername ? (
                  'Kullanıcı adınızı 7 günde bir değiştirebilirsiniz'
                ) : (
                  <span className="flex items-center gap-2 text-yellow-400">
                    <AlertCircle className="h-4 w-4" />
                    {daysUntilUsernameChange} gün sonra tekrar değiştirebilirsiniz
                    {user.lastUsernameChange && (
                      <span className="text-gray-500 ml-2">
                        (Son: {format(new Date(user.lastUsernameChange), 'dd/MM/yyyy')})
                      </span>
                    )}
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUsernameUpdate} className="space-y-4">
                <div>
                  <label className="text-sm text-gray-300 mb-2 block">Yeni Kullanıcı Adı</label>
                  <Input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={!canChangeUsername || updating}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="kullaniciadi"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={!canChangeUsername || updating || username === user.username}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {updating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Kullanıcı Adını Güncelle
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Email Değiştirme */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Adresi
              </CardTitle>
              <CardDescription className="text-gray-400">
                Email adresinizi güncelleyin
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleEmailUpdate} className="space-y-4">
                <div>
                  <label className="text-sm text-gray-300 mb-2 block">Yeni Email</label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={updating}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="email@example.com"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={updating || email === user.email}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {updating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Email'i Güncelle
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Şifre Değiştirme */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Şifre
              </CardTitle>
              <CardDescription className="text-gray-400">
                Şifrenizi değiştirin
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordUpdate} className="space-y-4">
                <div>
                  <label className="text-sm text-gray-300 mb-2 block">Mevcut Şifre</label>
                  <Input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    disabled={updating}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-300 mb-2 block">Yeni Şifre</label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={updating}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-300 mb-2 block">Yeni Şifre (Tekrar)</label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={updating}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="••••••••"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={updating}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {updating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Şifreyi Güncelle
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Hesap Bilgileri */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Hesap Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {user.createdAt && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Kayıt Tarihi:</span>
                  <span className="text-white">
                    {format(new Date(user.createdAt), 'dd/MM/yyyy')}
                  </span>
                </div>
              )}
              {user.lastUsernameChange && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Son Kullanıcı Adı Değişikliği:</span>
                  <span className="text-white">
                    {format(new Date(user.lastUsernameChange), 'dd/MM/yyyy')}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-400">Rol:</span>
                <span className="text-white capitalize">{user.role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">İzlenen Film Sayısı:</span>
                <span className="text-white">{user.watchedMovies?.length || 0}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
