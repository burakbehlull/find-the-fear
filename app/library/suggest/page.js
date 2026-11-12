'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Film, Tv } from 'lucide-react';
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

function SuggestForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [contentType, setContentType] = useState('film'); // 'film' veya 'series'
  const [formData, setFormData] = useState({
    title: '',
    year: '',
    genres: [],
    description: '',
    director: '',
    poster: '',
    imdbLink: '',
  });

  // URL'den type parametresini oku
  useEffect(() => {
    const type = searchParams.get('type');
    if (type === 'series') {
      setContentType('series');
    }
  }, [searchParams]);

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
          type: contentType, // İçerik tipini ekle
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
      console.error(`${contentType === 'film' ? 'Film' : 'Dizi'} önerme hatası:`, error);
      toast.error(`${contentType === 'film' ? 'Film' : 'Dizi'} önerilirken hata oluştu`);
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
            <CardTitle className="text-white text-2xl flex items-center gap-2">
              {contentType === 'film' ? (
                <><Film className="h-6 w-6" /> Film Öner</>
              ) : (
                <><Tv className="h-6 w-6" /> Dizi Öner</>
              )}
            </CardTitle>
            <CardDescription className="text-gray-400">
              Kütüphanede olmayan bir {contentType === 'film' ? 'film' : 'dizi'} öner. Admin onayından sonra eklenecek.
            </CardDescription>
            
            {/* İçerik Tipi Değiştirici */}
            <div className="flex gap-2 mt-4">
              <Button
                type="button"
                size="sm"
                onClick={() => setContentType('film')}
                className={contentType === 'film' ? 'bg-red-600' : 'bg-gray-700 hover:bg-gray-600'}
              >
                <Film className="h-3 w-3 mr-1" />
                Film
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => setContentType('series')}
                className={contentType === 'series' ? 'bg-red-600' : 'bg-gray-700 hover:bg-gray-600'}
              >
                <Tv className="h-3 w-3 mr-1" />
                Dizi
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {contentType === 'film' ? 'Film' : 'Dizi'} Adı *
                </label>
                <Input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                  placeholder={contentType === 'film' ? 'The Ring' : 'Stranger Things'}
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
                  placeholder={`${contentType === 'film' ? 'Film' : 'Dizi'} hakkında kısa bir açıklama yazın...`}
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
                  {loading ? 'Gönderiliyor...' : `${contentType === 'film' ? 'Film' : 'Dizi'} Öner`}
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

export default function SuggestMoviePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-red-950 pt-28 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-400">Yükleniyor...</p>
        </div>
      </div>
    }>
      <SuggestForm />
    </Suspense>
  );
}
