'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';

export default function AuthDialog({ open, onOpenChange, mode = 'login' }) {
  const [isLogin, setIsLogin] = useState(mode === 'login');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Mode prop değiştiğinde isLogin state'ini güncelle
  useEffect(() => {
    setIsLogin(mode === 'login');
  }, [mode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Bir hata oluştu');
      }

      // Başarılı - sayfayı yenile
      onOpenChange(false);
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setFormData({ username: '', email: '', password: '' });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)} className="bg-black border-white/10">
        <DialogHeader>
          <DialogTitle className="text-2xl font-light text-white">
            {isLogin ? 'Sign In' : 'Create Account'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          <div>
            <label htmlFor="username" className="block text-sm font-light mb-2 text-gray-400">
              Username
            </label>
            <Input
              id="username"
              name="username"
              type="text"
              required
              value={formData.username}
              onChange={handleChange}
              placeholder="username"
              className="bg-white/5 border-white/10 text-white font-light"
            />
          </div>

          {!isLogin && (
            <div>
              <label htmlFor="email" className="block text-sm font-light mb-2 text-gray-400">
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="email@example.com"
                className="bg-white/5 border-white/10 text-white font-light"
              />
            </div>
          )}

          <div>
            <label htmlFor="password" className="block text-sm font-light mb-2 text-gray-400">
              Password
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="bg-white/5 border-white/10 text-white font-light"
            />
          </div>

          {error && (
            <div className="glass border-red-500/50 text-red-400 p-3 rounded-lg text-sm font-light">
              {error}
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full bg-white text-black hover:bg-gray-200 font-light rounded-full" 
            disabled={loading}
          >
            {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
          </Button>

          <div className="text-center text-sm font-light">
            {isLogin ? (
              <p className="text-gray-400">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={toggleMode}
                  className="text-white hover:underline"
                >
                  Sign up
                </button>
              </p>
            ) : (
              <p className="text-gray-400">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={toggleMode}
                  className="text-white hover:underline"
                >
                  Sign in
                </button>
              </p>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
