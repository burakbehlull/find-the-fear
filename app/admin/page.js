'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Film, Users, AlertCircle, CheckCircle, XCircle, ExternalLink, Plus, Trash2 } from 'lucide-react';
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

const GENRES = [
  { value: 'komedi', label: 'Komedi Korku' },
  { value: 'psikolojik', label: 'Psikolojik Korku' },
  { value: 'vahşet', label: 'Vahşet' },
  { value: 'gerilim', label: 'Gerilim' },
  { value: 'gizem', label: 'Gizem' },
  { value: 'doğaüstü', label: 'Doğaüstü' },
  { value: 'belgesel', label: 'Belgesel' },
];

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [adminNote, setAdminNote] = useState('');
  const [showAddMovie, setShowAddMovie] = useState(false);
  const [showMovieList, setShowMovieList] = useState(false);
  const [addingMovie, setAddingMovie] = useState(false);
  const [deletingMovieId, setDeletingMovieId] = useState(null);
  
  // Film ekleme formu
  const [movieForm, setMovieForm] = useState({
    title: '',
    year: '',
    series: '',
    genres: [],
    description: '',
    director: '',
    poster: '',
    imdbId: '',
    imdbRating: '',
    imdbLink: '',
    duration: '',
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (!res.ok) {
        router.push('/');
        return;
      }

      const data = await res.json();
      if (data.user.role !== 'admin') {
        toast.error('Bu sayfaya erişim yetkiniz yok');
        router.push('/dashboard');
        return;
      }

      setUser(data.user);
      fetchData();
    } catch (error) {
      console.error('Auth hatası:', error);
      router.push('/');
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);

      // İstatistikleri al
      const statsRes = await fetch('/api/dashboard/stats');
      const statsData = await statsRes.json();
      if (statsData.success && statsData.adminStats) {
        setStats(statsData.adminStats);
      }

      // Bekleyen önerileri al
      const suggestionsRes = await fetch('/api/suggestions?status=pending');
      const suggestionsData = await suggestionsRes.json();
      if (suggestionsData.success) {
        setSuggestions(suggestionsData.suggestions);
      }

      // Tüm filmleri al
      const moviesRes = await fetch('/api/library/movies');
      const moviesData = await moviesRes.json();
      if (moviesData.success) {
        setMovies(moviesData.movies);
      }
    } catch (error) {
      console.error('Veri yükleme hatası:', error);
      toast.error('Veriler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (suggestionId, action) => {
    try {
      setProcessingId(suggestionId);

      const res = await fetch('/api/suggestions/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          suggestionId,
          action,
          adminNote,
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(data.message);
        setAdminNote('');
        fetchData();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error('İnceleme hatası:', error);
      toast.error('İşlem başarısız');
    } finally {
      setProcessingId(null);
    }
  };

  const handleGenreToggle = (genre) => {
    setMovieForm((prev) => ({
      ...prev,
      genres: prev.genres.includes(genre)
        ? prev.genres.filter((g) => g !== genre)
        : [...prev.genres, genre],
    }));
  };

  const handleAddMovie = async (e) => {
    e.preventDefault();

    if (!movieForm.title || !movieForm.year || movieForm.genres.length === 0 || !movieForm.description) {
      toast.error('Lütfen gerekli alanları doldurun');
      return;
    }

    try {
      setAddingMovie(true);
      const res = await fetch('/api/library/movies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...movieForm,
          year: parseInt(movieForm.year),
          imdbRating: movieForm.imdbRating ? parseFloat(movieForm.imdbRating) : null,
          duration: movieForm.duration ? parseInt(movieForm.duration) : null,
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success('Film başarıyla eklendi!');
        setShowAddMovie(false);
        setMovieForm({
          title: '',
          year: '',
          series: '',
          genres: [],
          description: '',
          director: '',
          poster: '',
          imdbId: '',
          imdbRating: '',
          imdbLink: '',
          duration: '',
        });
        fetchData();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error('Film ekleme hatası:', error);
      toast.error('Film eklenirken hata oluştu');
    } finally {
      setAddingMovie(false);
    }
  };

  const handleDeleteMovie = async (movieId, movieTitle) => {
    if (!confirm(`"${movieTitle}" filmini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz!`)) {
      return;
    }

    try {
      setDeletingMovieId(movieId);
      
      const res = await fetch(`/api/library/movies/${movieId}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (data.success) {
        toast.success('Film silindi!');
        setMovies(movies.filter(m => m._id !== movieId));
        fetchData(); // İstatistikleri güncelle
      } else {
        toast.error(data.message || 'Film silinemedi');
      }
    } catch (error) {
      console.error('Film silme hatası:', error);
      toast.error('Film silinirken hata oluştu');
    } finally {
      setDeletingMovieId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-red-950 pt-28">
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
          <h1 className="text-4xl font-bold text-white mb-2">🛠️ Admin Paneli</h1>
          <p className="text-gray-400">Sistem yönetimi ve film onaylama</p>
        </div>

        {/* İstatistikler */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-200">Toplam Film</CardTitle>
                <Film className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{stats.totalLibraryMovies}</div>
                <p className="text-xs text-gray-400 mt-1">Kütüphanedeki film sayısı</p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-200">Kullanıcılar</CardTitle>
                <Users className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{stats.totalUsers}</div>
                <p className="text-xs text-gray-400 mt-1">Kayıtlı kullanıcı</p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-200">
                  Bekleyen Öneriler
                </CardTitle>
                <AlertCircle className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{stats.pendingSuggestions}</div>
                <p className="text-xs text-gray-400 mt-1">Onay bekliyor</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Film Ekle ve Listele Butonları */}
        <div className="mb-6 flex gap-3">
          <Button
            onClick={() => setShowAddMovie(!showAddMovie)}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            {showAddMovie ? 'Formu Kapat' : 'Yeni Film Ekle'}
          </Button>
          
          <Button
            onClick={() => setShowMovieList(!showMovieList)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Film className="h-4 w-4 mr-2" />
            {showMovieList ? 'Listeyi Gizle' : `Tüm Filmler (${movies.length})`}
          </Button>
        </div>

        {/* Film Ekleme Formu */}
        {showAddMovie && (
          <Card className="bg-gray-800/50 border-gray-700 mb-6">
            <CardHeader>
              <CardTitle className="text-white">Kütüphaneye Film Ekle</CardTitle>
              <CardDescription className="text-gray-400">
                Yeni bir film direkt olarak kütüphaneye ekleyin
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddMovie} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Film Adı *
                    </label>
                    <Input
                      type="text"
                      value={movieForm.title}
                      onChange={(e) => setMovieForm({ ...movieForm, title: e.target.value })}
                      className="bg-gray-700 border-gray-600 text-white"
                      placeholder="The Ring"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Yıl *</label>
                    <Input
                      type="number"
                      value={movieForm.year}
                      onChange={(e) => setMovieForm({ ...movieForm, year: e.target.value })}
                      className="bg-gray-700 border-gray-600 text-white"
                      placeholder="2002"
                      min="1900"
                      max="2030"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Seri (Opsiyonel)
                  </label>
                  <Input
                    type="text"
                    value={movieForm.series}
                    onChange={(e) => setMovieForm({ ...movieForm, series: e.target.value })}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="Paranormal Activity Serisi"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Örnek: "Paranormal Activity Serisi", "Saw Serisi", "The Conjuring Universe"
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Türler * (En az 1 seçin)
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {GENRES.map((genre) => (
                      <div key={genre.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`admin-${genre.value}`}
                          checked={movieForm.genres.includes(genre.value)}
                          onCheckedChange={() => handleGenreToggle(genre.value)}
                          className="border-gray-600"
                        />
                        <label
                          htmlFor={`admin-${genre.value}`}
                          className="text-sm text-gray-300 cursor-pointer"
                        >
                          {genre.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Açıklama *
                  </label>
                  <Textarea
                    value={movieForm.description}
                    onChange={(e) => setMovieForm({ ...movieForm, description: e.target.value })}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="Film hakkında açıklama..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Yönetmen
                    </label>
                    <Input
                      type="text"
                      value={movieForm.director}
                      onChange={(e) => setMovieForm({ ...movieForm, director: e.target.value })}
                      className="bg-gray-700 border-gray-600 text-white"
                      placeholder="Gore Verbinski"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Süre (dakika)
                    </label>
                    <Input
                      type="number"
                      value={movieForm.duration}
                      onChange={(e) => setMovieForm({ ...movieForm, duration: e.target.value })}
                      className="bg-gray-700 border-gray-600 text-white"
                      placeholder="115"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Poster URL
                  </label>
                  <Input
                    type="url"
                    value={movieForm.poster}
                    onChange={(e) => setMovieForm({ ...movieForm, poster: e.target.value })}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="https://example.com/poster.jpg"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      IMDB ID
                    </label>
                    <Input
                      type="text"
                      value={movieForm.imdbId}
                      onChange={(e) => setMovieForm({ ...movieForm, imdbId: e.target.value })}
                      className="bg-gray-700 border-gray-600 text-white"
                      placeholder="tt0298130"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      IMDB Puanı
                    </label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="10"
                      value={movieForm.imdbRating}
                      onChange={(e) => setMovieForm({ ...movieForm, imdbRating: e.target.value })}
                      className="bg-gray-700 border-gray-600 text-white"
                      placeholder="7.1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      IMDB Linki
                    </label>
                    <Input
                      type="url"
                      value={movieForm.imdbLink}
                      onChange={(e) => setMovieForm({ ...movieForm, imdbLink: e.target.value })}
                      className="bg-gray-700 border-gray-600 text-white"
                      placeholder="https://www.imdb.com/title/..."
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    type="submit"
                    disabled={addingMovie}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {addingMovie ? 'Ekleniyor...' : 'Filmi Ekle'}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setShowAddMovie(false)}
                    variant="outline"
                    className="bg-gray-700 border-gray-600 hover:bg-gray-600"
                  >
                    İptal
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Film Listesi */}
        {showMovieList && (
          <Card className="bg-gray-800/50 border-gray-700 mb-6">
            <CardHeader>
              <CardTitle className="text-white">Tüm Filmler</CardTitle>
              <CardDescription className="text-gray-400">
                Kütüphanedeki tüm filmler - Düzenle veya Sil
              </CardDescription>
            </CardHeader>
            <CardContent>
              {movies.length === 0 ? (
                <p className="text-gray-400 text-center py-8">Henüz film eklenmemiş</p>
              ) : (
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {movies.map((movie) => (
                    <div
                      key={movie._id}
                      className="bg-gray-700/50 rounded-lg p-4 flex items-start gap-4 hover:bg-gray-700 transition-colors"
                    >
                      {/* Poster */}
                      <div className="w-20 h-28 bg-gray-600 rounded overflow-hidden flex-shrink-0">
                        {movie.poster ? (
                          <img
                            src={movie.poster}
                            alt={movie.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-500">
                            <Film className="h-8 w-8" />
                          </div>
                        )}
                      </div>

                      {/* Film Bilgileri */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-bold text-white truncate">
                              {movie.title} ({movie.year})
                            </h3>
                            {movie.series && (
                              <p className="text-sm text-purple-400">📺 {movie.series}</p>
                            )}
                            <p className="text-sm text-gray-400 mt-1">
                              Türler: {movie.genres.map(g => GENRE_NAMES[g]).join(', ')}
                            </p>
                            {movie.director && (
                              <p className="text-sm text-gray-400">Yönetmen: {movie.director}</p>
                            )}
                            <div className="flex items-center gap-4 mt-2 text-sm">
                              {movie.averageRating && (
                                <span className="text-yellow-500">
                                  ⭐ {movie.averageRating.toFixed(1)} ({movie.totalRatings} puan)
                                </span>
                              )}
                              <span className="text-gray-400">
                                👥 {movie.watchedByCount} izleme
                              </span>
                            </div>
                          </div>

                          {/* Aksiyonlar */}
                          <div className="flex gap-2">
                            <Link href={`/library/${movie.slug}`} target="_blank">
                              <Button
                                size="sm"
                                variant="outline"
                                className="bg-gray-600 border-gray-500 hover:bg-gray-500"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button
                              size="sm"
                              onClick={() => handleDeleteMovie(movie._id, movie.title)}
                              disabled={deletingMovieId === movie._id}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              {deletingMovieId === movie._id ? (
                                <span className="animate-spin">⏳</span>
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                        
                        <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                          {movie.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Film Önerileri */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Film Önerileri</CardTitle>
            <CardDescription className="text-gray-400">
              Kullanıcılar tarafından önerilen filmler
            </CardDescription>
          </CardHeader>
          <CardContent>
            {suggestions.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">Bekleyen öneri yok</p>
              </div>
            ) : (
              <div className="space-y-6">
                {suggestions.map((suggestion) => (
                  <div
                    key={suggestion._id}
                    className="bg-gray-700/50 rounded-lg p-6 border border-gray-600"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-2xl font-bold text-white mb-1">
                          {suggestion.title}
                        </h3>
                        <p className="text-gray-400">
                          {suggestion.year} •{' '}
                          {suggestion.genres.map((g) => GENRE_NAMES[g]).join(', ')}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          Öneren: {suggestion.suggestedBy.username} •{' '}
                          {format(new Date(suggestion.createdAt), 'dd/MM/yyyy HH:mm')}
                        </p>
                      </div>
                      {suggestion.imdbLink && (
                        <a
                          href={suggestion.imdbLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-yellow-500 hover:text-yellow-400"
                        >
                          <ExternalLink className="h-5 w-5" />
                        </a>
                      )}
                    </div>

                    {suggestion.poster && (
                      <div className="mb-4">
                        <img
                          src={suggestion.poster}
                          alt={suggestion.title}
                          className="max-w-xs rounded"
                        />
                      </div>
                    )}

                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-300 mb-1">Açıklama:</h4>
                      <p className="text-gray-300">{suggestion.description}</p>
                    </div>

                    {suggestion.director && (
                      <p className="text-gray-400 mb-4">
                        <span className="font-semibold">Yönetmen:</span> {suggestion.director}
                      </p>
                    )}

                    <div className="border-t border-gray-600 pt-4">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Admin Notu (Opsiyonel)
                      </label>
                      <Textarea
                        value={adminNote}
                        onChange={(e) => setAdminNote(e.target.value)}
                        className="bg-gray-600 border-gray-500 text-white mb-3"
                        rows={2}
                        placeholder="Kullanıcıya not bırakın..."
                      />

                      <div className="flex gap-3">
                        <Button
                          onClick={() => handleReview(suggestion._id, 'approve')}
                          disabled={processingId === suggestion._id}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          {processingId === suggestion._id ? 'İşleniyor...' : 'Onayla'}
                        </Button>
                        <Button
                          onClick={() => handleReview(suggestion._id, 'reject')}
                          disabled={processingId === suggestion._id}
                          className="flex-1 bg-red-600 hover:bg-red-700"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reddet
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
