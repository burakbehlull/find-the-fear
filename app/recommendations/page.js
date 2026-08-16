'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Sparkles, TrendingUp, Film } from 'lucide-react';

export default function RecommendationsPage() {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [useWatchHistory, setUseWatchHistory] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  const getRecommendations = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ useWatchHistory }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Öneriler alınamadı');
      }

      setRecommendations(data.recommendations || []);
      setHasGenerated(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white pt-24 pb-20">
      <div className="container mx-auto px-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-16">
            <h1 className="text-6xl font-light mb-4">
              Film Önerileri
            </h1>
            <p className="text-gray-400 text-lg font-light">
              Yapay zeka destekli kişiselleştirilmiş film önerileri
            </p>
          </div>

          <div className="glass rounded-2xl p-8 mb-12">
            <div className="flex items-center gap-3 mb-6">
              <Sparkles className="h-6 w-6 text-purple-400" />
              <h2 className="text-2xl font-light">Öneri Ayarları</h2>
            </div>
            <p className="text-gray-400 mb-8 font-light">
              Nasıl önerilerde bulunmamızı istersiniz?
            </p>
            
            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="watch-history"
                  checked={useWatchHistory}
                  onCheckedChange={setUseWatchHistory}
                />
                <label
                  htmlFor="watch-history"
                  className="text-sm font-light leading-none cursor-pointer"
                >
                  İzlediklerime göre öner
                </label>
              </div>
              
              <p className="text-sm text-gray-400 font-light">
                {useWatchHistory ? (
                  <>
                    <TrendingUp className="inline h-4 w-4 mr-1 text-purple-400" />
                    İzlediğiniz filmlere göre benzer türde filmler önerilecek
                  </>
                ) : (
                  <>
                    <Film className="inline h-4 w-4 mr-1 text-purple-400" />
                    Genel popüler filmlerden öneriler alacaksınız
                  </>
                )}
              </p>

              <Button 
                onClick={getRecommendations} 
                disabled={loading}
                className="w-full bg-white text-black hover:bg-gray-200 font-light rounded-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
                    Öneriler Hazırlanıyor...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    Film Önerilerini Getir
                  </>
                )}
              </Button>
            </div>
          </div>

          {error && (
            <div className="glass border-red-500/50 text-red-400 px-6 py-4 rounded-2xl mb-8">
              {error}
            </div>
          )}

          {hasGenerated && recommendations.length === 0 && (
            <div className="glass rounded-2xl p-12 text-center">
              <p className="text-gray-400 font-light">
                Öneri bulunamadı. Lütfen tekrar deneyin.
              </p>
            </div>
          )}

          {recommendations.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-light">
                  Sizin İçin Öneriler
                </h2>
                <span className="text-sm text-gray-400 font-light">
                  {useWatchHistory ? '🎯 İzlediklerinize göre' : '🌟 Genel öneriler'}
                </span>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recommendations.map((movie, index) => (
                  <div 
                    key={index} 
                    className="glass rounded-2xl p-6 hover:bg-white/10 transition-all hover:-translate-y-1"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-xl font-light">
                        {movie.title}
                      </h3>
                      <span className="text-xs glass px-2 py-1 rounded-full">
                        {movie.year}
                      </span>
                    </div>
                    <p className="text-sm text-purple-400 mb-4 font-light">
                      {movie.genre}
                    </p>
                    <p className="text-sm text-gray-400 mb-4 font-light leading-relaxed">
                      {movie.description}
                    </p>
                    {movie.reason && (
                      <div className="glass p-3 rounded-xl">
                        <p className="text-xs text-gray-500 font-light mb-1">
                          Neden önerildi?
                        </p>
                        <p className="text-xs text-gray-400 font-light">
                          {movie.reason}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
