'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Film, Users, AlertCircle, CheckCircle, XCircle, ExternalLink, Plus, Trash2, Upload, Tv, Edit2 } from 'lucide-react';
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
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [adminNote, setAdminNote] = useState('');
  const [showAddMovie, setShowAddMovie] = useState(false);
  const [showMovieList, setShowMovieList] = useState(false);
  const [showUserList, setShowUserList] = useState(false);
  const [addingMovie, setAddingMovie] = useState(false);
  const [deletingMovieId, setDeletingMovieId] = useState(null);
  const [updatingRoleId, setUpdatingRoleId] = useState(null);
  const [editingMovie, setEditingMovie] = useState(null);
  const [updatingMovie, setUpdatingMovie] = useState(false);
  
  // Öneri onaylarken dizi sezonları için
  const [suggestionSeasons, setSuggestionSeasons] = useState({});
  const [seriesStatusForSuggestion, setSeriesStatusForSuggestion] = useState({});
  
  // Admin film ekleme/düzenleme - bölüm detayları göster/gizle
  const [expandedEpisodes, setExpandedEpisodes] = useState([]);
  
  // Film/Dizi ekleme formu
  const [contentType, setContentType] = useState('film'); // 'film' veya 'series'
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
    // Dizi için
    seriesStatus: 'completed',
    seasons: [],
  });

  // JSON bulk import
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState(null);

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
      console.log('User data:', data.user); // Debug
      
      // Admin veya owner kontrolü
      if (!data.user || !data.user.isAdmin) {
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

      // Kullanıcıları al
      const usersRes = await fetch('/api/admin/users');
      const usersData = await usersRes.json();
      if (usersData.success) {
        setUsers(usersData.users);
      }
    } catch (error) {
      console.error('Veri yükleme hatası:', error);
      toast.error('Veriler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (suggestionId, action, suggestion) => {
    try {
      setProcessingId(suggestionId);

      // Dizi ise ve onaylanıyorsa sezon bilgilerini kontrol et
      if (action === 'approve' && suggestion.type === 'series') {
        const seasons = suggestionSeasons[suggestionId] || [];
        if (seasons.length === 0) {
          toast.error('Dizi için en az 1 sezon bilgisi ekleyin!');
          setProcessingId(null);
          return;
        }
        const invalidSeason = seasons.find(s => !s.episodeCount || s.episodeCount < 1);
        if (invalidSeason) {
          toast.error(`Sezon ${invalidSeason.seasonNumber} için bölüm sayısı girilmeli!`);
          setProcessingId(null);
          return;
        }
      }

      const res = await fetch('/api/suggestions/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          suggestionId,
          action,
          adminNote,
          // Dizi ise sezon bilgilerini ekle
          ...(action === 'approve' && suggestion.type === 'series' && {
            seasons: suggestionSeasons[suggestionId] || [],
            seriesStatus: seriesStatusForSuggestion[suggestionId] || 'completed',
          }),
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(data.message);
        setAdminNote('');
        // Sezon bilgilerini temizle
        setSuggestionSeasons(prev => {
          const newState = { ...prev };
          delete newState[suggestionId];
          return newState;
        });
        setSeriesStatusForSuggestion(prev => {
          const newState = { ...prev };
          delete newState[suggestionId];
          return newState;
        });
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

    // Temel validasyon
    if (!movieForm.title || !movieForm.year || movieForm.genres.length === 0 || !movieForm.description) {
      toast.error('Lütfen gerekli alanları doldurun');
      return;
    }

    // Dizi için sezon kontrolü
    if (contentType === 'series') {
      if (!movieForm.seasons || movieForm.seasons.length === 0) {
        toast.error('En az 1 sezon ekleyin!');
        return;
      }
      const invalidSeason = movieForm.seasons.find(s => !s.episodeCount || s.episodeCount < 1);
      if (invalidSeason) {
        toast.error(`Sezon ${invalidSeason.seasonNumber} için bölüm sayısı girilmeli!`);
        return;
      }
    }

    try {
      setAddingMovie(true);
      const res = await fetch('/api/library/movies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...movieForm,
          type: contentType,
          year: parseInt(movieForm.year),
          imdbRating: movieForm.imdbRating ? parseFloat(movieForm.imdbRating) : null,
          duration: contentType === 'film' && movieForm.duration ? parseInt(movieForm.duration) : null,
          // Dizi için
          ...(contentType === 'series' && {
            seasons: movieForm.seasons,
            seriesStatus: movieForm.seriesStatus,
          }),
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(`${contentType === 'film' ? 'Film' : 'Dizi'} başarıyla eklendi!`);
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
          seriesStatus: 'completed',
          seasons: [],
        });
        setContentType('film');
        fetchData();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error('İçerik ekleme hatası:', error);
      toast.error(`${contentType === 'film' ? 'Film' : 'Dizi'} eklenirken hata oluştu`);
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

  const handleEditMovie = (movie) => {
    setEditingMovie(movie);
    setContentType(movie.type || 'film');
    setMovieForm({
      title: movie.title || '',
      year: movie.year?.toString() || '',
      series: movie.series || '',
      genres: movie.genres || [],
      description: movie.description || '',
      director: movie.director || '',
      poster: movie.poster || '',
      imdbId: movie.imdbId || '',
      imdbRating: movie.imdbRating?.toString() || '',
      imdbLink: movie.imdbLink || '',
      duration: movie.duration?.toString() || '',
      seriesStatus: movie.seriesStatus || 'completed',
      seasons: movie.seasons || [],
    });
    setShowAddMovie(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdateMovie = async (e) => {
    e.preventDefault();

    if (!editingMovie) return;

    // Temel validasyon
    if (!movieForm.title || !movieForm.year || movieForm.genres.length === 0 || !movieForm.description) {
      toast.error('Lütfen gerekli alanları doldurun');
      return;
    }

    // Dizi için sezon kontrolü
    if (contentType === 'series') {
      if (!movieForm.seasons || movieForm.seasons.length === 0) {
        toast.error('En az 1 sezon ekleyin!');
        return;
      }
      const invalidSeason = movieForm.seasons.find(s => !s.episodeCount || s.episodeCount < 1);
      if (invalidSeason) {
        toast.error(`Sezon ${invalidSeason.seasonNumber} için bölüm sayısı girilmeli!`);
        return;
      }
    }

    try {
      setUpdatingMovie(true);
      const res = await fetch(`/api/library/movies/${editingMovie._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...movieForm,
          type: contentType,
          year: parseInt(movieForm.year),
          imdbRating: movieForm.imdbRating ? parseFloat(movieForm.imdbRating) : null,
          duration: contentType === 'film' && movieForm.duration ? parseInt(movieForm.duration) : null,
          // Dizi için
          ...(contentType === 'series' && {
            seasons: movieForm.seasons,
            seriesStatus: movieForm.seriesStatus,
          }),
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(`${contentType === 'film' ? 'Film' : 'Dizi'} başarıyla güncellendi!`);
        setShowAddMovie(false);
        setEditingMovie(null);
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
          seriesStatus: 'completed',
          seasons: [],
        });
        setContentType('film');
        fetchData();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error('İçerik güncelleme hatası:', error);
      toast.error(`${contentType === 'film' ? 'Film' : 'Dizi'} güncellenirken hata oluştu`);
    } finally {
      setUpdatingMovie(false);
    }
  };

  const handleUpdateUserRole = async (userId, action) => {
    const actionText = action === 'make-admin' ? 'admin yapmak' : 'admin yetkisini kaldırmak';
    if (!confirm(`Bu kullanıcıyı ${actionText} istediğinizden emin misiniz?`)) {
      return;
    }

    try {
      setUpdatingRoleId(userId);
      
      const res = await fetch('/api/admin/users/update-role', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(data.message);
        fetchData(); // Kullanıcı listesini yenile
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error('Rol güncelleme hatası:', error);
      toast.error('İşlem başarısız');
    } finally {
      setUpdatingRoleId(null);
    }
  };

  const handleBulkImport = async () => {
    try {
      setImporting(true);
      setImportResults(null);

      // JSON'u parse et
      let movies;
      try {
        movies = JSON.parse(jsonInput);
      } catch (error) {
        toast.error('Geçersiz JSON formatı! JSON syntax kontrolü yapın.');
        return;
      }

      // Array kontrolü
      if (!Array.isArray(movies)) {
        toast.error('JSON bir dizi (array) olmalı! Örnek: [{ ... }, { ... }]');
        return;
      }

      if (movies.length === 0) {
        toast.error('En az 1 film ekleyin!');
        return;
      }

      // API'ye gönder
      const res = await fetch('/api/admin/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ movies }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(`${data.results.successful} film başarıyla eklendi!`);
        setImportResults(data.results);
        setJsonInput('');
        fetchData(); // Film listesini yenile
      } else {
        toast.error(data.message || 'Import işlemi başarısız');
      }
    } catch (error) {
      console.error('Bulk import hatası:', error);
      toast.error('Film import işlemi başarısız');
    } finally {
      setImporting(false);
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

        {/* Film/Dizi Ekle ve Listele Butonları */}
        <div className="mb-6 flex flex-wrap gap-3">
          <Button
            onClick={() => {
              setShowAddMovie(!showAddMovie);
              setContentType('film');
            }}
            className="bg-green-600 hover:bg-green-700"
          >
            <Film className="h-4 w-4 mr-2" />
            {showAddMovie && contentType === 'film' ? 'Formu Kapat' : 'Yeni Film Ekle'}
          </Button>

          <Button
            onClick={() => {
              setShowAddMovie(!showAddMovie);
              setContentType('series');
            }}
            className="bg-teal-600 hover:bg-teal-700"
          >
            <Tv className="h-4 w-4 mr-2" />
            {showAddMovie && contentType === 'series' ? 'Formu Kapat' : 'Yeni Dizi Ekle'}
          </Button>
          
          <Button
            onClick={() => setShowBulkImport(!showBulkImport)}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Upload className="h-4 w-4 mr-2" />
            {showBulkImport ? 'JSON Import Kapat' : 'Çoklu Ekle (JSON)'}
          </Button>
          
          <Button
            onClick={() => setShowMovieList(!showMovieList)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Film className="h-4 w-4 mr-2" />
            {showMovieList ? 'Listeyi Gizle' : `Tüm İçerikler (${movies.length})`}
          </Button>

          {user?.isOwner && (
            <Button
              onClick={() => setShowUserList(!showUserList)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Users className="h-4 w-4 mr-2" />
              {showUserList ? 'Listeyi Gizle' : `Kullanıcılar (${users.length})`}
            </Button>
          )}
        </div>

        {/* Film/Dizi Ekleme Formu */}
        {showAddMovie && (
          <Card className="bg-gray-800/50 border-gray-700 mb-6">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                {editingMovie ? (
                  <>
                    {contentType === 'film' ? (
                      <><Film className="h-5 w-5" /> Film Düzenle</>
                    ) : (
                      <><Tv className="h-5 w-5" /> Dizi Düzenle</>
                    )}
                  </>
                ) : (
                  <>
                    {contentType === 'film' ? (
                      <><Film className="h-5 w-5" /> Kütüphaneye Film Ekle</>
                    ) : (
                      <><Tv className="h-5 w-5" /> Kütüphaneye Dizi Ekle</>
                    )}
                  </>
                )}
              </CardTitle>
              <CardDescription className="text-gray-400">
                {editingMovie
                  ? `"${editingMovie.title}" ${contentType === 'film' ? 'filmini' : 'dizisini'} düzenleyin`
                  : `Yeni bir ${contentType === 'film' ? 'film' : 'dizi'} direkt olarak kütüphaneye ekleyin`
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={editingMovie ? handleUpdateMovie : handleAddMovie} className="space-y-4">
                
                {/* İçerik Tipi Göstergesi */}
                <div className="flex items-center gap-2 p-3 bg-gray-700/50 rounded-lg">
                  <span className="text-sm text-gray-400">İçerik Tipi:</span>
                  <span className="font-semibold text-white">
                    {contentType === 'film' ? '🎬 Film' : '📺 Dizi'}
                  </span>
                </div>

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
                      Süre (dakika) {contentType === 'film' && '*'}
                    </label>
                    <Input
                      type="number"
                      value={movieForm.duration}
                      onChange={(e) => setMovieForm({ ...movieForm, duration: e.target.value })}
                      className="bg-gray-700 border-gray-600 text-white"
                      placeholder="115"
                      disabled={contentType === 'series'}
                    />
                    {contentType === 'series' && (
                      <p className="text-xs text-gray-500 mt-1">Diziler için süre bölüm bazında girilir</p>
                    )}
                  </div>
                </div>

                {/* DİZİ İÇİN ÖZEL ALANLAR */}
                {contentType === 'series' && (
                  <div className="border-t border-gray-600 pt-6 space-y-4">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <Tv className="h-5 w-5" />
                      Dizi Bilgileri
                    </h3>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Dizi Durumu *
                      </label>
                      <select
                        value={movieForm.seriesStatus}
                        onChange={(e) => setMovieForm({ ...movieForm, seriesStatus: e.target.value })}
                        className="w-full bg-gray-700 border-gray-600 text-white rounded-md px-3 py-2"
                      >
                        <option value="completed">Tamamlandı</option>
                        <option value="ongoing">Devam Ediyor</option>
                        <option value="cancelled">İptal Edildi</option>
                      </select>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="block text-sm font-medium text-gray-300">
                          Sezonlar * (En az 1 sezon ekleyin)
                        </label>
                        <Button
                          type="button"
                          onClick={() => {
                            const newSeason = {
                              seasonNumber: (movieForm.seasons?.length || 0) + 1,
                              episodeCount: 0,
                              releaseYear: movieForm.year || new Date().getFullYear(),
                              description: ''
                            };
                            setMovieForm({
                              ...movieForm,
                              seasons: [...(movieForm.seasons || []), newSeason]
                            });
                          }}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Sezon Ekle
                        </Button>
                      </div>

                      {movieForm.seasons && movieForm.seasons.length > 0 ? (
                        <div className="space-y-3">
                          {movieForm.seasons.map((season, index) => (
                            <div key={index} className="bg-gray-700/50 rounded-lg p-4 space-y-3">
                              <div className="flex items-center justify-between">
                                <h4 className="font-semibold text-white">Sezon {season.seasonNumber}</h4>
                                <Button
                                  type="button"
                                  onClick={() => {
                                    const newSeasons = movieForm.seasons.filter((_, i) => i !== index);
                                    setMovieForm({ ...movieForm, seasons: newSeasons });
                                  }}
                                  size="sm"
                                  variant="outline"
                                  className="bg-red-600/20 border-red-600 text-red-400 hover:bg-red-600/40"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                  <label className="text-xs text-gray-400">Bölüm Sayısı *</label>
                                  <Input
                                    type="number"
                                    min="1"
                                    value={season.episodeCount}
                                    onChange={(e) => {
                                      const newSeasons = [...movieForm.seasons];
                                      const count = parseInt(e.target.value) || 0;
                                      newSeasons[index].episodeCount = count;
                                      
                                      // Bölüm sayısı değiştiğinde episodes array'ini oluştur/güncelle
                                      if (count > 0) {
                                        const currentEpisodes = newSeasons[index].episodes || [];
                                        const episodes = [];
                                        for (let i = 1; i <= count; i++) {
                                          // Mevcut bölüm varsa koru, yoksa yeni oluştur
                                          episodes.push(currentEpisodes[i - 1] || {
                                            episodeNumber: i,
                                            title: '',
                                            description: '',
                                            duration: null,
                                            airDate: null,
                                          });
                                        }
                                        newSeasons[index].episodes = episodes;
                                      } else {
                                        newSeasons[index].episodes = [];
                                      }
                                      
                                      setMovieForm({ ...movieForm, seasons: newSeasons });
                                    }}
                                    className="bg-gray-600 border-gray-500 text-white mt-1"
                                    placeholder="8"
                                  />
                                </div>

                                <div>
                                  <label className="text-xs text-gray-400">Yayın Yılı</label>
                                  <Input
                                    type="number"
                                    value={season.releaseYear}
                                    onChange={(e) => {
                                      const newSeasons = [...movieForm.seasons];
                                      newSeasons[index].releaseYear = parseInt(e.target.value);
                                      setMovieForm({ ...movieForm, seasons: newSeasons });
                                    }}
                                    className="bg-gray-600 border-gray-500 text-white mt-1"
                                    placeholder={new Date().getFullYear()}
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="text-xs text-gray-400">Sezon Açıklaması (Opsiyonel)</label>
                                <Textarea
                                  value={season.description}
                                  onChange={(e) => {
                                    const newSeasons = [...movieForm.seasons];
                                    newSeasons[index].description = e.target.value;
                                    setMovieForm({ ...movieForm, seasons: newSeasons });
                                  }}
                                  className="bg-gray-600 border-gray-500 text-white mt-1"
                                  placeholder="Bu sezonda ne oldu..."
                                  rows={2}
                                />
                              </div>

                              {/* Bölüm Detayları */}
                              {season.episodes && season.episodes.length > 0 && (
                                <div className="border-t border-gray-600 pt-3">
                                  <Button
                                    type="button"
                                    size="sm"
                                    onClick={() => {
                                      const key = `${index}`;
                                      setExpandedEpisodes(
                                        expandedEpisodes.includes(key)
                                          ? expandedEpisodes.filter(k => k !== key)
                                          : [...expandedEpisodes, key]
                                      );
                                    }}
                                    className="w-full bg-gray-600 hover:bg-gray-500 text-xs mb-2"
                                  >
                                    {expandedEpisodes.includes(`${index}`)
                                      ? '▼ Bölüm Detaylarını Gizle'
                                      : `▶ Bölüm Detaylarını Göster (${season.episodes.length} bölüm)`}
                                  </Button>

                                  {expandedEpisodes.includes(`${index}`) && (
                                    <div className="space-y-2 max-h-96 overflow-y-auto">
                                      {season.episodes.map((episode, epIndex) => (
                                        <div key={epIndex} className="bg-gray-800 rounded p-3 space-y-2">
                                          <div className="font-semibold text-white text-sm">
                                            Bölüm {episode.episodeNumber}
                                          </div>
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                            <div>
                                              <label className="text-xs text-gray-400">Bölüm Adı (Opsiyonel)</label>
                                              <Input
                                                type="text"
                                                value={episode.title || ''}
                                                onChange={(e) => {
                                                  const newSeasons = [...movieForm.seasons];
                                                  newSeasons[index].episodes[epIndex].title = e.target.value;
                                                  setMovieForm({ ...movieForm, seasons: newSeasons });
                                                }}
                                                className="bg-gray-700 border-gray-600 text-white text-xs h-8 mt-1"
                                                placeholder="Pilot"
                                              />
                                            </div>
                                            <div>
                                              <label className="text-xs text-gray-400">Süre (dk)</label>
                                              <Input
                                                type="number"
                                                value={episode.duration || ''}
                                                onChange={(e) => {
                                                  const newSeasons = [...movieForm.seasons];
                                                  newSeasons[index].episodes[epIndex].duration = parseInt(e.target.value) || null;
                                                  setMovieForm({ ...movieForm, seasons: newSeasons });
                                                }}
                                                className="bg-gray-700 border-gray-600 text-white text-xs h-8 mt-1"
                                                placeholder="45"
                                              />
                                            </div>
                                          </div>
                                          <div>
                                            <label className="text-xs text-gray-400">Açıklama (Opsiyonel)</label>
                                            <Textarea
                                              value={episode.description || ''}
                                              onChange={(e) => {
                                                const newSeasons = [...movieForm.seasons];
                                                newSeasons[index].episodes[epIndex].description = e.target.value;
                                                setMovieForm({ ...movieForm, seasons: newSeasons });
                                              }}
                                              className="bg-gray-700 border-gray-600 text-white text-xs mt-1"
                                              placeholder="Bu bölümde..."
                                              rows={2}
                                            />
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}

                          <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-3">
                            <p className="text-sm text-blue-300">
                              📊 Toplam: {movieForm.seasons.length} Sezon, {' '}
                              {movieForm.seasons.reduce((sum, s) => sum + (s.episodeCount || 0), 0)} Bölüm
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-gray-700/30 rounded-lg p-6 text-center">
                          <Tv className="h-8 w-8 text-gray-500 mx-auto mb-2" />
                          <p className="text-sm text-gray-400">Henüz sezon eklenmedi</p>
                          <p className="text-xs text-gray-500 mt-1">Yukarıdaki "Sezon Ekle" butonuna tıklayın</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

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
                    disabled={addingMovie || updatingMovie}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {editingMovie
                      ? updatingMovie ? 'Güncelleniyor...' : 'Güncelle'
                      : addingMovie ? 'Ekleniyor...' : 'Ekle'
                    }
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      setShowAddMovie(false);
                      setEditingMovie(null);
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
                        seriesStatus: 'completed',
                        seasons: [],
                      });
                    }}
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

        {/* JSON Bulk Import */}
        {showBulkImport && (
          <Card className="bg-gray-800/50 border-gray-700 mb-6">
            <CardHeader>
              <CardTitle className="text-white">Çoklu Film Ekleme (JSON)</CardTitle>
              <CardDescription className="text-gray-400">
                Aşağıdaki JSON formatında birden fazla film ekleyin
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* JSON Format Example */}
              <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                <h4 className="text-sm font-semibold text-gray-300 mb-2">📝 JSON Format Örneği (Film & Dizi):</h4>
                <pre className="text-xs text-gray-300 overflow-x-auto whitespace-pre-wrap">
{`[
  {
    "type": "film",
    "title": "The Ring",
    "year": 2002,
    "genres": ["psikolojik", "doğaüstü"],
    "description": "Film açıklaması...",
    "director": "Gore Verbinski",
    "poster": "https://example.com/poster.jpg",
    "duration": 115,
    "imdbRating": 7.1
  },
  {
    "type": "series",
    "title": "Stranger Things",
    "year": 2016,
    "genres": ["doğaüstü", "gerilim"],
    "description": "80'lerde geçen doğaüstü olaylar...",
    "seriesStatus": "ongoing",
    "seasons": [
      {
        "seasonNumber": 1,
        "episodeCount": 8,
        "releaseYear": 2016
      },
      {
        "seasonNumber": 2,
        "episodeCount": 9,
        "releaseYear": 2017
      }
    ]
  }
]`}
                </pre>
                <div className="mt-3 text-xs text-gray-400 space-y-1">
                  <p>• <strong className="text-white">Zorunlu (Hepsi):</strong> title, year, genres (array), description</p>
                  <p>• <strong className="text-white">type:</strong> "film" (varsayılan) veya "series"</p>
                  <p>• <strong className="text-white">Film için:</strong> duration (dakika)</p>
                  <p>• <strong className="text-white">Dizi için:</strong> seasons array (seasonNumber, episodeCount), seriesStatus</p>
                  <p>• <strong className="text-white">Türler:</strong> komedi, psikolojik, vahşet, gerilim, gizem, doğaüstü, belgesel</p>
                </div>
              </div>

              {/* JSON Input */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  JSON Verisi (Array formatında)
                </label>
                <Textarea
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white font-mono text-sm"
                  placeholder='[{"title": "Film Adı", "year": 2024, ...}]'
                  rows={12}
                />
              </div>

              {/* Import Results */}
              {importResults && (
                <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                  <h4 className="text-sm font-semibold text-white mb-3">📊 Import Sonuçları:</h4>
                  <div className="space-y-2 text-sm">
                    <p className="text-green-400">✅ Başarılı: {importResults.successful}</p>
                    <p className="text-red-400">❌ Başarısız: {importResults.failed}</p>
                    <p className="text-gray-300">📝 Toplam: {importResults.total}</p>
                    
                    {importResults.errors && importResults.errors.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-600">
                        <p className="text-red-400 font-semibold mb-2">Hatalar:</p>
                        <div className="space-y-1 max-h-40 overflow-y-auto">
                          {importResults.errors.map((error, idx) => (
                            <p key={idx} className="text-xs text-gray-400">
                              • {error}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  onClick={handleBulkImport}
                  disabled={importing || !jsonInput.trim()}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  {importing ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Import Ediliyor...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      İçerikleri Import Et
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setShowBulkImport(false);
                    setJsonInput('');
                    setImportResults(null);
                  }}
                  variant="outline"
                  className="bg-gray-700 border-gray-600 hover:bg-gray-600"
                >
                  İptal
                </Button>
              </div>
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
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-bold text-white truncate">
                                {movie.title} ({movie.year})
                              </h3>
                              {movie.type === 'series' ? (
                                <span className="px-2 py-0.5 bg-purple-600 text-purple-100 text-xs rounded-full">
                                  DIZI
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 bg-red-600 text-red-100 text-xs rounded-full">
                                  FİLM
                                </span>
                              )}
                            </div>
                            {movie.series && (
                              <p className="text-sm text-purple-400">📺 {movie.series}</p>
                            )}
                            {movie.type === 'series' && movie.totalSeasons && (
                              <p className="text-sm text-gray-400">
                                {movie.totalSeasons} Sezon • {movie.totalEpisodes || 0} Bölüm
                              </p>
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
                                title="Görüntüle"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button
                              size="sm"
                              onClick={() => handleEditMovie(movie)}
                              className="bg-blue-600 hover:bg-blue-700"
                              title="Düzenle"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleDeleteMovie(movie._id, movie.title)}
                              disabled={deletingMovieId === movie._id}
                              className="bg-red-600 hover:bg-red-700"
                              title="Sil"
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

        {/* Kullanıcı Listesi (Sadece Owner) */}
        {showUserList && user?.isOwner && (
          <Card className="bg-gray-800/50 border-gray-700 mb-6">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="h-5 w-5" />
                Kullanıcı Yönetimi
              </CardTitle>
              <CardDescription className="text-gray-400">
                Kullanıcılara admin yetkisi ver veya kaldır (Sadece Owner)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {users.length === 0 ? (
                <p className="text-gray-400 text-center py-8">Kullanıcı bulunamadı</p>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {users.map((u) => {
                    const isAdmin = u.roles.includes('admin');
                    const isOwner = u.roles.includes('owner');
                    const isCurrentUser = u._id === user.userId;

                    return (
                      <div
                        key={u._id}
                        className="bg-gray-700/50 rounded-lg p-4 flex items-center justify-between hover:bg-gray-700 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-bold text-white">@{u.username}</h3>
                            {isOwner && (
                              <span className="px-2 py-0.5 bg-yellow-600 text-yellow-100 text-xs rounded-full">
                                👑 OWNER
                              </span>
                            )}
                            {isAdmin && !isOwner && (
                              <span className="px-2 py-0.5 bg-red-600 text-red-100 text-xs rounded-full">
                                🛡️ ADMIN
                              </span>
                            )}
                            {!isAdmin && !isOwner && (
                              <span className="px-2 py-0.5 bg-gray-600 text-gray-300 text-xs rounded-full">
                                👤 USER
                              </span>
                            )}
                            {isCurrentUser && (
                              <span className="px-2 py-0.5 bg-blue-600 text-blue-100 text-xs rounded-full">
                                (Sen)
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-400 mt-1">{u.email}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span>🎬 {u.movieCount} film</span>
                            <span>📅 {format(new Date(u.createdAt), 'dd/MM/yyyy')}</span>
                          </div>
                        </div>

                        {/* Admin Yap / Kaldır Butonu */}
                        {!isOwner && !isCurrentUser && (
                          <div>
                            {isAdmin ? (
                              <Button
                                size="sm"
                                onClick={() => handleUpdateUserRole(u._id, 'remove-admin')}
                                disabled={updatingRoleId === u._id}
                                className="bg-orange-600 hover:bg-orange-700"
                              >
                                {updatingRoleId === u._id ? (
                                  <span className="animate-spin">⏳</span>
                                ) : (
                                  <>
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Admin Kaldır
                                  </>
                                )}
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => handleUpdateUserRole(u._id, 'make-admin')}
                                disabled={updatingRoleId === u._id}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                {updatingRoleId === u._id ? (
                                  <span className="animate-spin">⏳</span>
                                ) : (
                                  <>
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Admin Yap
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
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
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-2xl font-bold text-white">
                            {suggestion.title}
                          </h3>
                          {suggestion.type === 'series' ? (
                            <span className="px-2 py-0.5 bg-purple-600 text-purple-100 text-xs rounded-full">
                              DİZİ
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-red-600 text-red-100 text-xs rounded-full">
                              FİLM
                            </span>
                          )}
                        </div>
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

                    {/* DİZİ İÇİN SEZON EKLEME FORMU */}
                    {suggestion.type === 'series' && (
                      <div className="bg-gray-600/50 rounded-lg p-4 mb-4 border border-gray-500">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                            <Tv className="h-4 w-4" />
                            Dizi Sezonları (Onaylamadan önce ekleyin!)
                          </h4>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => {
                              const currentSeasons = suggestionSeasons[suggestion._id] || [];
                              setSuggestionSeasons({
                                ...suggestionSeasons,
                                [suggestion._id]: [
                                  ...currentSeasons,
                                  {
                                    seasonNumber: currentSeasons.length + 1,
                                    episodeCount: 0,
                                    releaseYear: suggestion.year,
                                    description: '',
                                  },
                                ],
                              });
                            }}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Sezon Ekle
                          </Button>
                        </div>

                        {/* Dizi Durumu */}
                        <div className="mb-3">
                          <label className="text-xs text-gray-300 mb-1 block">Dizi Durumu</label>
                          <select
                            value={seriesStatusForSuggestion[suggestion._id] || 'completed'}
                            onChange={(e) =>
                              setSeriesStatusForSuggestion({
                                ...seriesStatusForSuggestion,
                                [suggestion._id]: e.target.value,
                              })
                            }
                            className="w-full bg-gray-700 border-gray-500 text-white rounded-md px-3 py-1.5 text-sm"
                          >
                            <option value="completed">Tamamlandı</option>
                            <option value="ongoing">Devam Ediyor</option>
                            <option value="cancelled">İptal Edildi</option>
                          </select>
                        </div>

                        {suggestionSeasons[suggestion._id] && suggestionSeasons[suggestion._id].length > 0 ? (
                          <div className="space-y-2">
                            {suggestionSeasons[suggestion._id].map((season, index) => (
                              <div key={index} className="bg-gray-700 rounded p-3 space-y-2">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-semibold text-white">
                                    Sezon {season.seasonNumber}
                                  </span>
                                  <Button
                                    type="button"
                                    size="sm"
                                    onClick={() => {
                                      const newSeasons = suggestionSeasons[suggestion._id].filter(
                                        (_, i) => i !== index
                                      );
                                      setSuggestionSeasons({
                                        ...suggestionSeasons,
                                        [suggestion._id]: newSeasons,
                                      });
                                    }}
                                    className="bg-red-600/20 border border-red-600 text-red-400 hover:bg-red-600/40 h-6 px-2"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="text-xs text-gray-400">Bölüm Sayısı *</label>
                                    <Input
                                      type="number"
                                      min="1"
                                      value={season.episodeCount}
                                      onChange={(e) => {
                                        const newSeasons = [...suggestionSeasons[suggestion._id]];
                                        newSeasons[index].episodeCount = parseInt(e.target.value) || 0;
                                        setSuggestionSeasons({
                                          ...suggestionSeasons,
                                          [suggestion._id]: newSeasons,
                                        });
                                      }}
                                      className="bg-gray-600 border-gray-500 text-white text-sm h-8 mt-1"
                                      placeholder="8"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-xs text-gray-400">Yayın Yılı</label>
                                    <Input
                                      type="number"
                                      value={season.releaseYear}
                                      onChange={(e) => {
                                        const newSeasons = [...suggestionSeasons[suggestion._id]];
                                        newSeasons[index].releaseYear = parseInt(e.target.value);
                                        setSuggestionSeasons({
                                          ...suggestionSeasons,
                                          [suggestion._id]: newSeasons,
                                        });
                                      }}
                                      className="bg-gray-600 border-gray-500 text-white text-sm h-8 mt-1"
                                      placeholder={new Date().getFullYear()}
                                    />
                                  </div>
                                </div>
                                <div>
                                  <label className="text-xs text-gray-400">Sezon Açıklaması</label>
                                  <Textarea
                                    value={season.description}
                                    onChange={(e) => {
                                      const newSeasons = [...suggestionSeasons[suggestion._id]];
                                      newSeasons[index].description = e.target.value;
                                      setSuggestionSeasons({
                                        ...suggestionSeasons,
                                        [suggestion._id]: newSeasons,
                                      });
                                    }}
                                    className="bg-gray-600 border-gray-500 text-white text-sm mt-1"
                                    placeholder="Bu sezonda..."
                                    rows={2}
                                  />
                                </div>
                              </div>
                            ))}
                            <div className="bg-blue-900/20 border border-blue-700 rounded p-2">
                              <p className="text-xs text-blue-300">
                                📊 Toplam: {suggestionSeasons[suggestion._id].length} Sezon,{' '}
                                {suggestionSeasons[suggestion._id].reduce(
                                  (sum, s) => sum + (s.episodeCount || 0),
                                  0
                                )}{' '}
                                Bölüm
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-gray-700/30 rounded p-4 text-center">
                            <Tv className="h-6 w-6 text-gray-500 mx-auto mb-1" />
                            <p className="text-xs text-gray-400">
                              Henüz sezon eklenmedi. Onaylamadan önce sezon ekleyin!
                            </p>
                          </div>
                        )}
                      </div>
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
                          onClick={() => handleReview(suggestion._id, 'approve', suggestion)}
                          disabled={processingId === suggestion._id}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          {processingId === suggestion._id ? 'İşleniyor...' : 'Onayla'}
                        </Button>
                        <Button
                          onClick={() => handleReview(suggestion._id, 'reject', suggestion)}
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
