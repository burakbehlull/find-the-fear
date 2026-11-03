import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { verifyAuth } from '@/lib/auth';

// GET - Kullanıcının kaydedilmiş filmlerini getir
export async function GET(request) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Giriş yapmalısınız' },
        { status: 401 }
      );
    }

    await dbConnect();

    const userData = await User.findById(user.userId)
      .populate({
        path: 'savedMovies.movieId',
        select: 'title year slug poster genres description director imdbRating',
      })
      .select('savedMovies');

    if (!userData) {
      return NextResponse.json(
        { success: false, message: 'Kullanıcı bulunamadı' },
        { status: 404 }
      );
    }

    // Filter out any null movieIds (deleted movies)
    const validSavedMovies = (userData.savedMovies || []).filter(
      (movie) => movie.movieId != null
    );

    return NextResponse.json({
      success: true,
      savedMovies: validSavedMovies,
    });
  } catch (error) {
    console.error('Get saved movies error:', error);
    return NextResponse.json(
      { success: false, message: 'Filmler getirilemedi' },
      { status: 500 }
    );
  }
}

// POST - Film kaydet (watchlist'e ekle)
export async function POST(request) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Giriş yapmalısınız' },
        { status: 401 }
      );
    }

    const { movieId } = await request.json();
    if (!movieId) {
      return NextResponse.json(
        { success: false, message: 'Film ID gerekli' },
        { status: 400 }
      );
    }

    await dbConnect();

    const userData = await User.findById(user.userId);

    // Zaten kaydedilmiş mi?
    const alreadySaved = userData.savedMovies.some(
      (m) => m.movieId.toString() === movieId
    );

    if (alreadySaved) {
      return NextResponse.json(
        { success: false, message: 'Film zaten kayıtlı' },
        { status: 400 }
      );
    }

    // Kaydet
    userData.savedMovies.push({
      movieId,
      addedAt: new Date(),
    });

    await userData.save();

    return NextResponse.json({
      success: true,
      message: 'Film izleneceklere eklendi',
    });
  } catch (error) {
    console.error('Save movie error:', error);
    return NextResponse.json(
      { success: false, message: 'Film kaydedilemedi' },
      { status: 500 }
    );
  }
}

// DELETE - Kaydedilmiş filmi sil
export async function DELETE(request) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Giriş yapmalısınız' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const movieId = searchParams.get('movieId');

    if (!movieId) {
      return NextResponse.json(
        { success: false, message: 'Film ID gerekli' },
        { status: 400 }
      );
    }

    await dbConnect();

    const userData = await User.findById(user.userId);
    userData.savedMovies = userData.savedMovies.filter(
      (m) => m.movieId.toString() !== movieId
    );

    await userData.save();

    return NextResponse.json({
      success: true,
      message: 'Film izleneceklerden çıkarıldı',
    });
  } catch (error) {
    console.error('Remove saved movie error:', error);
    return NextResponse.json(
      { success: false, message: 'Film silinemedi' },
      { status: 500 }
    );
  }
}
