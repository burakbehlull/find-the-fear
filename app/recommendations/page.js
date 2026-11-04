'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, TrendingUp, Film, MessageSquare, ExternalLink } from 'lucide-react';

export default function RecommendationsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [useWatchHistory, setUseWatchHistory] = useState(false);
  const [useCustomRequest, setUseCustomRequest] = useState(false);
  const [customRequest, setCustomRequest] = useState('');
  const [hasGenerated, setHasGenerated] = useState(false);

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
      }
    } catch (error) {
      console.error('User fetch error:', error);
    }
  };

  const getRecommendations = async () => {
    setLoading(true);
    setError('');
    setRecommendations([]); // Yeni öneri alırken eskilerini temizle

    try {
      const response = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          useWatchHistory,
          customRequest: useCustomRequest ? customRequest : null,
        }),
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

  const getMoreRecommendations = async () => {
    setLoadingMore(true);
    setError('');

    try {
      const response = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          useWatchHistory,
          customRequest: useCustomRequest ? customRequest : null,
          excludeTitles: recommendations.map(r => r.title), // Zaten önerilen filmleri gönder
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Daha fazla öneri alınamadı');
      }

      const newRecommendations = data.recommendations || [];
      
      // Mevcut önerilerin altına ekle (duplicate kontrolü)
      const existingTitles = recommendations.map(r => r.title.toLowerCase());
      const filteredNew = newRecommendations.filter(
        r => !existingTitles.includes(r.title.toLowerCase())
      );
      
      setRecommendations([...recommendations, ...filteredNew]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white pt-28 pb-20">
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

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="custom-request"
                    checked={useCustomRequest}
                    onCheckedChange={(checked) => {
                      setUseCustomRequest(checked);
                      if (!checked) setCustomRequest('');
                    }}
                  />
                  <label
                    htmlFor="custom-request"
                    className="text-sm font-light leading-none cursor-pointer"
                  >
                    Özel İstek
                  </label>
                </div>
                
                {currentUser && (
                  <Link href={`/profile/${currentUser.username}`}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-gray-800/50 border-gray-700 hover:bg-gray-700 hover:border-gray-600 text-xs transition-all"
                    >
                      <ExternalLink className="h-3 w-3 mr-1.5" />
                      İzlediklerime Git
                    </Button>
                  </Link>
                )}
              </div>

              {useCustomRequest && (
                <div className="ml-7 space-y-3 animate-in slide-in-from-top-2 duration-300">
                  <label className="text-sm text-gray-400 font-light">
                    Özel isteğinizi yazın (örn: "kan içermesin ama psikolojik korku olsun")
                  </label>
                  <Textarea
                    value={customRequest}
                    onChange={(e) => setCustomRequest(e.target.value)}
                    placeholder="Örnek: Korku dolu ama kan sahneleri olmayan filmler istiyorum..."
                    className="bg-gray-900/50 border-gray-700 text-white min-h-[100px] resize-none"
                  />
                </div>
              )}
              
              <p className="text-sm text-gray-400 font-light">
                {useCustomRequest && customRequest ? (
                  <>
                    <MessageSquare className="inline h-4 w-4 mr-1 text-purple-400" />
                    Özel isteğinize göre filmler önerilecek
                    {useWatchHistory && ' ve izledikleriniz de dikkate alınacak'}
                  </>
                ) : useWatchHistory ? (
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
                disabled={loading || (useCustomRequest && !customRequest.trim())}
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
                <div className="flex items-center gap-2">
                  {useCustomRequest && customRequest && (
                    <span className="text-xs glass px-3 py-1.5 rounded-full text-purple-400 border border-purple-500/30">
                      <MessageSquare className="inline h-3 w-3 mr-1" />
                      Özel İstek
                    </span>
                  )}
                  {useWatchHistory && (
                    <span className="text-xs glass px-3 py-1.5 rounded-full text-green-400 border border-green-500/30">
                      🎯 İzlediklerinize göre
                    </span>
                  )}
                  {!useWatchHistory && !useCustomRequest && (
                    <span className="text-xs glass px-3 py-1.5 rounded-full">
                      🌟 Genel öneriler
                    </span>
                  )}
                </div>
              </div>

              {useCustomRequest && customRequest && (
                <div className="glass rounded-xl p-4 mb-6 border border-purple-500/20">
                  <div className="flex items-start gap-3">
                    <MessageSquare className="h-5 w-5 text-purple-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-400 font-light mb-1">Özel İsteğiniz:</p>
                      <p className="text-white font-light">{customRequest}</p>
                    </div>
                  </div>
                </div>
              )}
              
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

              {/* Daha Fazla Öner Butonu */}
              <div className="mt-8 text-center">
                <Button
                  onClick={getMoreRecommendations}
                  disabled={loadingMore}
                  variant="outline"
                  size="lg"
                  className="bg-gray-800/50 border-gray-700 hover:bg-gray-700 hover:border-gray-600 px-8"
                >
                  {loadingMore ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Daha Fazla Getiriliyor...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      Daha Fazla Öner
                    </>
                  )}
                </Button>
                <p className="text-xs text-gray-500 mt-3 font-light">
                  Aynı kriterlerle 5 film daha önerilecek
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
