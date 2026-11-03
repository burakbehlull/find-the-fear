import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { LibraryMovie } from '@/models/Movie';
import { verifyAuth } from '@/lib/auth';
import slugify from 'slugify';

// GET - Tüm onaylanmış filmleri getir (filtreleme ile)
export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const genres = searchParams.get('genres')?.split(',').filter(Boolean) || [];
    const minYear = parseInt(searchParams.get('minYear')) || null;
    const maxYear = parseInt(searchParams.get('maxYear')) || null;
    const minRating = parseFloat(searchParams.get('minRating')) || null;
    const sortBy = searchParams.get('sortBy') || 'newest'; // newest, oldest, rating, title, popular

    // Filtreleme sorgusu
    const query = { status: 'approved' };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { director: { $regex: search, $options: 'i' } },
      ];
    }

    if (genres.length > 0) {
      query.genres = { $in: genres };
    }

    if (minYear || maxYear) {
      query.year = {};
      if (minYear) query.year.$gte = minYear;
      if (maxYear) query.year.$lte = maxYear;
    }

    if (minRating) {
      query.averageRating = { $gte: minRating };
    }

    // Sıralama
    let sort = {};
    switch (sortBy) {
      case 'oldest':
        sort = { createdAt: 1 };
        break;
      case 'rating':
        sort = { averageRating: -1, totalRatings: -1 };
        break;
      case 'title':
        sort = { title: 1 };
        break;
      case 'popular':
        sort = { watchedByCount: -1 };
        break;
      case 'newest':
      default:
        sort = { createdAt: -1 };
        break;
    }

    const movies = await LibraryMovie.find(query)
      .sort(sort)
      .populate('addedBy', 'username')
      .lean();

    return NextResponse.json({
      success: true,
      movies,
      count: movies.length,
    });
  } catch (error) {
    console.error('Film listesi hatası:', error);
    return NextResponse.json(
      { success: false, message: 'Film listesi alınamadı' },
      { status: 500 }
    );
  }
}

// POST - Yeni film ekle (sadece admin)
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
    const { title, year, series, genres, description, director, poster, imdbId, imdbRating, imdbLink, cast, duration } = body;

    if (!title || !year || !genres || genres.length === 0 || !description) {
      return NextResponse.json(
        { success: false, message: 'Gerekli alanları doldurun' },
        { status: 400 }
      );
    }

    // Slug oluştur
    const slug = slugify(`${title} ${year}`, {
      lower: true,
      strict: true,
      locale: 'tr'
    });

    const movie = await LibraryMovie.create({
      title,
      slug,
      year,
      series: series || '',
      genres,
      description,
      director: director || '',
      poster: poster || '',
      imdbId: imdbId || '',
      imdbRating: imdbRating || null,
      imdbLink: imdbLink || '',
      cast: cast || [],
      duration: duration || null,
      addedBy: user.userId,
      status: 'approved',
    });

    return NextResponse.json({
      success: true,
      message: 'Film başarıyla eklendi',
      movie,
    }, { status: 201 });
  } catch (error) {
    console.error('Film ekleme hatası:', error);
    return NextResponse.json(
      { success: false, message: 'Film eklenemedi' },
      { status: 500 }
    );
  }
}
