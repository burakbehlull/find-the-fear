import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { LibraryMovie } from '@/models/Movie';
import { verifyAuth } from '@/lib/auth';

export async function POST(request) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Giriş yapmalısınız' },
        { status: 401 }
      );
    }

    const { movieId, watchedAt, watchedWith, note, rating } = await request.json();

    if (!movieId) {
      return NextResponse.json(
        { success: false, message: 'Film ID gerekli' },
        { status: 400 }
      );
    }

    await connectDB();

    const userData = await User.findById(user.userId);
    const movie = await LibraryMovie.findById(movieId);

    if (!movie) {
      return NextResponse.json(
        { success: false, message: 'Film bulunamadı' },
        { status: 404 }
      );
    }

    // Kaydedilenlerden çıkar
    userData.savedMovies = userData.savedMovies.filter(
      (m) => m.movieId.toString() !== movieId
    );

    // İzlenenler listesinde var mı kontrol et
    const existingIndex = userData.watchedMovies.findIndex(
      (m) => m.movieId.toString() === movieId
    );

    if (existingIndex >= 0) {
      // Güncelle
      userData.watchedMovies[existingIndex].watchedAt = watchedAt || new Date();
      if (watchedWith && Array.isArray(watchedWith)) {
        userData.watchedMovies[existingIndex].watchedWith = watchedWith;
      }
      if (note) userData.watchedMovies[existingIndex].note = note;
      if (rating !== null && rating !== undefined) {
        userData.watchedMovies[existingIndex].rating = rating;
      }
    } else {
      // Yeni ekle
      userData.watchedMovies.push({
        movieId,
        watchedAt: watchedAt || new Date(),
        watchedWith: watchedWith || [],
        note: note || '',
        rating: rating || null,
      });
    }

    await userData.save();

    // Film istatistiklerini güncelle
    await movie.calculateAverageRating();

    return NextResponse.json({
      success: true,
      message: 'Film izlendi olarak işaretlendi',
    });
  } catch (error) {
    console.error('Mark watched error:', error);
    return NextResponse.json(
      { success: false, message: 'İşlem başarısız' },
      { status: 500 }
    );
  }
}
