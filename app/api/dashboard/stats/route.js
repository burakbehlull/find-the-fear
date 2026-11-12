import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { LibraryMovie } from '@/models/Movie';
import MovieSuggestion from '@/models/MovieSuggestion';
import { verifyAuth } from '@/lib/auth';

// GET - Dashboard istatistikleri
export async function GET(request) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Giriş yapmalısınız' },
        { status: 401 }
      );
    }

    await connectDB();

    const userData = await User.findById(user.userId)
      .populate('watchedMovies.movieId')
      .lean();

    if (!userData) {
      return NextResponse.json(
        { success: false, message: 'Kullanıcı bulunamadı' },
        { status: 404 }
      );
    }

    // Kullanıcı istatistikleri
    const totalMovies = userData.watchedMovies.length;
    const totalFilms = userData.watchedMovies.filter(m => m.movieId?.type === 'film').length;
    const totalSeries = userData.watchedMovies.filter(m => m.movieId?.type === 'series').length;
    const totalEpisodesWatched = userData.watchedMovies.reduce(
      (sum, m) => sum + (m.totalWatchedEpisodes || 0),
      0
    );
    const ratedMovies = userData.watchedMovies.filter(m => m.rating !== null).length;
    const averageRating = ratedMovies > 0
      ? userData.watchedMovies.reduce((sum, m) => sum + (m.rating || 0), 0) / ratedMovies
      : null;

    // Favori tür
    const genreCount = {};
    userData.watchedMovies.forEach(movie => {
      if (movie.movieId && movie.movieId.genres) {
        movie.movieId.genres.forEach(genre => {
          genreCount[genre] = (genreCount[genre] || 0) + 1;
        });
      }
    });
    const sortedGenres = Object.entries(genreCount).sort((a, b) => b[1] - a[1]);
    const favoriteGenre = sortedGenres.length > 0 ? sortedGenres[0][0] : null;

    // Son eklenen filmler
    const recentMovies = userData.watchedMovies
      .sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt))
      .slice(0, 5);

    // Admin istatistikleri
    let adminStats = null;
    if (user && user.isAdmin) {
      const totalLibraryMovies = await LibraryMovie.countDocuments({ status: 'approved' });
      const totalUsers = await User.countDocuments();
      const pendingSuggestions = await MovieSuggestion.countDocuments({ status: 'pending' });

      adminStats = {
        totalLibraryMovies,
        totalUsers,
        pendingSuggestions,
      };
    }

    return NextResponse.json({
      success: true,
      stats: {
        totalMovies,
        totalFilms,
        totalSeries,
        totalEpisodesWatched,
        ratedMovies,
        averageRating: averageRating ? averageRating.toFixed(1) : null,
        favoriteGenre,
        recentMovies,
      },
      adminStats,
    });
  } catch (error) {
    console.error('İstatistik hatası:', error);
    return NextResponse.json(
      { success: false, message: 'İstatistikler getirilemedi' },
      { status: 500 }
    );
  }
}
