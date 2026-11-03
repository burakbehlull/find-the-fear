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
        movies: filteredMovies,
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
