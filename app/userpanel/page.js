'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Film, ListPlus, Edit3, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

function parseMovieTitles(input) {
  if (!input || !input.trim()) return [];
  return input
    .split(/[,;\n\r]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export default function UserPanelPage() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [addMode, setAddMode] = useState('single');
  const [formData, setFormData] = useState({
    title: '',
    year: '',
    genre: '',
    description: '',
  });
  const [bulkText, setBulkText] = useState('');
  const [bulkResult, setBulkResult] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetchMovies();
  }, []);

  const fetchMovies = async () => {
    try {
      const response = await fetch('/api/movies');
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/');
          return;
        }
        throw new Error('Filmler yüklenemedi');
      }
      const data = await response.json();
      setMovies(data.movies || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError('Lütfen film adını girin');
      return;
    }

    setError('');
    setSuccess('');
    setBulkResult(null);
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/movies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Film eklenemedi');
      }

      setFormData({ title: '', year: '', genre: '', description: '' });
      setShowForm(false);
      setSuccess('Film başarıyla eklendi!');
      setTimeout(() => setSuccess(''), 3000);
      fetchMovies();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setBulkResult(null);

    const titles = parseMovieTitles(bulkText);

    if (titles.length === 0) {
      setError('Lütfen en az bir film adı girin');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/movies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titles }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Filmler eklenemedi');
      }

      setBulkResult(data);
      setBulkText('');
      fetchMovies();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (movieId) => {
    if (!confirm('Bu filmi silmek istediğinizden emin misiniz?')) return;

    setDeletingId(movieId);
    setError('');

    // İyimser Güncelleme (Optimistic Update)
    const previousMovies = [...movies];
    setMovies((prev) => prev.filter((m) => m._id !== movieId));

    try {
      const response = await fetch(`/api/movies/${movieId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Film silinemedi');
      }
    } catch (err) {
      // Hata durumunda eski listeyi geri yükle
      setMovies(previousMovies);
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-white" />
          <p className="mt-4 text-gray-400 font-light">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pt-24 pb-20">
      <div className="container mx-auto px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h1 className="text-6xl font-light mb-2">Kullanıcı Paneli</h1>
              <p className="text-gray-400 font-light">İzlediğiniz filmleri yönetin</p>
            </div>
            <Button
              onClick={() => {
                setShowForm(!showForm);
                setBulkResult(null);
                setError('');
                setSuccess('');
              }}
              className="bg-white text-black hover:bg-gray-200 font-light rounded-full"
            >
              <Plus className="mr-2 h-4 w-4" />
              {showForm ? 'Formu Kapat' : 'Film Ekle'}
            </Button>
          </div>

          {error && (
            <div className="glass border-red-500/50 text-red-400 px-6 py-4 rounded-2xl mb-8">
              {error}
            </div>
          )}

          {success && (
            <div className="glass border-green-500/50 text-green-400 px-6 py-4 rounded-2xl mb-8">
              {success}
            </div>
          )}

          {bulkResult && (
            <div className="glass border-purple-500/50 text-purple-300 px-6 py-4 rounded-2xl mb-8">
              <p className="font-light mb-2">
                <strong className="text-white">{bulkResult.addedCount}</strong> film eklendi
                {bulkResult.skippedCount > 0 && (
                  <>, <strong className="text-yellow-400">{bulkResult.skippedCount}</strong> film zaten varken atlandı</>
                )}
              </p>
              {bulkResult.skipped?.length > 0 && (
                <div className="mt-3 text-sm text-yellow-300/80">
                  <p className="mb-1">Atlanan filmler:</p>
                  <ul className="list-disc list-inside">
                    {bulkResult.skipped.map((s, i) => (
                      <li key={i}>{s.title} — {s.reason}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {showForm && (
            <div className="glass rounded-2xl p-8 mb-12">
              <h2 className="text-2xl font-light mb-2">Yeni Film Ekle</h2>
              <p className="text-gray-400 mb-6 font-light">İzlediğiniz filmleri listeye ekleyin</p>

              <div className="flex gap-2 mb-6 p-1 glass rounded-xl w-fit">
                <button
                  type="button"
                  onClick={() => { setAddMode('single'); setBulkResult(null); }}
                  className={`px-5 py-2 rounded-lg font-light text-sm transition-all flex items-center gap-2 ${
                    addMode === 'single' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Edit3 className="h-4 w-4" />
                  Tek Tek Ekle
                </button>
                <button
                  type="button"
                  onClick={() => { setAddMode('bulk'); setBulkResult(null); }}
                  className={`px-5 py-2 rounded-lg font-light text-sm transition-all flex items-center gap-2 ${
                    addMode === 'bulk' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <ListPlus className="h-4 w-4" />
                  Çoklu Ekle
                </button>
              </div>

              {addMode === 'single' ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-light mb-2">Film Adı <span className="text-red-400">*</span></label>
                    <Input
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      placeholder="Örn: Paranormal Activity"
                      className="bg-white/5 border-white/10 font-light"
                      required
                    />
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-light mb-2">Yıl <span className="text-gray-500">(opsiyonel)</span></label>
                      <Input
                        name="year"
                        value={formData.year}
                        onChange={handleChange}
                        placeholder="Örn: 2007"
                        className="bg-white/5 border-white/10 font-light"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-light mb-2">Tür <span className="text-gray-500">(opsiyonel)</span></label>
                      <Input
                        name="genre"
                        value={formData.genre}
                        onChange={handleChange}
                        placeholder="Örn: Korku, Gerilim"
                        className="bg-white/5 border-white/10 font-light"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-light mb-2">Açıklama <span className="text-gray-500">(opsiyonel)</span></label>
                    <Textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Kısa bir açıklama yazın"
                      className="bg-white/5 border-white/10 font-light min-h-[100px]"
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button type="submit" disabled={isSubmitting} className="bg-white text-black hover:bg-gray-200 font-light rounded-full">
                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Kaydet
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setShowForm(false)}
                      className="font-light"
                    >
                      İptal
                    </Button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleBulkSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-light mb-2">
                      Film Adları <span className="text-red-400">*</span>
                    </label>
                    <p className="text-xs text-gray-400 mb-3 font-light">
                      Virgül (,) ile ayırın veya her satıra bir film yazın
                    </p>
                    <Textarea
                      value={bulkText}
                      onChange={(e) => setBulkText(e.target.value)}
                      placeholder={`Paranormal Aktivite 1, Korku Seansı 1, The Conjuring\nHereditary\nSinister, Insidious`}
                      className="bg-white/5 border-white/10 font-light min-h-[220px] text-base leading-relaxed"
                    />
                  </div>
                  {bulkText && (
                    <div className="text-sm text-purple-400 font-light">
                      {parseMovieTitles(bulkText).length} film algılandı
                    </div>
                  )}
                  <div className="flex gap-3">
                    <Button type="submit" disabled={isSubmitting} className="bg-white text-black hover:bg-gray-200 font-light rounded-full">
                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Toplu Kaydet
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setShowForm(false)}
                      className="font-light"
                    >
                      İptal
                    </Button>
                  </div>
                </form>
              )}
            </div>
          )}

          <div>
            <h2 className="text-3xl font-light mb-8">
              İzlediğim Filmler ({movies.length})
            </h2>

            {movies.length === 0 ? (
              <div className="glass rounded-2xl p-12 text-center">
                <Film className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 mb-2 font-light">Henüz film eklemediniz</p>
                <p className="text-sm text-gray-500 font-light">
                  İzlediğiniz filmleri ekleyerek kişiselleştirilmiş öneriler alın
                </p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {movies.map((movie, index) => (
                  <div key={movie._id || index} className="glass rounded-2xl p-6 hover:bg-white/10 transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between mb-3 gap-2">
                        <h3 className="text-xl font-light">{movie.title}</h3>
                        {movie.year && (
                          <span className="text-xs glass px-2 py-1 rounded-full whitespace-nowrap">
                            {movie.year}
                          </span>
                        )}
                      </div>
                      {movie.genre && (
                        <p className="text-sm text-purple-400 mb-4 font-light">
                          {movie.genre}
                        </p>
                      )}
                      {movie.description && (
                        <p className="text-sm text-gray-400 mb-6 font-light leading-relaxed">
                          {movie.description}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={deletingId === movie._id}
                      onClick={() => handleDelete(movie._id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-400/10 font-light w-fit"
                    >
                      {deletingId === movie._id ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 mr-2" />
                      )}
                      Sil
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}