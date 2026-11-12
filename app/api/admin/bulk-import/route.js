import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { LibraryMovie } from '@/models/Movie';
import { verifyAuth } from '@/lib/auth';
import slugify from 'slugify';

export async function POST(request) {
  try {
    // Admin kontrolü
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Giriş yapmalısınız' },
        { status: 401 }
      );
    }

    if (!user.isAdmin) {
      return NextResponse.json(
        { success: false, message: 'Bu işlem için yetkiniz yok' },
        { status: 403 }
      );
    }

    const { movies } = await request.json();

    // Validasyon
    if (!Array.isArray(movies) || movies.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Geçerli bir içerik listesi gönderilmedi' },
        { status: 400 }
      );
    }

    await dbConnect();

    const results = {
      total: movies.length,
      successful: 0,
      failed: 0,
      errors: [],
    };

    // Her bir içeriği işle
    for (let i = 0; i < movies.length; i++) {
      const contentData = movies[i];

      try {
        // Zorunlu alan kontrolü
        if (!contentData.title || !contentData.year || !contentData.genres || !Array.isArray(contentData.genres) || contentData.genres.length === 0 || !contentData.description) {
          results.failed++;
          results.errors.push(`İçerik ${i + 1}: Eksik zorunlu alanlar (title, year, genres, description)`);
          continue;
        }

        const type = contentData.type || 'film';

        // Dizi ise sezon kontrolü
        if (type === 'series') {
          if (!contentData.seasons || !Array.isArray(contentData.seasons) || contentData.seasons.length === 0) {
            results.failed++;
            results.errors.push(`İçerik ${i + 1} (${contentData.title}): Dizi için en az 1 sezon gerekli`);
            continue;
          }
        }

        // Slug oluştur
        const slug = slugify(`${contentData.title}-${contentData.year}`, {
          lower: true,
          strict: true,
        });

        // Aynı slug var mı kontrol et
        const existingContent = await LibraryMovie.findOne({ slug });
        if (existingContent) {
          results.failed++;
          results.errors.push(`İçerik ${i + 1} (${contentData.title}): Bu içerik zaten mevcut`);
          continue;
        }

        // Yeni içerik oluştur
        const newContentData = {
          title: contentData.title,
          year: parseInt(contentData.year),
          type: type,
          series: contentData.series || '',
          genres: contentData.genres,
          description: contentData.description,
          director: contentData.director || '',
          poster: contentData.poster || '',
          imdbId: contentData.imdbId || '',
          imdbRating: contentData.imdbRating ? parseFloat(contentData.imdbRating) : null,
          imdbLink: contentData.imdbLink || '',
          duration: type === 'film' && contentData.duration ? parseInt(contentData.duration) : null,
          slug,
          addedBy: user.userId,
          status: 'approved',
        };

        // Dizi ise seasons ekle
        if (type === 'series') {
          newContentData.seasons = contentData.seasons;
          newContentData.seriesStatus = contentData.seriesStatus || 'completed';
        }

        const newContent = new LibraryMovie(newContentData);
        await newContent.save();
        results.successful++;
      } catch (error) {
        results.failed++;
        results.errors.push(`İçerik ${i + 1} (${contentData.title || 'Bilinmeyen'}): ${error.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `${results.successful} içerik başarıyla eklendi`,
      results,
    });
  } catch (error) {
    console.error('Bulk import hatası:', error);
    return NextResponse.json(
      { success: false, message: 'Bulk import işlemi başarısız' },
      { status: 500 }
    );
  }
}
