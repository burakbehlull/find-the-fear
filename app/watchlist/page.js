'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Film, Clock, CheckCircle, Trash2, Calendar, Users, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const GENRE_NAMES = {
  komedi: 'Komedi Korku',
  psikolojik: 'Psikolojik Korku',
  vahşet: 'Vahşet',
  gerilim: 'Gerilim',
  gizem: 'Gizem',
  doğaüstü: 'Doğaüstü',
  belgesel: 'Belgesel',
};

export default function WatchlistPage() {
  const router = useRouter();
  const [savedMovies, setSavedMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markingWatched, setMarkingWatched] = useState(null);
  const [showMarkDialog, setShowMarkDialog] = useState(null);
  
  // İzlendi formu
  const [watchedForm, setWatchedForm] = useState({
    watchedAt: '',
    watchedWith: '',
    note: '',
    rating: '',
  });

  useEffect(() => {
    fetchSavedMovies();
  }, []);

  const fetchSavedMovies = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/user/saved-movies');
      
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/');
          return;
        }
        throw new Error('Filmler yüklenemedi');
      }

      const data = await res.json();
      setSavedMovies(data.savedMovies || []);
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Filmler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (movieId) => {
    if (!confirm('Bu filmi izleneceklerden çıkarmak istediğinizden emin misiniz?')) return;

    try {
      const res = await fetch(`/api/user/saved-movies?movieId=${movieId}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      
      if (data.success) {
        toast.success('Film izleneceklerden çıkarıldı');
        setSavedMovies(savedMovies.filter(m => m.movieId._id !== movieId));
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error('Remove error:', error);
      toast.error('Bir hata oluştu');
    }
  };

  const handleMarkWatched = async (movieId) => {
    try {
      setMarkingWatched(movieId);

      const res = await fetch('/api/user/mark-watched', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          movieId,
          watchedAt: watchedForm.watchedAt || new Date().toISOString(),
          watchedWith: watchedForm.watchedWith ? watchedForm.watchedWith.split(',').map(w => w.trim()) : [],
          note: watchedForm.note,
          rating: watchedForm.rating ? parseFloat(watchedForm.rating) : null,
        }),
      });

      const data = await res.json();
      
      if (data.success) {
        toast.success('Film izlediklerinize eklendi!');
        setSavedMovies(savedMovies.filter(m => m.movieId._id !== movieId));
        setShowMarkDialog(null);
        setWatchedForm({ watchedAt: '', watchedWith: '', note: '', rating: '' });
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error('Mark watched error:', error);
      toast.error('Bir hata oluştu');
    } finally {
      setMarkingWatched(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-28 bg-gradient-to-br from-gray-900 via-black to-red-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-400">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-red-950 pt-28 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <Clock className="h-10 w-10 text-yellow-500" />
            İzlenecekler
          </h1>
          <p className="text-gray-400">Sonra izlemek için kaydettiğin filmler ({savedMovies.length})</p>
        </div>

        {savedMovies.length === 0 ? (
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-12 text-center">
              <Clock className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 mb-2">İzlenecek film bulunamadı</p>
              <p className="text-sm text-gray-500 mb-6">
                Kütüphaneden filmler ekleyerek izlenecekler listeni oluştur
              </p>
              <Link href="/library">
                <Button className="bg-red-600 hover:bg-red-700">
                  <Film className="h-4 w-4 mr-2" />
                  Kütüphaneye Git
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedMovies.map((saved) => {
              const movie = saved.movieId;
              if (!movie) return null;

              return (
                <Card key={saved._id} className="bg-gray-800/50 border-gray-700 hover:border-red-500/50 transition-all">
                  <CardContent className="p-4">
                    {/* Poster */}
                    <Link href={`/library/${movie.slug}`}>
                      <div className="w-full aspect-[2/3] bg-gray-700 rounded-lg overflow-hidden mb-4 cursor-pointer hover:opacity-80 transition-opacity">
                        {movie.poster ? (
                          <img
                            src={movie.poster}
                            alt={movie.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Film className="h-16 w-16 text-gray-600" />
                          </div>
                        )}
                      </div>
                    </Link>

                    {/* Film Bilgileri */}
                    <Link href={`/library/${movie.slug}`}>
                      <h3 className="text-lg font-bold text-white mb-1 hover:text-red-400 cursor-pointer">
                        {movie.title}
                      </h3>
                    </Link>
                    <p className="text-sm text-gray-400 mb-2">
                      {movie.year} • {movie.genres?.map(g => GENRE_NAMES[g]).join(', ')}
                    </p>
                    {movie.averageRating && (
                      <p className="text-sm text-yellow-500 mb-3">
                        ⭐ {movie.averageRating.toFixed(1)}
                      </p>
                    )}

                    {/* İzlendi Dialog */}
                    {showMarkDialog === movie._id ? (
                      <div className="space-y-3 mb-3 p-3 bg-gray-700/50 rounded-lg">
                        <div>
                          <label className="text-xs text-gray-400 block mb-1">
                            <Calendar className="h-3 w-3 inline mr-1" />
                            Ne zaman izledin?
                          </label>
                          <Input
                            type="datetime-local"
                            value={watchedForm.watchedAt}
                            onChange={(e) => setWatchedForm({ ...watchedForm, watchedAt: e.target.value })}
                            className="bg-gray-600 border-gray-500 text-white text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 block mb-1">
                            <Users className="h-3 w-3 inline mr-1" />
                            Kiminle izledin? (virgülle ayır)
                          </label>
                          <Input
                            placeholder="@ahmet, Ayşe, @mehmet"
                            value={watchedForm.watchedWith}
                            onChange={(e) => setWatchedForm({ ...watchedForm, watchedWith: e.target.value })}
                            className="bg-gray-600 border-gray-500 text-white text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 block mb-1">
                            <Star className="h-3 w-3 inline mr-1" />
                            Puan (0-10)
                          </label>
                          <Input
                            type="number"
                            min="0"
                            max="10"
                            step="0.5"
                            placeholder="8.5"
                            value={watchedForm.rating}
                            onChange={(e) => setWatchedForm({ ...watchedForm, rating: e.target.value })}
                            className="bg-gray-600 border-gray-500 text-white text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 block mb-1">Not</label>
                          <Textarea
                            placeholder="Notlarını yaz..."
                            value={watchedForm.note}
                            onChange={(e) => setWatchedForm({ ...watchedForm, note: e.target.value })}
                            className="bg-gray-600 border-gray-500 text-white text-sm"
                            rows={2}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleMarkWatched(movie._id)}
                            disabled={markingWatched === movie._id}
                            className="flex-1 bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Kaydet
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setShowMarkDialog(null)}
                            className="bg-gray-700 border-gray-600"
                          >
                            İptal
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => setShowMarkDialog(movie._id)}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          İzledim
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRemove(movie._id)}
                          className="bg-gray-700 border-gray-600 hover:bg-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
