import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { LibraryMovie } from '@/models/Movie';
import { verifyAuth } from '@/lib/auth';

// PATCH - Film bilgilerini güncelle (puan, etiket, not, gizlilik)
export async function PATCH(request) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Giriş yapmalısınız' },
        { status: 401 }
      );
    }

    await connectDB();

    const body = await request.json();
    const { movieId, rating, tags, note, isPublic } = body;

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

    const watchedMovie = userData.watchedMovies[movieIndex];

    // Puanı güncelle
    if (rating !== undefined) {
      if (rating < 0 || rating > 10) {
        return NextResponse.json(
          { success: false, message: 'Puan 0-10 arasında olmalı' },
          { status: 400 }
        );
      }
      watchedMovie.rating = rating;
    }

    // Etiketleri güncelle
    if (tags !== undefined) {
      watchedMovie.tags = tags;
    }

    // Notu güncelle
    if (note !== undefined) {
      watchedMovie.note = note;
    }

    // Gizliliği güncelle
    if (isPublic !== undefined) {
      watchedMovie.isPublic = isPublic;
    }

    await userData.save();

    // Puan güncellendiyse ortalamayı yeniden hesapla
    if (rating !== undefined) {
      const movie = await LibraryMovie.findById(movieId);
      if (movie) {
        await movie.calculateAverageRating();
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Film güncellendi',
      movie: watchedMovie,
    });
  } catch (error) {
    console.error('Film güncelleme hatası:', error);
    return NextResponse.json(
      { success: false, message: 'Film güncellenemedi' },
      { status: 500 }
    );
  }
}
