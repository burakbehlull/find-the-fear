import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { LibraryMovie } from '@/models/Movie';
import { verifyAuth } from '@/lib/auth';

// GET - Kullanıcının film listesini getir
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

    return NextResponse.json({
      success: true,
      movies: userData.watchedMovies,
    });
  } catch (error) {
    console.error('Film listesi hatası:', error);
    return NextResponse.json(
      { success: false, message: 'Film listesi getirilemedi' },
      { status: 500 }
    );
  }
}

// POST - Filme film ekle
export async function POST(request) {
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

    // Filmin var olduğunu kontrol et
    const movie = await LibraryMovie.findById(movieId);
    if (!movie) {
      return NextResponse.json(
        { success: false, message: 'Film bulunamadı' },
        { status: 404 }
      );
    }

    const userData = await User.findById(user.userId);

    // Zaten eklenmiş mi kontrol et
    const existingMovie = userData.watchedMovies.find(
      wm => wm.movieId.toString() === movieId
    );

    if (existingMovie) {
      return NextResponse.json(
        { success: false, message: 'Bu film zaten listenizde' },
        { status: 400 }
      );
    }

    // Filmi ekle
    userData.watchedMovies.push({
      movieId,
      rating: rating || null,
      tags: tags || [],
      note: note || '',
      isPublic: isPublic !== undefined ? isPublic : true,
    });

    await userData.save();

    // Film istatistiklerini güncelle
    movie.watchedByCount += 1;
    await movie.save();

    // Eğer puan verildiyse ortalamayı güncelle
    if (rating) {
      await movie.calculateAverageRating();
    }

    return NextResponse.json({
      success: true,
      message: 'Film listenize eklendi',
    }, { status: 201 });
  } catch (error) {
    console.error('Film ekleme hatası:', error);
    return NextResponse.json(
      { success: false, message: 'Film eklenemedi' },
      { status: 500 }
    );
  }
}
