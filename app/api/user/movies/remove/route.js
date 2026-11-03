import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { LibraryMovie } from '@/models/Movie';
import { verifyAuth } from '@/lib/auth';

// DELETE - Listeden film çıkar
export async function DELETE(request) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Giriş yapmalısınız' },
        { status: 401 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const movieId = searchParams.get('movieId');

    if (!movieId) {
      return NextResponse.json(
        { success: false, message: 'Film ID gerekli' },
        { status: 400 }
      );
    }

    const userData = await User.findById(user.userId);

    const movieIndex = userData.watchedMovies.findIndex(
      wm => wm.movieId.toString() === movieId
    );

    if (movieIndex === -1) {
      return NextResponse.json(
        { success: false, message: 'Film listenizde değil' },
        { status: 404 }
      );
    }

    // Filmi çıkar
    userData.watchedMovies.splice(movieIndex, 1);
    await userData.save();

    // Film istatistiklerini güncelle
    const movie = await LibraryMovie.findById(movieId);
    if (movie) {
      movie.watchedByCount = Math.max(0, movie.watchedByCount - 1);
      await movie.save();
      await movie.calculateAverageRating();
    }

    return NextResponse.json({
      success: true,
      message: 'Film listenizden çıkarıldı',
    });
  } catch (error) {
    console.error('Film çıkarma hatası:', error);
    return NextResponse.json(
      { success: false, message: 'Film çıkarılamadı' },
      { status: 500 }
    );
  }
}
