import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

// Sezonu toplu izlendi olarak işaretle
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

    const { movieId, season, episodes } = await req.json();

    if (!movieId || !season || !episodes || !Array.isArray(episodes)) {
      return NextResponse.json(
        { success: false, message: 'Film ID, sezon ve bölüm listesi gerekli' },
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

    const now = new Date();

    // Her bir bölümü ekle (zaten izlenmemişse)
    episodes.forEach((episodeNumber) => {
      const alreadyWatched = movieInList.watchedEpisodes.some(
        (e) => e.season === season && e.episode === episodeNumber
      );

      if (!alreadyWatched) {
        movieInList.watchedEpisodes.push({
          season,
          episode: episodeNumber,
          watchedAt: now,
        });
      }
    });

    // totalWatchedEpisodes'u güncelle
    movieInList.totalWatchedEpisodes = movieInList.watchedEpisodes.length;

    await user.save();

    return NextResponse.json({
      success: true,
      message: 'Sezon bölümleri izlendi olarak işaretlendi',
    });
  } catch (error) {
    console.error('Watch season error:', error);
    return NextResponse.json(
      { success: false, message: 'Sunucu hatası', error: error.message },
      { status: 500 }
    );
  }
}
