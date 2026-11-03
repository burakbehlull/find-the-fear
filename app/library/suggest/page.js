'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft } from 'lucide-react';
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

export default function SuggestMoviePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    year: '',
    genres: [],
    description: '',
    director: '',
    poster: '',
    imdbLink: '',
  });

  const handleGenreToggle = (genre) => {
    setFormData((prev) => ({
      ...prev,
      genres: prev.genres.includes(genre)
        ? prev.genres.filter((g) => g !== genre)
        : [...prev.genres, genre],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.year || formData.genres.length === 0 || !formData.description) {
      toast.error('Lütfen gerekli alanları doldurun');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          year: parseInt(formData.year),
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(data.message);
        router.push('/library');
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error('Film önerme hatası:', error);
      toast.error('Film önerilirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-red-950 pt-28 p-6">
      <div className="max-w-3xl mx-auto">
        <Button
          onClick={() => router.back()}
          variant="ghost"
          className="mb-6 text-gray-300 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Geri Dön
        </Button>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white text-2xl">Film Öner</CardTitle>
            <CardDescription className="text-gray-400">
              Kütüphanede olmayan bir film öner. Admin onayından sonra eklenecek.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Film Adı *
                </label>
                <Input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                  placeholder="The Ring"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Yıl *
                </label>
                <Input
                  type="number"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                  placeholder="2002"
                  min="1900"
                  max="2030"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Türler * (En az 1 seçin)
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {GENRES.map((genre) => (
                    <div key={genre.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`suggest-${genre.value}`}
                        checked={formData.genres.includes(genre.value)}
                        onCheckedChange={() => handleGenreToggle(genre.value)}
                        className="border-gray-600"
                      />
                      <label
                        htmlFor={`suggest-${genre.value}`}
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
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                  placeholder="Film hakkında kısa bir açıklama yazın..."
                  rows={4}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Yönetmen
                </label>
                <Input
                  type="text"
                  value={formData.director}
                  onChange={(e) => setFormData({ ...formData, director: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                  placeholder="Gore Verbinski"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Poster URL
                </label>
                <Input
                  type="url"
                  value={formData.poster}
                  onChange={(e) => setFormData({ ...formData, poster: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                  placeholder="https://example.com/poster.jpg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  IMDB Linki
                </label>
                <Input
                  type="url"
                  value={formData.imdbLink}
                  onChange={(e) => setFormData({ ...formData, imdbLink: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                  placeholder="https://www.imdb.com/title/tt..."
                />
              </div>

              <div className="flex gap-4">
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  {loading ? 'Gönderiliyor...' : 'Filmi Öner'}
                </Button>
                <Button
                  type="button"
                  onClick={() => router.back()}
                  variant="outline"
                  className="bg-gray-700 border-gray-600 hover:bg-gray-600"
                >
                  İptal
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
