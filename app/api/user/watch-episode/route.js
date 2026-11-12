import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

// Bölüm izlendi olarak işaretle
export async function POST(req) {
  try {
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, message: 'Giriş yapmalısınız' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ success: false, message: 'Geçersiz token' }, { status: 401 });
    }

    await connectDB();

    const { movieId, season, episode, watchedAt, watchedWith, rating, note } = await req.json();

    if (!movieId || !season || !episode) {
      return NextResponse.json(
        { success: false, message: 'Film ID, sezon ve bölüm numarası gerekli' },
        { status: 400 }
      );
    }

    // Kullanıcıyı bul
    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Kullanıcı bulunamadı' }, { status: 404 });
    }

    // Kullanıcının bu filmi/diziyi listesinde olup olmadığını kontrol et
    const movieInList = user.watchedMovies.find(
      (m) => m.movieId.toString() === movieId
    );

    if (!movieInList) {
      return NextResponse.json(
        { success: false, message: 'Bu dizi listenizde değil' },
        { status: 400 }
      );
    }

    // watchedEpisodes array'ini başlat (yoksa)
    if (!movieInList.watchedEpisodes) {
      movieInList.watchedEpisodes = [];
    }

    // Bu bölümü daha önce izlemiş mi kontrol et
    const existingEpisode = movieInList.watchedEpisodes.find(
      (e) => e.season === season && e.episode === episode
    );

    if (existingEpisode) {
      // Güncelle
      existingEpisode.watchedAt = watchedAt || new Date();
      existingEpisode.watchedWith = watchedWith;
      existingEpisode.rating = rating;
      existingEpisode.note = note;
    } else {
      // Yeni ekle
      movieInList.watchedEpisodes.push({
        season,
        episode,
        watchedAt: watchedAt || new Date(),
        watchedWith,
        rating,
        note,
      });
    }

    // totalWatchedEpisodes'u güncelle
    movieInList.totalWatchedEpisodes = movieInList.watchedEpisodes.length;

    await user.save();

    return NextResponse.json({
      success: true,
      message: 'Bölüm izlendi olarak işaretlendi',
    });
  } catch (error) {
    console.error('Watch episode error:', error);
    return NextResponse.json(
      { success: false, message: 'Sunucu hatası', error: error.message },
      { status: 500 }
    );
  }
}

// Bölümü izlenmedi olarak işaretle
export async function DELETE(req) {
  try {
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, message: 'Giriş yapmalısınız' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ success: false, message: 'Geçersiz token' }, { status: 401 });
    }

    await connectDB();

    const { movieId, season, episode } = await req.json();

    if (!movieId || !season || !episode) {
      return NextResponse.json(
        { success: false, message: 'Film ID, sezon ve bölüm numarası gerekli' },
        { status: 400 }
      );
    }

    // Kullanıcıyı bul
    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Kullanıcı bulunamadı' }, { status: 404 });
    }

    // Kullanıcının bu filmi/diziyi listesinde olup olmadığını kontrol et
    const movieInList = user.watchedMovies.find(
      (m) => m.movieId.toString() === movieId
    );

    if (!movieInList || !movieInList.watchedEpisodes) {
      return NextResponse.json(
        { success: false, message: 'Bölüm bulunamadı' },
        { status: 404 }
      );
    }

    // Bölümü çıkar
    movieInList.watchedEpisodes = movieInList.watchedEpisodes.filter(
      (e) => !(e.season === season && e.episode === episode)
    );

    // totalWatchedEpisodes'u güncelle
    movieInList.totalWatchedEpisodes = movieInList.watchedEpisodes.length;

    await user.save();

    return NextResponse.json({
      success: true,
      message: 'Bölüm izlenmedi olarak işaretlendi',
    });
  } catch (error) {
    console.error('Unwatch episode error:', error);
    return NextResponse.json(
      { success: false, message: 'Sunucu hatası', error: error.message },
      { status: 500 }
    );
  }
}
