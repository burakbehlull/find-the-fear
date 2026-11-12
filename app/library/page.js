'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, Filter, Plus, Star, Users, Film, Tv } from 'lucide-react';
import toast from 'react-hot-toast';

const GENRES = [
  { value: 'komedi', label: 'Komedi Korku' },
  { value: 'psikolojik', label: 'Psikolojik Korku' },
  { value: 'vahşet', label: 'Vahşet' },
  { value: 'gerilim', label: 'Gerilim' },
  { value: 'gizem', label: 'Gizem' },
  { value: 'doğaüstü', label: 'Doğaüstü' },
  { value: 'belgesel', label: 'Belgesel' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'En Yeni' },
  { value: 'oldest', label: 'En Eski' },
  { value: 'title', label: 'Alfabetik' },
  { value: 'rating', label: 'En Yüksek Puan' },
  { value: 'popular', label: 'En Popüler' },
];

export default function LibraryPage() {
  const router = useRouter();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [contentType, setContentType] = useState('all'); // 'all', 'film', 'series'
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        }
      } catch (error) {
        console.error('Auth check error:', error);
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    fetchMovies();
  }, [searchTerm, selectedGenres, sortBy, contentType]);

  const fetchMovies = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        search: searchTerm,
        genres: selectedGenres.join(','),
        sortBy,
      });

      // İçerik tipi filtresi ekle
      if (contentType !== 'all') {
        params.append('type', contentType);
      }

      const res = await fetch(`/api/library/movies?${params}`);
      const data = await res.json();

      if (data.success) {
        setMovies(data.movies);
      }
    } catch (error) {
      console.error('İçerik yükleme hatası:', error);
      toast.error('İçerikler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleGenreToggle = (genre) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  const handleAddToList = async (movieId) => {
    if (!user) {
      toast.error('Giriş yapmalısınız');
      router.push('/');
      return;
    }

    try {
      const res = await fetch('/api/user/movies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ movieId }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success('Film listenize eklendi!');
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error('Film ekleme hatası:', error);
      toast.error('Film eklenirken hata oluştu');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-red-950 pt-28 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            {contentType === 'film' ? '🎬 Film Kütüphanesi' : contentType === 'series' ? '📺 Dizi Kütüphanesi' : '🎬 Korku Kütüphanesi'}
          </h1>
          <p className="text-gray-400">
            {contentType === 'film' ? 'Tüm korku filmleri' : contentType === 'series' ? 'Tüm korku dizileri' : 'Tüm korku filmleri ve dizileri'}
          </p>
        </div>

        {/* Arama ve Filtreler */}
        <div className="mb-6 space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="text"
                placeholder="Film ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-800 border-gray-700 text-white"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="bg-gray-800 border-gray-700 hover:bg-gray-700"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtrele
            </Button>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Filtre Paneli */}
          {showFilters && (
            <Card className="bg-gray-800/50 border-gray-700 p-4">
              <div className="space-y-4">
                {/* İçerik Tipi Filtresi */}
                <div>
                  <h3 className="text-white font-semibold mb-3">İçerik Tipi</h3>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => setContentType('all')}
                      className={contentType === 'all' ? 'bg-red-600' : 'bg-gray-700 hover:bg-gray-600'}
                    >
                      Tümü
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setContentType('film')}
                      className={contentType === 'film' ? 'bg-red-600' : 'bg-gray-700 hover:bg-gray-600'}
                    >
                      <Film className="h-3 w-3 mr-1" />
                      Filmler
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setContentType('series')}
                      className={contentType === 'series' ? 'bg-red-600' : 'bg-gray-700 hover:bg-gray-600'}
                    >
                      <Tv className="h-3 w-3 mr-1" />
                      Diziler
                    </Button>
                  </div>
                </div>

                {/* Türler */}
                <div>
                  <h3 className="text-white font-semibold mb-3">Türler</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {GENRES.map((genre) => (
                      <div key={genre.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={genre.value}
                          checked={selectedGenres.includes(genre.value)}
                          onCheckedChange={() => handleGenreToggle(genre.value)}
                          className="border-gray-600"
                        />
                        <label
                          htmlFor={genre.value}
                          className="text-sm text-gray-300 cursor-pointer"
                        >
                          {genre.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Film/Dizi Öneri Butonları */}
        {user && (
          <div className="mb-6 flex gap-3">
            <Link href="/library/suggest">
              <Button className="bg-purple-600 hover:bg-purple-700">
                <Plus className="h-4 w-4 mr-2" />
                Film Öner
              </Button>
            </Link>
            <Link href="/library/suggest?type=series">
              <Button className="bg-teal-600 hover:bg-teal-700">
                <Tv className="h-4 w-4 mr-2" />
                Dizi Öner
              </Button>
            </Link>
          </div>
        )}

        {/* İçerik Listesi */}
        {loading ? (
          <div className="text-center py-12 pt-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
            <p className="mt-4 text-gray-400">
              {contentType === 'film' ? 'Filmler' : contentType === 'series' ? 'Diziler' : 'İçerikler'} yükleniyor...
            </p>
          </div>
        ) : movies.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">
              {contentType === 'film' ? 'Film' : contentType === 'series' ? 'Dizi' : 'İçerik'} bulunamadı
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {movies.map((movie) => (
              <Card
                key={movie._id}
                className="bg-gray-800/50 border-gray-700 hover:scale-105 transition-transform"
              >
                <Link href={`/library/${movie.slug}`}>
                  <div className="aspect-[2/3] bg-gray-700 rounded-t-lg overflow-hidden">
                    {movie.poster ? (
                      <img
                        src={movie.poster}
                        alt={movie.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500">
                        <Film className="h-16 w-16" />
                      </div>
                    )}
                  </div>
                </Link>
                <CardContent className="p-4">
                  <Link href={`/library/${movie.slug}`}>
                    <h3 className="font-bold text-white text-lg mb-1 hover:text-red-400 line-clamp-1">
                      {movie.title}
                    </h3>
                  </Link>
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-sm text-gray-400">{movie.year}</p>
                    {movie.type === 'series' && (
                      <span className="px-2 py-0.5 bg-blue-900/30 text-blue-300 rounded text-xs flex items-center gap-1">
                        <Tv className="h-3 w-3" />
                        Dizi
                      </span>
                    )}
                  </div>

                  {/* Dizi ise sezon/bölüm bilgisi */}
                  {movie.type === 'series' && movie.totalSeasons > 0 && (
                    <p className="text-xs text-gray-500 mb-2">
                      {movie.totalSeasons} Sezon • {movie.totalEpisodes} Bölüm
                      {movie.seriesStatus === 'ongoing' && ' • Devam Ediyor'}
                    </p>
                  )}
                  
                  {/* Türler */}
                  {movie.genres && movie.genres.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {movie.genres.slice(0, 2).map((genre, index) => (
                        <span
                          key={index}
                          className="px-2 py-0.5 bg-red-900/30 text-red-300 rounded text-xs"
                        >
                          {GENRES.find(g => g.value === genre)?.label || genre}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 mb-3">
                    {movie.averageRating && (
                      <div className="flex items-center gap-1 text-yellow-500">
                        <Star className="h-4 w-4 fill-current" />
                        <span className="text-sm font-bold">
                          {movie.averageRating.toFixed(1)}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-1 text-gray-400">
                      <Users className="h-4 w-4" />
                      <span className="text-xs">{movie.watchedByCount}</span>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleAddToList(movie._id)}
                    className="w-full bg-red-600 hover:bg-red-700"
                    size="sm"
                  >
                    Listime Ekle
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
