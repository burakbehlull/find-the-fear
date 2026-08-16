import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { getUserFromRequest } from '@/lib/auth';
import { getMovieRecommendations } from '@/lib/gemini';

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

    // Gemini AI'dan önerileri al
    const recommendations = await getMovieRecommendations(
      user.watchedMovies || [],
      useWatchHistory
    );

    // İzlenmiş filmleri tekrar önerme
    const watchedTitles = user.watchedMovies.map(m => m.title.toLowerCase());
    const filteredRecommendations = recommendations.filter(
      rec => !watchedTitles.includes(rec.title.toLowerCase())
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
