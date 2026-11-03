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
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Yetkisiz erişim' },
        { status: 403 }
      );
    }

    await connectDB();

    const body = await request.json();
    const { suggestionId, action, adminNote } = body; // action: 'approve' veya 'reject'

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

      // Filmi kütüphaneye ekle
      const movie = await LibraryMovie.create({
        title: suggestion.title,
        slug,
        year: suggestion.year,
        genres: suggestion.genres,
        description: suggestion.description,
        director: suggestion.director,
        poster: suggestion.poster,
        imdbLink: suggestion.imdbLink,
        addedBy: suggestion.suggestedBy,
        status: 'approved',
      });

      suggestion.status = 'approved';
      suggestion.reviewedBy = user.userId;
      suggestion.reviewedAt = new Date();
      suggestion.adminNote = adminNote || '';
      await suggestion.save();

      return NextResponse.json({
        success: true,
        message: 'Film kütüphaneye eklendi',
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
