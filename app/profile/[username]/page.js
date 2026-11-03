'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Film, Star, Calendar, Eye, EyeOff, Trash2, MessageSquare, Edit2, X } from 'lucide-react';
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

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingMovie, setEditingMovie] = useState(null);
  const [commentingMovie, setCommentingMovie] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [movieComments, setMovieComments] = useState({});

  useEffect(() => {
    fetchData();
  }, [params.username]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Mevcut kullanıcıyı al
      const userRes = await fetch('/api/auth/me');
      if (userRes.ok) {
        const userData = await userRes.json();
        setCurrentUser(userData.user);
      }

      // Profil bilgisini al
      const profileRes = await fetch(`/api/profile/${params.username}`);
      const profileData = await profileRes.json();

      if (profileData.success) {
        setProfile(profileData.profile);

        // Her film için yorumları yükle
        const commentsPromises = profileData.profile.movies
          .filter(movie => movie.movieId) // Sadece mevcut filmleri işle
          .map(async (movie) => {
            if (movie.isPublic || profileData.profile.isOwnProfile) {
              const res = await fetch(
                `/api/profile/comments?profileUserId=${profileData.profile._id}&movieId=${movie.movieId._id}`
              );
              const data = await res.json();
              return { movieId: movie.movieId._id, comments: data.success ? data.comments : [] };
            }
            return { movieId: movie.movieId._id, comments: [] };
          });

        const commentsResults = await Promise.all(commentsPromises);
        const commentsMap = {};
        commentsResults.forEach((result) => {
          commentsMap[result.movieId] = result.comments;
        });
        setMovieComments(commentsMap);
      }
    } catch (error) {
      console.error('Profil yükleme hatası:', error);
      toast.error('Profil yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMovie = async (movieId) => {
    if (!confirm('Bu filmi listenizden çıkarmak istediğinizden emin misiniz?')) return;

    try {
      const res = await fetch(`/api/user/movies/remove?movieId=${movieId}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (data.success) {
        toast.success('Film listenizden çıkarıldı');
        fetchData();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error('Film çıkarma hatası:', error);
      toast.error('Film çıkarılırken hata oluştu');
    }
  };

  const handleTogglePrivacy = async (movieId, currentIsPublic) => {
    try {
      const res = await fetch('/api/user/movies/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ movieId, isPublic: !currentIsPublic }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(currentIsPublic ? 'Film gizlendi' : 'Film herkese açık yapıldı');
        fetchData();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error('Gizlilik güncelleme hatası:', error);
      toast.error('İşlem başarısız');
    }
  };

  const handleUpdateMovie = async (movieId, updates) => {
    try {
      const res = await fetch('/api/user/movies/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ movieId, ...updates }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success('Film güncellendi');
        setEditingMovie(null);
        fetchData();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error('Film güncelleme hatası:', error);
      toast.error('Film güncellenirken hata oluştu');
    }
  };

  const handleCommentSubmit = async (profileUserId, movieId) => {
    if (!newComment.trim()) {
      toast.error('Yorum boş olamaz');
      return;
    }

    try {
      const res = await fetch('/api/profile/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileUserId,
          movieId,
          comment: newComment,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success('Yorum eklendi!');
        setNewComment('');
        setCommentingMovie(null);
        fetchData();
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
      const res = await fetch(`/api/profile/comments?commentId=${commentId}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (data.success) {
        toast.success('Yorum silindi');
        fetchData();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error('Yorum silme hatası:', error);
      toast.error('Yorum silinirken hata oluştu');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-red-950 pt-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-400">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-red-950 pt-20">
        <div className="text-center">
          <p className="text-gray-400 text-xl">Kullanıcı bulunamadı</p>
          <Link href="/dashboard">
            <Button className="mt-4 bg-red-600 hover:bg-red-700">Dashboard'a Dön</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-red-950 pt-20 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Profil Header */}
        <Card className="bg-gray-800/50 border-gray-700 mb-6">
          <CardContent className="p-6">
            <div className="flex items-start gap-6">
              <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center text-4xl">
                {profile.profileImage ? (
                  <img
                    src={profile.profileImage}
                    alt={profile.username}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-gray-300">{profile.username[0].toUpperCase()}</span>
                )}
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-white mb-2">@{profile.username}</h1>
                {profile.bio && <p className="text-gray-300 mb-3">{profile.bio}</p>}
                <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                  <div>
                    <span className="font-semibold text-white">{profile.movieCount}</span> Film
                  </div>
                  {profile.favoriteGenre && (
                    <div>
                      Favori Tür: <span className="font-semibold text-white">{GENRE_NAMES[profile.favoriteGenre]}</span>
                    </div>
                  )}
                  {profile.createdAt && (
                    <div>
                      Katılma: <span className="font-semibold text-white">{format(new Date(profile.createdAt), 'MMMM yyyy')}</span>
                    </div>
                  )}
                </div>
              </div>
              {profile.isOwnProfile && (
                <Link href="/settings">
                  <Button variant="outline" className="bg-gray-700 border-gray-600 hover:bg-gray-600">
                    <Edit2 className="h-4 w-4 mr-2" />
                    Hesap Ayarları
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Film Listesi */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">
              {profile.isOwnProfile ? 'İzlediğim Filmler' : `${profile.username}'in İzlediği Filmler`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {profile.movies.length === 0 ? (
              <p className="text-gray-400 text-center py-8">Henüz film eklenmemiş</p>
            ) : profile.movies.filter(movie => movie.movieId).length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400">Listedeki tüm filmler silinmiş</p>
                {profile.isOwnProfile && (
                  <Link href="/library">
                    <Button className="mt-4 bg-red-600 hover:bg-red-700">
                      Kütüphaneye Git
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {profile.movies.filter(movie => movie.movieId).map((movie) => (
                  <div key={movie._id} className="bg-gray-700/50 rounded-lg p-4">
                    <div className="flex gap-4">
                      {/* Poster */}
                      <Link href={`/library/${movie.movieId.slug}`}>
                        <div className="w-24 h-36 bg-gray-600 rounded overflow-hidden flex-shrink-0">
                          {movie.movieId.poster ? (
                            <img
                              src={movie.movieId.poster}
                              alt={movie.movieId.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-500">
                              <Film className="h-8 w-8" />
                            </div>
                          )}
                        </div>
                      </Link>

                      {/* Film Bilgileri */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <Link href={`/library/${movie.movieId.slug}`}>
                              <h3 className="text-xl font-bold text-white hover:text-red-400">
                                {movie.movieId.title}
                              </h3>
                            </Link>
                            <p className="text-sm text-gray-400">
                              {movie.movieId.year} • {movie.movieId.genres?.map(g => GENRE_NAMES[g]).join(', ')}
                            </p>
                          </div>
                          {profile.isOwnProfile && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleTogglePrivacy(movie.movieId._id, movie.isPublic)}
                                className="text-gray-400 hover:text-white"
                                title={movie.isPublic ? 'Gizle' : 'Herkese Aç'}
                              >
                                {movie.isPublic ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                              </button>
                              <button
                                onClick={() => setEditingMovie(movie)}
                                className="text-blue-400 hover:text-blue-300"
                              >
                                <Edit2 className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => handleRemoveMovie(movie.movieId._id)}
                                className="text-red-400 hover:text-red-300"
                              >
                                <Trash2 className="h-5 w-5" />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Puan ve Notlar */}
                        <div className="flex flex-wrap gap-3 mb-2">
                          {movie.rating && (
                            <div className="flex items-center gap-1 text-yellow-500">
                              <Star className="h-4 w-4 fill-current" />
                              <span className="font-bold">{movie.rating}/10</span>
                            </div>
                          )}
                        </div>

                        {/* Not */}
                        {movie.note && (
                          <p className="text-gray-300 text-sm mb-2 italic">"{movie.note}"</p>
                        )}

                        {/* Düzenleme Formu */}
                        {editingMovie && editingMovie._id === movie._id && (
                          <div className="mt-4 bg-gray-600/50 p-4 rounded space-y-3">
                            <div>
                              <label className="text-sm text-gray-300 mb-1 block">Puan (0-10)</label>
                              <Input
                                type="number"
                                min="0"
                                max="10"
                                defaultValue={movie.rating || ''}
                                onChange={(e) =>
                                  setEditingMovie({ ...editingMovie, rating: parseFloat(e.target.value) })
                                }
                                className="bg-gray-700 border-gray-600 text-white"
                              />
                            </div>
                            <div>
                              <label className="text-sm text-gray-300 mb-1 block">Notunuz</label>
                              <Textarea
                                defaultValue={movie.note || ''}
                                onChange={(e) =>
                                  setEditingMovie({ ...editingMovie, note: e.target.value })
                                }
                                className="bg-gray-700 border-gray-600 text-white"
                                rows={2}
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button
                                onClick={() =>
                                  handleUpdateMovie(movie.movieId._id, {
                                    rating: editingMovie.rating,
                                    note: editingMovie.note,
                                  })
                                }
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                              >
                                Kaydet
                              </Button>
                              <Button
                                onClick={() => setEditingMovie(null)}
                                size="sm"
                                variant="outline"
                                className="bg-gray-700 border-gray-600"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Yorumlar */}
                        {movieComments[movie.movieId._id] && movieComments[movie.movieId._id].length > 0 && (
                          <div className="mt-4 space-y-2">
                            <h4 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                              <MessageSquare className="h-4 w-4" />
                              Yorumlar ({movieComments[movie.movieId._id].length})
                            </h4>
                            {movieComments[movie.movieId._id].map((comment) => (
                              <div key={comment._id} className="bg-gray-600/50 p-3 rounded text-sm">
                                <div className="flex items-start justify-between mb-1">
                                  <span className="font-semibold text-white">
                                    {comment.commenterId.username}
                                  </span>
                                  {currentUser &&
                                    (currentUser.userId === comment.commenterId._id ||
                                      currentUser.userId === profile._id ||
                                      currentUser.role === 'admin') && (
                                      <button
                                        onClick={() => handleDeleteComment(comment._id)}
                                        className="text-red-400 hover:text-red-300"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </button>
                                    )}
                                </div>
                                <p className="text-gray-300">{comment.comment}</p>
                                <span className="text-xs text-gray-500">
                                  {format(new Date(comment.createdAt), 'dd/MM/yyyy HH:mm')}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Yorum Ekleme */}
                        {currentUser && !profile.isOwnProfile && movie.isPublic && (
                          <div className="mt-3">
                            {commentingMovie === movie.movieId._id ? (
                              <div className="space-y-2">
                                <Textarea
                                  value={newComment}
                                  onChange={(e) => setNewComment(e.target.value)}
                                  placeholder="Yorumunuzu yazın..."
                                  className="bg-gray-700 border-gray-600 text-white"
                                  rows={2}
                                />
                                <div className="flex gap-2">
                                  <Button
                                    onClick={() => handleCommentSubmit(profile._id, movie.movieId._id)}
                                    size="sm"
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Gönder
                                  </Button>
                                  <Button
                                    onClick={() => {
                                      setCommentingMovie(null);
                                      setNewComment('');
                                    }}
                                    size="sm"
                                    variant="outline"
                                    className="bg-gray-700 border-gray-600"
                                  >
                                    İptal
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <Button
                                onClick={() => setCommentingMovie(movie.movieId._id)}
                                size="sm"
                                variant="outline"
                                className="bg-gray-700 border-gray-600 hover:bg-gray-600"
                              >
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Yorum Yap
                              </Button>
                            )}
                          </div>
                        )}
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
