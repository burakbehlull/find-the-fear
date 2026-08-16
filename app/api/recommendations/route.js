import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { getUserFromRequest } from '@/lib/auth';
import { getMovieRecommendations } from '@/lib/gemini';

function normalizeTitle(title) {
  return title
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\sğüşıöçĞÜŞİÖÇ]/g, '');
}

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

    const { useWatchHistory } = await request.json();

    const user = await User.findById(userId);

    if (!user) {
      return NextResponse.json(
        { error: 'Kullanıcı bulunamadı' },
        { status: 404 }
      );
    }

    const watchedMovies = user.watchedMovies || [];

    const recommendations = await getMovieRecommendations(
      watchedMovies,
      useWatchHistory
    );

    const watchedNormalized = watchedMovies.map(m => normalizeTitle(m.title));
    const filteredRecommendations = recommendations.filter(
      rec => !watchedNormalized.includes(normalizeTitle(rec.title))
    );

    return NextResponse.json({
      recommendations: filteredRecommendations,
      basedOnHistory: useWatchHistory,
    });
  } catch (error) {
    console.error('Recommendations error:', error);
    return NextResponse.json(
      { error: 'Öneriler alınamadı: ' + error.message },
      { status: 500 }
    );
  }
}
