import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { verifyAuth } from '@/lib/auth';

// GET - Kullanıcı profilini getir
export async function GET(request, { params }) {
  try {
    await connectDB();

    const { username } = params;
    const currentUser = await verifyAuth(request);

    const userData = await User.findOne({ username })
      .populate('watchedMovies.movieId')
      .select('-password')
      .lean();

    if (!userData) {
      return NextResponse.json(
        { success: false, message: 'Kullanıcı bulunamadı' },
        { status: 404 }
      );
    }

    // Kendi profilini görüntülüyorsa veya filmler herkese açıksa tüm filmleri göster
    const isOwnProfile = currentUser && currentUser.userId === userData._id.toString();
    const showAllMovies = isOwnProfile || userData.privacy.showMovies;

    let filteredMovies = userData.watchedMovies;

    if (!isOwnProfile) {
      // Başkasının profiliyse sadece public filmleri göster
      filteredMovies = userData.watchedMovies.filter(movie => movie.isPublic);
    }

    // Dizi için izleme durumunu hesapla
    const moviesWithProgress = filteredMovies.map(movie => {
      if (movie.movieId && movie.movieId.type === 'series' && movie.watchedEpisodes && movie.watchedEpisodes.length > 0) {
        // Toplam izlenen bölüm sayısı
        const totalWatchedEpisodes = movie.watchedEpisodes.length;
        
        // Son izlenen bölümü bul (en yüksek sezon/bölüm)
        const sortedEpisodes = [...movie.watchedEpisodes].sort((a, b) => {
          if (a.season !== b.season) return b.season - a.season;
          return b.episode - a.episode;
        });
        const lastWatchedEpisode = sortedEpisodes[0];
        
        // Tüm bölümler izlendiyse kontrol et
        const totalEpisodes = movie.movieId.totalEpisodes || 0;
        const isCompleted = totalEpisodes > 0 && totalWatchedEpisodes >= totalEpisodes;
        
        return {
          ...movie,
          totalWatchedEpisodes,
          currentSeason: lastWatchedEpisode.season,
          currentEpisode: lastWatchedEpisode.episode,
          isCompleted,
        };
      }
      return {
        ...movie,
        totalWatchedEpisodes: movie.watchedEpisodes?.length || 0,
      };
    });

    // Favori türü hesapla
    let favoriteGenre = userData.favoriteGenre;
    if (!favoriteGenre && filteredMovies.length > 0) {
      const genreCount = {};
      filteredMovies.forEach(movie => {
        if (movie.movieId && movie.movieId.genres) {
          movie.movieId.genres.forEach(genre => {
            genreCount[genre] = (genreCount[genre] || 0) + 1;
          });
        }
      });
      const sortedGenres = Object.entries(genreCount).sort((a, b) => b[1] - a[1]);
      if (sortedGenres.length > 0) {
        favoriteGenre = sortedGenres[0][0];
      }
    }

    return NextResponse.json({
      success: true,
      profile: {
        _id: userData._id,
        username: userData.username,
        bio: userData.bio,
        profileImage: userData.profileImage,
        favoriteGenre: favoriteGenre || '',
        privacy: userData.privacy,
        createdAt: userData.createdAt,
        isOwnProfile,
        movieCount: filteredMovies.length,
        movies: moviesWithProgress,
      },
    });
  } catch (error) {
    console.error('Profil getirme hatası:', error);
    return NextResponse.json(
      { success: false, message: 'Profil getirilemedi' },
      { status: 500 }
    );
  }
}
