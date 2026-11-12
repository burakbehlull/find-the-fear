'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Film, Star, TrendingUp, Library, User, Settings, Sparkles, Bookmark, Tv } from 'lucide-react';
import toast from 'react-hot-toast';

const GENRE_NAMES = {
  komedi: 'Komedi Korku',
  psikolojik: 'Psikolojik Korku',
  vahşet: 'Vahşet',
  gerilim: 'Gerilim',
  gizem: 'Gizem',
  doğaüstü: 'Doğaüstü',
  belgesel: 'Belgesel',
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Kullanıcı bilgisini al
        const userRes = await fetch('/api/auth/me');
        if (!userRes.ok) {
          router.push('/');
          return;
        }
        const userData = await userRes.json();
        setUser(userData.user);

        // İstatistikleri al
        const statsRes = await fetch('/api/dashboard/stats');
        const statsData = await statsRes.json();
        if (statsData.success) {
          setStats(statsData.stats);
        }
      } catch (error) {
        console.error('Veri yükleme hatası:', error);
        toast.error('Veriler yüklenirken hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-28">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-400">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-red-950 pt-28 px-4 sm:px-6 pb-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            Hoş Geldin, {user?.username}! 👻
          </h1>
          <p className="text-sm sm:text-base text-gray-400">Korku dünyasına hoş geldin. Ne izleyeceksin bugün?</p>
        </div>

        {/* İstatistik Kartları */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-200">Toplam İçerik</CardTitle>
              <Film className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats?.totalMovies || 0}</div>
              <p className="text-xs text-gray-400 mt-1">
                {stats?.totalFilms || 0} film • {stats?.totalSeries || 0} dizi
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-200">Bölümler</CardTitle>
              <Tv className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats?.totalEpisodesWatched || 0}</div>
              <p className="text-xs text-gray-400 mt-1">İzlenen dizi bölümü</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-200">Puanlanan</CardTitle>
              <Star className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats?.ratedMovies || 0}</div>
              <p className="text-xs text-gray-400 mt-1">
                Ortalama: {stats?.averageRating || '-'}/10
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-200">Favori Tür</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-white">
                {stats?.favoriteGenre ? GENRE_NAMES[stats.favoriteGenre] : '-'}
              </div>
              <p className="text-xs text-gray-400 mt-1">En çok izlediğin</p>
            </CardContent>
          </Card>
        </div>

        {/* Hızlı Aksiyonlar */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-red-900/50 to-red-950/50 border-red-800 hover:scale-105 transition-transform cursor-pointer">
            <Link href="/library">
              <CardHeader>
                <Library className="h-8 w-8 text-red-400 mb-2" />
                <CardTitle className="text-white">Film Kütüphanesi</CardTitle>
                <CardDescription className="text-gray-300">
                  Binlerce korku filmi arasından seç
                </CardDescription>
              </CardHeader>
            </Link>
          </Card>

          <Card className="bg-gradient-to-br from-purple-900/50 to-purple-950/50 border-purple-800 hover:scale-105 transition-transform cursor-pointer">
            <Link href="/recommendations">
              <CardHeader>
                <Sparkles className="h-8 w-8 text-purple-400 mb-2" />
                <CardTitle className="text-white">AI Önerileri</CardTitle>
                <CardDescription className="text-gray-300">
                  Yapay zeka ile kişisel film önerileri al
                </CardDescription>
              </CardHeader>
            </Link>
          </Card>

          <Card className="bg-gradient-to-br from-green-900/50 to-green-950/50 border-green-800 hover:scale-105 transition-transform cursor-pointer">
            <Link href="/watchlist">
              <CardHeader>
                <Bookmark className="h-8 w-8 text-green-400 mb-2" />
                <CardTitle className="text-white">İzleyeceklerim</CardTitle>
                <CardDescription className="text-gray-300">
                  Kaydettiğin filmleri gör ve izledim olarak işaretle
                </CardDescription>
              </CardHeader>
            </Link>
          </Card>

          <Card className="bg-gradient-to-br from-blue-900/50 to-blue-950/50 border-blue-800 hover:scale-105 transition-transform cursor-pointer">
            <Link href="/settings">
              <CardHeader>
                <Settings className="h-8 w-8 text-blue-400 mb-2" />
                <CardTitle className="text-white">Ayarlar</CardTitle>
                <CardDescription className="text-gray-300">
                  Hesap ve gizlilik ayarlarını düzenle
                </CardDescription>
              </CardHeader>
            </Link>
          </Card>
        </div>

        {/* Son Eklenen Filmler */}
        {stats?.recentMovies && stats.recentMovies.length > 0 && (
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Son İzlediklerin</CardTitle>
              <CardDescription className="text-gray-400">Son eklediğin filmler</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.recentMovies.map((movie, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex-1">
                      <Link href={`/library/${movie.movieId?.slug}`}>
                        <h3 className="font-semibold text-white hover:text-red-400">
                          {movie.movieId?.title || 'Bilinmeyen Film'}
                        </h3>
                      </Link>
                      <p className="text-sm text-gray-400">
                        {movie.movieId?.year} • {movie.movieId?.genres?.map(g => GENRE_NAMES[g]).join(', ')}
                      </p>
                    </div>
                    {movie.rating && (
                      <div className="flex items-center gap-1 text-yellow-500">
                        <Star className="h-4 w-4 fill-current" />
                        <span className="font-bold">{movie.rating}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <Link href={`/profile/${user?.username}`}>
                <Button className="w-full mt-4 bg-red-600 hover:bg-red-700">
                  Tüm Filmlerimi Gör
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
