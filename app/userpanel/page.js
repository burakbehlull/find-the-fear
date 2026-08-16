'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Film } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function UserPanelPage() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    year: '',
    genre: '',
    description: '',
  });
  const [error, setError] = useState('');
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
    setError('');

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
      fetchMovies();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (movieId) => {
    if (!confirm('Bu filmi silmek istediğinizden emin misiniz?')) return;

    try {
      const response = await fetch(`/api/movies/${movieId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Film silinemedi');
      }

      fetchMovies();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
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
              onClick={() => setShowForm(!showForm)}
              className="bg-white text-black hover:bg-gray-200 font-light rounded-full"
            >
              <Plus className="mr-2 h-4 w-4" />
              Film Ekle
            </Button>
          </div>

          {error && (
            <div className="glass border-red-500/50 text-red-400 px-6 py-4 rounded-2xl mb-8">
              {error}
            </div>
          )}

          {showForm && (
            <div className="glass rounded-2xl p-8 mb-12">
              <h2 className="text-2xl font-light mb-2">Yeni Film Ekle</h2>
              <p className="text-gray-400 mb-6 font-light">İzlediğiniz bir filmi listeye ekleyin</p>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-light mb-2">Film Adı</label>
                  <Input
                    name="title"
                    required
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Örn: Paranormal Activity"
                    className="bg-white/5 border-white/10 font-light"
                  />
                </div>
                <div>
                  <label className="block text-sm font-light mb-2">Yıl</label>
                  <Input
                    name="year"
                    required
                    value={formData.year}
                    onChange={handleChange}
                    placeholder="Örn: 2007"
                    className="bg-white/5 border-white/10 font-light"
                  />
                </div>
                <div>
                  <label className="block text-sm font-light mb-2">Tür</label>
                  <Input
                    name="genre"
                    required
                    value={formData.genre}
                    onChange={handleChange}
                    placeholder="Örn: Korku, Gerilim"
                    className="bg-white/5 border-white/10 font-light"
                  />
                </div>
                <div>
                  <label className="block text-sm font-light mb-2">Açıklama</label>
                  <Input
                    name="description"
                    required
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Kısa bir açıklama yazın"
                    className="bg-white/5 border-white/10 font-light"
                  />
                </div>
                <div className="flex gap-3">
                  <Button type="submit" className="bg-white text-black hover:bg-gray-200 font-light rounded-full">
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
                {movies.map((movie) => (
                  <div key={movie._id} className="glass rounded-2xl p-6 hover:bg-white/10 transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-xl font-light">{movie.title}</h3>
                      <span className="text-xs glass px-2 py-1 rounded-full">
                        {movie.year}
                      </span>
                    </div>
                    <p className="text-sm text-purple-400 mb-4 font-light">
                      {movie.genre}
                    </p>
                    <p className="text-sm text-gray-400 mb-6 font-light leading-relaxed">
                      {movie.description}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(movie._id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-400/10 font-light"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
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
