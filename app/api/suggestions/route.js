import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import MovieSuggestion from '@/models/MovieSuggestion';
import { verifyAuth } from '@/lib/auth';

// GET - Önerileri getir
export async function GET(request) {
  try {
    const user = await verifyAuth(request);

    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // pending, approved, rejected

    let query = {};

    // Admin tüm önerileri görebilir
    if (user && user.isAdmin) {
      if (status) {
        query.status = status;
      }
    } else if (user) {
      // Normal kullanıcı sadece kendi önerilerini görebilir
      query.suggestedBy = user.userId;
      if (status) {
        query.status = status;
      }
    } else {
      return NextResponse.json(
        { success: false, message: 'Giriş yapmalısınız' },
        { status: 401 }
      );
    }

    const suggestions = await MovieSuggestion.find(query)
      .populate('suggestedBy', 'username')
      .populate('reviewedBy', 'username')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      suggestions,
      count: suggestions.length,
    });
  } catch (error) {
    console.error('Öneri listesi hatası:', error);
    return NextResponse.json(
      { success: false, message: 'Öneriler getirilemedi' },
      { status: 500 }
    );
  }
}

// POST - Yeni film önerisi oluştur
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
    const { title, year, genres, description, director, poster, imdbLink, type } = body;

    if (!title || !year || !genres || genres.length === 0 || !description) {
      return NextResponse.json(
        { success: false, message: 'Gerekli alanları doldurun' },
        { status: 400 }
      );
    }

    const suggestion = await MovieSuggestion.create({
      title,
      year,
      genres,
      description,
      director: director || '',
      poster: poster || '',
      imdbLink: imdbLink || '',
      type: type || 'film', // İçerik tipi ekle
      suggestedBy: user.userId,
    });

    const contentTypeText = type === 'series' ? 'Dizi' : 'Film';
    
    return NextResponse.json({
      success: true,
      message: `${contentTypeText} öneriniz gönderildi. Admin onayından sonra kütüphaneye eklenecek.`,
      suggestion,
    }, { status: 201 });
  } catch (error) {
    console.error('Öneri oluşturma hatası:', error);
    return NextResponse.json(
      { success: false, message: 'Öneri gönderilemedi' },
      { status: 500 }
    );
  }
}
