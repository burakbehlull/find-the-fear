import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import MovieSuggestion from '@/models/MovieSuggestion';
import { LibraryMovie } from '@/models/Movie';
import { verifyAuth } from '@/lib/auth';
import slugify from 'slugify';

// POST - Öneriyi onayla veya reddet (sadece admin)
export async function POST(request) {
  try {
    const user = await verifyAuth(request);
    if (!user || !user.isAdmin) {
      return NextResponse.json(
        { success: false, message: 'Yetkisiz erişim' },
        { status: 403 }
      );
    }

    await connectDB();

    const body = await request.json();
    const { suggestionId, action, adminNote, seasons, seriesStatus } = body; // seasons ve seriesStatus dizi için

    if (!suggestionId || !action) {
      return NextResponse.json(
        { success: false, message: 'Öneri ID ve aksiyon gerekli' },
        { status: 400 }
      );
    }

    const suggestion = await MovieSuggestion.findById(suggestionId);

    if (!suggestion) {
      return NextResponse.json(
        { success: false, message: 'Öneri bulunamadı' },
        { status: 404 }
      );
    }

    if (suggestion.status !== 'pending') {
      return NextResponse.json(
        { success: false, message: 'Bu öneri zaten işlenmiş' },
        { status: 400 }
      );
    }

    if (action === 'approve') {
      // Slug oluştur
      const slug = slugify(`${suggestion.title} ${suggestion.year}`, {
        lower: true,
        strict: true,
        locale: 'tr'
      });

      // Dizi için sezon/bölüm hesaplamaları
      const contentData = {
        title: suggestion.title,
        slug,
        year: suggestion.year,
        genres: suggestion.genres,
        description: suggestion.description,
        director: suggestion.director,
        poster: suggestion.poster,
        imdbLink: suggestion.imdbLink,
        type: suggestion.type || 'film',
        addedBy: suggestion.suggestedBy,
        status: 'approved',
      };

      // Dizi ise sezon bilgilerini ekle
      if (suggestion.type === 'series') {
        if (!seasons || seasons.length === 0) {
          return NextResponse.json(
            { success: false, message: 'Dizi için sezon bilgileri gerekli' },
            { status: 400 }
          );
        }

        contentData.seasons = seasons;
        contentData.totalSeasons = seasons.length;
        contentData.totalEpisodes = seasons.reduce((sum, s) => sum + (s.episodeCount || 0), 0);
        contentData.seriesStatus = seriesStatus || 'completed';
      }

      // İçeriği kütüphaneye ekle
      const movie = await LibraryMovie.create(contentData);

      suggestion.status = 'approved';
      suggestion.reviewedBy = user.userId;
      suggestion.reviewedAt = new Date();
      suggestion.adminNote = adminNote || '';
      await suggestion.save();

      const contentTypeText = suggestion.type === 'series' ? 'Dizi' : 'Film';

      return NextResponse.json({
        success: true,
        message: `${contentTypeText} kütüphaneye eklendi`,
        movie,
      });
    } else if (action === 'reject') {
      suggestion.status = 'rejected';
      suggestion.reviewedBy = user.userId;
      suggestion.reviewedAt = new Date();
      suggestion.adminNote = adminNote || '';
      await suggestion.save();

      return NextResponse.json({
        success: true,
        message: 'Öneri reddedildi',
      });
    } else {
      return NextResponse.json(
        { success: false, message: 'Geçersiz aksiyon' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Öneri inceleme hatası:', error);
    return NextResponse.json(
      { success: false, message: 'İşlem başarısız' },
      { status: 500 }
    );
  }
}
