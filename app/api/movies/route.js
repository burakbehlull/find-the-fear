import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { getUserFromRequest } from '@/lib/auth';

// Kullanıcının filmlerini getir
export async function GET(request) {
  try {
    await dbConnect();
    
    const userId = getUserFromRequest(request);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Giriş yapmanız gerekli' },
        { status: 401 }
      );
    }

    const user = await User.findById(userId);

    if (!user) {
      return NextResponse.json(
        { error: 'Kullanıcı bulunamadı' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      movies: user.watchedMovies || [],
    });
  } catch (error) {
    console.error('Get movies error:', error);
    return NextResponse.json(
      { error: 'Filmler alınamadı' },
      { status: 500 }
    );
  }
}

// Kullanıcıya film ekle
export async function POST(request) {
  try {
    await dbConnect();
    
    const userId = getUserFromRequest(request);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Giriş yapmanız gerekli' },
        { status: 401 }
      );
    }

    const { title, year, genre, description } = await request.json();

    if (!title || !year || !genre || !description) {
      return NextResponse.json(
        { error: 'Tüm alanlar gerekli' },
        { status: 400 }
      );
    }

    const user = await User.findById(userId);

    if (!user) {
      return NextResponse.json(
        { error: 'Kullanıcı bulunamadı' },
        { status: 404 }
      );
    }

    // Film zaten var mı kontrol et
    const movieExists = user.watchedMovies.some(
      (movie) => movie.title.toLowerCase() === title.toLowerCase()
    );

    if (movieExists) {
      return NextResponse.json(
        { error: 'Bu film zaten listenizde' },
        { status: 400 }
      );
    }

    // Filmi ekle
    user.watchedMovies.push({
      title,
      year,
      genre,
      description,
    });

    await user.save();

    return NextResponse.json({
      success: true,
      movie: user.watchedMovies[user.watchedMovies.length - 1],
    });
  } catch (error) {
    console.error('Add movie error:', error);
    return NextResponse.json(
      { error: 'Film eklenemedi' },
      { status: 500 }
    );
  }
}
