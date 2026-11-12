'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Star, Users, Calendar, Film as FilmIcon, Trash2, Heart, AlertTriangle, Tv, ChevronDown, ChevronUp, CheckCircle } from 'lucide-react';
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

export default function MovieDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [movie, setMovie] = useState(null);
  const [comments, setComments] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isSpoiler, setIsSpoiler] = useState(false);
  const [userRating, setUserRating] = useState(null);
  const [isInList, setIsInList] = useState(false);
  
  // Dizi için state'ler
  const [expandedSeasons, setExpandedSeasons] = useState([1]); // Açık sezonlar
  const [watchedEpisodes, setWatchedEpisodes] = useState([]); // İzlenen bölümler {season, episode}
  const [showEpisodeModal, setShowEpisodeModal] = useState(null); // {season, episode, title}
  const [episodeForm, setEpisodeForm] = useState({
    watchedAt: new Date().toISOString().slice(0, 16),
    watchedWith: '',
    note: '',
    rating: '',
  });

  useEffect(() => {
    fetchData();
  }, [params.id]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Kullanıcı bilgisini al
      const userRes = await fetch('/api/auth/me');
      if (userRes.ok) {
        const userData = await userRes.json();
        setUser(userData.user);
      }

      // Film bilgisini al (slug ile)
      const movieRes = await fetch(`/api/library/movies/slug/${params.id}`);
      const movieData = await movieRes.json();
      if (movieData.success) {
        setMovie(movieData.movie);
      }

      // Yorumları al (slug yerine _id kullanıyoruz yorumlar için)
      const commentsRes = await fetch(`/api/library/comments?movieId=${movieData.movie._id}`);
      const commentsData = await commentsRes.json();
      if (commentsData.success) {
        setComments(commentsData.comments);
      }

      // Kullanıcının bu içeriği listesinde olup olmadığını ve puanını kontrol et
      if (userRes.ok && movieData.movie) {
        const userMoviesRes = await fetch('/api/user/movies');
        const userMoviesData = await userMoviesRes.json();
        if (userMoviesData.success) {
          const userMovie = userMoviesData.movies.find(
            (m) => m.movieId._id === movieData.movie._id
          );
          if (userMovie) {
            setIsInList(true);
            setUserRating(userMovie.rating);
            
            // Dizi ise izlenen bölümleri yükle
            if (movieData.movie.type === 'series' && userMovie.watchedEpisodes) {
              setWatchedEpisodes(userMovie.watchedEpisodes);
            }
          }
        }
      }
    } catch (error) {
      console.error('Veri yükleme hatası:', error);
      toast.error('Veriler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToList = async () => {
    if (!user) {
      toast.error('Giriş yapmalısınız');
      router.push('/');
      return;
    }

    try {
      const res = await fetch('/api/user/movies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ movieId: movie._id }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success('Film listenize eklendi!');
        setIsInList(true);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error('Film ekleme hatası:', error);
      toast.error('Film eklenirken hata oluştu');
    }
  };

  const handleRating = async (rating) => {
    if (!user) {
      toast.error('Giriş yapmalısınız');
      return;
    }

    if (!isInList) {
      toast.error('Önce filmi listenize ekleyin');
      return;
    }

    try {
      const res = await fetch('/api/user/movies/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ movieId: movie._id, rating }),
      });

      const data = await res.json();
      if (data.success) {
        setUserRating(rating);
        toast.success(`${rating}/10 puan verdiniz!`);
        // Film detayını yenile
        setTimeout(() => fetchData(), 500);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error('Puanlama hatası:', error);
      toast.error('Puanlama yapılırken hata oluştu');
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      toast.error('Giriş yapmalısınız');
      router.push('/');
      return;
    }

    if (!newComment.trim()) {
      toast.error('Yorum boş olamaz');
      return;
    }

    try {
      const res = await fetch('/api/library/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          movieId: movie._id,
          comment: newComment,
          spoiler: isSpoiler,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success('Yorum eklendi!');
        setComments([data.comment, ...comments]);
        setNewComment('');
        setIsSpoiler(false);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error('Yorum ekleme hatası:', error);
      toast.error('Yorum eklenirken hata oluştu');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!confirm('Yorumu silmek istediğinizden emin misiniz?')) return;

    try {
      const res = await fetch(`/api/library/comments?commentId=${commentId}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (data.success) {
        toast.success('Yorum silindi');
        setComments(comments.filter((c) => c._id !== commentId));
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error('Yorum silme hatası:', error);
      toast.error('Yorum silinirken hata oluştu');
    }
  };

  const handleLikeComment = async (commentId) => {
    if (!user) {
      toast.error('Giriş yapmalısınız');
      return;
    }

    try {
      const res = await fetch('/api/library/comments/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId }),
      });

      const data = await res.json();
      if (data.success) {
        // Yorumları güncelle
        setComments(
          comments.map((c) =>
            c._id === commentId
              ? {
                  ...c,
                  likes: data.liked
                    ? [...c.likes, user.userId]
                    : c.likes.filter((id) => id !== user.userId),
                }
              : c
          )
        );
      }
    } catch (error) {
      console.error('Beğeni hatası:', error);
    }
  };

  const handleWatchEpisode = async () => {
    if (!showEpisodeModal) return;

    try {
      const res = await fetch('/api/user/watch-episode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          movieId: movie._id,
          season: showEpisodeModal.season,
          episode: showEpisodeModal.episode,
          watchedAt: episodeForm.watchedAt,
          watchedWith: episodeForm.watchedWith,
          rating: episodeForm.rating ? parseFloat(episodeForm.rating) : undefined,
          note: episodeForm.note,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success('Bölüm izlendi olarak işaretlendi!');
        // Watched episodes'u güncelle
        setWatchedEpisodes([
          ...watchedEpisodes.filter(
            (e) =>
              !(e.season === showEpisodeModal.season && e.episode === showEpisodeModal.episode)
          ),
          {
            season: showEpisodeModal.season,
            episode: showEpisodeModal.episode,
            watchedAt: episodeForm.watchedAt,
            watchedWith: episodeForm.watchedWith,
            rating: episodeForm.rating ? parseFloat(episodeForm.rating) : undefined,
            note: episodeForm.note,
          },
        ]);
        setShowEpisodeModal(null);
        setEpisodeForm({
          watchedAt: new Date().toISOString().slice(0, 16),
          watchedWith: '',
          note: '',
          rating: '',
        });
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error('Bölüm izleme hatası:', error);
      toast.error('Bölüm işaretlenirken hata oluştu');
    }
  };

  const handleUnwatchEpisode = async (season, episode) => {
    if (!confirm('Bu bölümü izlenmedi olarak işaretlemek istiyor musunuz?')) return;

    try {
      const res = await fetch('/api/user/watch-episode', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          movieId: movie._id,
          season,
          episode,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success('Bölüm izlenmedi olarak işaretlendi');
        setWatchedEpisodes(
          watchedEpisodes.filter((e) => !(e.season === season && e.episode === episode))
        );
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error('Bölüm kaldırma hatası:', error);
      toast.error('İşlem yapılırken hata oluştu');
    }
  };

  const handleBulkWatchSeason = async (seasonNumber, episodes) => {
    if (!episodes || episodes.length === 0) {
      toast.error('Bu sezonda bölüm bulunamadı');
      return;
    }

    const unwatchedEpisodes = episodes.filter(
      (ep) =>
        !watchedEpisodes.some(
          (we) => we.season === seasonNumber && we.episode === ep.episodeNumber
        )
    );

    if (unwatchedEpisodes.length === 0) {
      toast.error('Bu sezondaki tüm bölümler zaten izlendi');
      return;
    }

    if (
      !confirm(
        `${unwatchedEpisodes.length} bölümü izlendi olarak işaretlemek istiyor musunuz?`
      )
    )
      return;

    try {
      const res = await fetch('/api/user/watch-season', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          movieId: movie._id,
          season: seasonNumber,
          episodes: unwatchedEpisodes.map((ep) => ep.episodeNumber),
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`${unwatchedEpisodes.length} bölüm izlendi olarak işaretlendi!`);
        // Watched episodes'u güncelle
        const newWatchedEpisodes = unwatchedEpisodes.map((ep) => ({
          season: seasonNumber,
          episode: ep.episodeNumber,
          watchedAt: new Date().toISOString(),
        }));
        setWatchedEpisodes([...watchedEpisodes, ...newWatchedEpisodes]);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error('Toplu izleme hatası:', error);
      toast.error('İşlem yapılırken hata oluştu');
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

  if (!movie) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-red-950 pt-28">
        <div className="text-center">
          <p className="text-gray-400 text-xl">Film bulunamadı</p>
          <Link href="/library">
            <Button className="mt-4 bg-red-600 hover:bg-red-700">Kütüphaneye Dön</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-red-950 pt-28 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Film Detay Kartı */}
        <Card className="bg-gray-800/50 border-gray-700 mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Poster */}
              <div className="aspect-[2/3] bg-gray-700 rounded-lg overflow-hidden">
                {movie.poster ? (
                  <img
                    src={movie.poster}
                    alt={movie.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500">
                    <FilmIcon className="h-24 w-24" />
                  </div>
                )}
              </div>

              {/* Bilgiler */}
              <div className="md:col-span-2">
                <h1 className="text-4xl font-bold text-white mb-4">{movie.title}</h1>
                
                {/* Seri bilgisi */}
                {movie.series && (
                  <p className="text-lg text-purple-400 mb-2">
                    📺 {movie.series}
                  </p>
                )}
                
                <div className="flex flex-wrap gap-4 mb-4">
                  <div className="flex items-center gap-2 text-gray-300">
                    <Calendar className="h-5 w-5" />
                    <span>{movie.year}</span>
                  </div>
                  {movie.averageRating && (
                    <div className="flex items-center gap-2 text-yellow-500">
                      <Star className="h-5 w-5 fill-current" />
                      <span className="font-bold">
                        {movie.averageRating.toFixed(1)}/10
                      </span>
                      <span className="text-sm text-gray-400">
                        ({movie.totalRatings} puan)
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-gray-300">
                    <Users className="h-5 w-5" />
                    <span>{movie.watchedByCount} kişi izledi</span>
                  </div>
                </div>

                {/* Türler */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {movie.genres.map((genre) => (
                    <span
                      key={genre}
                      className="px-3 py-1 bg-red-900/50 text-red-300 rounded-full text-sm"
                    >
                      {GENRE_NAMES[genre]}
                    </span>
                  ))}
                </div>

                <p className="text-gray-300 mb-6">{movie.description}</p>

                {movie.director && (
                  <p className="text-gray-400 mb-2">
                    <span className="font-semibold">Yönetmen:</span> {movie.director}
                  </p>
                )}

                {/* Aksiyonlar */}
                <div className="space-y-4">
                  {!isInList ? (
                    <Button
                      onClick={handleAddToList}
                      className="w-full md:w-auto bg-red-600 hover:bg-red-700"
                    >
                      Listime Ekle
                    </Button>
                  ) : (
                    <div>
                      <p className="text-green-400 mb-2">✓ Listenizde</p>
                      <div className="flex flex-wrap gap-2">
                        {[...Array(10)].map((_, i) => (
                          <button
                            key={i + 1}
                            onClick={() => handleRating(i + 1)}
                            className={`w-10 h-10 rounded ${
                              userRating && i + 1 <= userRating
                                ? 'bg-yellow-500 text-white'
                                : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                            } font-bold transition-colors`}
                          >
                            {i + 1}
                          </button>
                        ))}
                      </div>
                      {userRating && (
                        <p className="text-sm text-gray-400 mt-2">
                          Puanınız: {userRating}/10
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dizi İçin Sezon/Bölüm Listesi */}
        {movie.type === 'series' && movie.seasons && movie.seasons.length > 0 && (
          <Card className="bg-gray-800/50 border-gray-700 mb-6">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Tv className="h-6 w-6" />
                Sezonlar & Bölümler
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {movie.seasons.map((season) => {
                  const isExpanded = expandedSeasons.includes(season.seasonNumber);
                  const seasonWatchedCount = watchedEpisodes.filter(
                    (e) => e.season === season.seasonNumber
                  ).length;
                  const totalEpisodes = season.episodes?.length || season.episodeCount || 0;
                  
                  return (
                    <div key={season.seasonNumber} className="bg-gray-700/50 rounded-lg overflow-hidden">
                      {/* Sezon Başlığı */}
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <button
                            onClick={() => {
                              setExpandedSeasons(
                                isExpanded
                                  ? expandedSeasons.filter((s) => s !== season.seasonNumber)
                                  : [...expandedSeasons, season.seasonNumber]
                              );
                            }}
                            className="flex items-center gap-2 text-lg font-semibold text-white hover:text-red-400 transition-colors"
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-5 w-5" />
                            ) : (
                              <ChevronDown className="h-5 w-5" />
                            )}
                            Sezon {season.seasonNumber}
                          </button>
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-400">
                              {seasonWatchedCount}/{totalEpisodes} bölüm
                            </span>
                            {user && isInList && seasonWatchedCount < totalEpisodes && (
                              <Button
                                size="sm"
                                onClick={() => handleBulkWatchSeason(season.seasonNumber, season.episodes)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                Tüm Sezonu İzledim
                              </Button>
                            )}
                          </div>
                        </div>
                        {season.releaseYear && (
                          <p className="text-sm text-gray-400">Yıl: {season.releaseYear}</p>
                        )}
                        {season.description && (
                          <p className="text-sm text-gray-300 mt-2">{season.description}</p>
                        )}
                      </div>

                      {/* Bölüm Listesi */}
                      {isExpanded && season.episodes && season.episodes.length > 0 && (
                        <div className="border-t border-gray-600">
                          <div className="p-4 space-y-2">
                            {season.episodes.map((episode) => {
                              const watchedEpisode = watchedEpisodes.find(
                                (e) =>
                                  e.season === season.seasonNumber &&
                                  e.episode === episode.episodeNumber
                              );
                              const isWatched = !!watchedEpisode;

                              return (
                                <div
                                  key={episode.episodeNumber}
                                  className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                                    isWatched ? 'bg-green-900/20' : 'bg-gray-600/30 hover:bg-gray-600/50'
                                  }`}
                                >
                                  {/* Checkbox */}
                                  {user && isInList && (
                                    <button
                                      onClick={() => {
                                        if (isWatched) {
                                          handleUnwatchEpisode(season.seasonNumber, episode.episodeNumber);
                                        } else {
                                          setShowEpisodeModal({
                                            season: season.seasonNumber,
                                            episode: episode.episodeNumber,
                                            title: episode.title || `Bölüm ${episode.episodeNumber}`,
                                          });
                                        }
                                      }}
                                      className="mt-1"
                                    >
                                      {isWatched ? (
                                        <CheckCircle className="h-5 w-5 text-green-400" />
                                      ) : (
                                        <div className="h-5 w-5 border-2 border-gray-400 rounded-full" />
                                      )}
                                    </button>
                                  )}

                                  {/* Bölüm Bilgileri */}
                                  <div className="flex-1">
                                    <div className="flex items-start justify-between">
                                      <div>
                                        <h4 className="text-white font-medium">
                                          {episode.episodeNumber}.{' '}
                                          {episode.title || `Bölüm ${episode.episodeNumber}`}
                                        </h4>
                                        {episode.description && (
                                          <p className="text-sm text-gray-400 mt-1">
                                            {episode.description}
                                          </p>
                                        )}
                                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                                          {episode.duration && <span>{episode.duration} dk</span>}
                                          {episode.airDate && (
                                            <span>{new Date(episode.airDate).toLocaleDateString('tr-TR')}</span>
                                          )}
                                        </div>
                                      </div>
                                      {isWatched && watchedEpisode.rating && (
                                        <div className="flex items-center gap-1 text-yellow-500">
                                          <Star className="h-4 w-4 fill-current" />
                                          <span className="font-bold">{watchedEpisode.rating}</span>
                                        </div>
                                      )}
                                    </div>
                                    {isWatched && (
                                      <div className="mt-2 text-xs text-gray-400">
                                        {watchedEpisode.watchedAt && (
                                          <p>
                                            İzlenme:{' '}
                                            {format(new Date(watchedEpisode.watchedAt), 'dd/MM/yyyy HH:mm')}
                                          </p>
                                        )}
                                        {watchedEpisode.watchedWith && (
                                          <p>Kiminle: {watchedEpisode.watchedWith}</p>
                                        )}
                                        {watchedEpisode.note && (
                                          <p className="mt-1 text-gray-300">{watchedEpisode.note}</p>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Episode Watch Modal */}
        {showEpisodeModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
              <h3 className="text-xl font-bold text-white mb-4">
                Sezon {showEpisodeModal.season} - {showEpisodeModal.title}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">İzlenme Tarihi</label>
                  <input
                    type="datetime-local"
                    value={episodeForm.watchedAt}
                    onChange={(e) => setEpisodeForm({ ...episodeForm, watchedAt: e.target.value })}
                    className="w-full bg-gray-700 border-gray-600 text-white rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Kiminle İzledin?</label>
                  <input
                    type="text"
                    placeholder="İsteğe bağlı"
                    value={episodeForm.watchedWith}
                    onChange={(e) => setEpisodeForm({ ...episodeForm, watchedWith: e.target.value })}
                    className="w-full bg-gray-700 border-gray-600 text-white rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Puan (0-10)</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    placeholder="İsteğe bağlı"
                    value={episodeForm.rating}
                    onChange={(e) => setEpisodeForm({ ...episodeForm, rating: e.target.value })}
                    className="w-full bg-gray-700 border-gray-600 text-white rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Not</label>
                  <Textarea
                    placeholder="İsteğe bağlı"
                    value={episodeForm.note}
                    onChange={(e) => setEpisodeForm({ ...episodeForm, note: e.target.value })}
                    className="bg-gray-700 border-gray-600 text-white"
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <Button
                  onClick={() => {
                    setShowEpisodeModal(null);
                    setEpisodeForm({
                      watchedAt: new Date().toISOString().slice(0, 16),
                      watchedWith: '',
                      note: '',
                      rating: '',
                    });
                  }}
                  className="flex-1 bg-gray-600 hover:bg-gray-700"
                >
                  İptal
                </Button>
                <Button
                  onClick={handleWatchEpisode}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  Kaydet
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Yorumlar */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Yorumlar ({comments.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Yorum Formu */}
            {user && (
              <form onSubmit={handleCommentSubmit} className="mb-6">
                <Textarea
                  placeholder="Yorumunuzu yazın..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white mb-2"
                  rows={3}
                />
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="spoiler"
                      checked={isSpoiler}
                      onCheckedChange={setIsSpoiler}
                    />
                    <label htmlFor="spoiler" className="text-sm text-gray-400 cursor-pointer">
                      <AlertTriangle className="inline h-4 w-4 mr-1" />
                      Spoiler içerir
                    </label>
                  </div>
                  <Button type="submit" className="bg-red-600 hover:bg-red-700">
                    Yorum Yap
                  </Button>
                </div>
              </form>
            )}

            {/* Yorum Listesi */}
            <div className="space-y-4">
              {comments.length === 0 ? (
                <p className="text-gray-400 text-center py-8">Henüz yorum yapılmamış</p>
              ) : (
                comments.map((comment) => (
                  <div
                    key={comment._id}
                    className="bg-gray-700/50 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <span className="font-semibold text-white">
                          {comment.userId?.username || 'Anonim'}
                        </span>
                        <span className="text-sm text-gray-400 ml-2">
                          {format(new Date(comment.createdAt), 'dd/MM/yyyy HH:mm')}
                        </span>
                      </div>
                      {user && (user.userId === comment.userId?._id || user.role === 'admin') && (
                        <button
                          onClick={() => handleDeleteComment(comment._id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    {comment.spoiler && (
                      <span className="text-xs bg-yellow-900 text-yellow-300 px-2 py-1 rounded mb-2 inline-block">
                        ⚠️ SPOILER
                      </span>
                    )}
                    <p className="text-gray-300 mb-2">{comment.comment}</p>
                    <button
                      onClick={() => handleLikeComment(comment._id)}
                      className={`flex items-center gap-1 text-sm ${
                        user && comment.likes.includes(user.userId)
                          ? 'text-red-400'
                          : 'text-gray-400 hover:text-red-400'
                      }`}
                    >
                      <Heart
                        className={`h-4 w-4 ${
                          user && comment.likes.includes(user.userId) ? 'fill-current' : ''
                        }`}
                      />
                      {comment.likes.length}
                    </button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
