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
        { success: false, message: 'Geçerli bir film listesi gönderilmedi' },
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

    // Her bir filmi işle
    for (let i = 0; i < movies.length; i++) {
      const movieData = movies[i];

      try {
        // Zorunlu alan kontrolü
        if (!movieData.title || !movieData.year || !movieData.genres || !Array.isArray(movieData.genres) || movieData.genres.length === 0 || !movieData.description) {
          results.failed++;
          results.errors.push(`Film ${i + 1}: Eksik zorunlu alanlar (title, year, genres, description)`);
          continue;
        }

        // Slug oluştur
        const slug = slugify(`${movieData.title}-${movieData.year}`, {
          lower: true,
          strict: true,
        });

        // Aynı slug var mı kontrol et
        const existingMovie = await LibraryMovie.findOne({ slug });
        if (existingMovie) {
          results.failed++;
          results.errors.push(`Film ${i + 1} (${movieData.title}): Bu film zaten mevcut`);
          continue;
        }

        // Yeni film oluştur
        const newMovie = new LibraryMovie({
          title: movieData.title,
          year: parseInt(movieData.year),
          series: movieData.series || '',
          genres: movieData.genres,
          description: movieData.description,
          director: movieData.director || '',
          poster: movieData.poster || '',
          imdbId: movieData.imdbId || '',
          imdbRating: movieData.imdbRating ? parseFloat(movieData.imdbRating) : null,
          imdbLink: movieData.imdbLink || '',
          duration: movieData.duration ? parseInt(movieData.duration) : null,
          slug,
          addedBy: user.userId, // Admin who added it
          status: 'approved', // Auto-approve admin additions
        });

        await newMovie.save();
        results.successful++;
      } catch (error) {
        results.failed++;
        results.errors.push(`Film ${i + 1} (${movieData.title || 'Bilinmeyen'}): ${error.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `${results.successful} film başarıyla eklendi`,
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
