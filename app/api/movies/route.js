import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { getUserFromRequest } from '@/lib/auth';

// Kullanıcının filmlerini getir
export async function GET(request) {
  try {
    await dbConnect();
    
    const userId = getUserFromRequest(request);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Giriş yapmanız gerekli' },
        { status: 401 }
      );
    }

    const user = await User.findById(userId);

    if (!user) {
      return NextResponse.json(
        { error: 'Kullanıcı bulunamadı' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      movies: user.watchedMovies || [],
    });
  } catch (error) {
    console.error('Get movies error:', error);
    return NextResponse.json(
      { error: 'Filmler alınamadı' },
      { status: 500 }
    );
  }
}

function normalizeTitle(title) {
  return title
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

// Kullanıcıya film ekle (tekli veya çoklu)
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

    const body = await request.json();
    const user = await User.findById(userId);

    if (!user) {
      return NextResponse.json(
        { error: 'Kullanıcı bulunamadı' },
        { status: 404 }
      );
    }

    // Çoklu ekleme modu
    if (body.titles && Array.isArray(body.titles)) {
      const added = [];
      const skipped = [];

      for (const movieInput of body.titles) {
        let title, year, genre, description;

        if (typeof movieInput === 'string') {
          title = movieInput;
          year = body.year;
          genre = body.genre;
          description = body.description;
        } else if (typeof movieInput === 'object' && movieInput.title) {
          ({ title, year, genre, description } = movieInput);
        } else {
          continue;
        }

        title = title?.trim();
        if (!title) continue;

        const normalizedExisting = user.watchedMovies.map(m => normalizeTitle(m.title));
        if (normalizedExisting.includes(normalizeTitle(title))) {
          skipped.push({ title, reason: 'Zaten listenizde' });
          continue;
        }

        const newMovie = {
          title,
          year: year?.trim() || 'Belirtilmemiş',
          genre: genre?.trim() || 'Belirtilmemiş',
          description: description?.trim() || 'Açıklama eklenmemiş',
        };

        user.watchedMovies.push(newMovie);
        added.push(newMovie);
      }

      await user.save();

      return NextResponse.json({
        success: true,
        added,
        skipped,
        addedCount: added.length,
        skippedCount: skipped.length,
      });
    }

    // Tekli ekleme modu
    const { title, year, genre, description } = body;

    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: 'Film adı gerekli' },
        { status: 400 }
      );
    }

    const trimmedTitle = title.trim();

    // Film zaten var mı kontrol et (normalize edilmiş)
    const normalizedExisting = user.watchedMovies.map(m => normalizeTitle(m.title));
    if (normalizedExisting.includes(normalizeTitle(trimmedTitle))) {
      return NextResponse.json(
        { error: 'Bu film zaten listenizde' },
        { status: 400 }
      );
    }

    // Filmi ekle
    const newMovie = {
      title: trimmedTitle,
      year: year?.trim() || 'Belirtilmemiş',
      genre: genre?.trim() || 'Belirtilmemiş',
      description: description?.trim() || 'Açıklama eklenmemiş',
    };

    user.watchedMovies.push(newMovie);
    await user.save();

    return NextResponse.json({
      success: true,
      movie: user.watchedMovies[user.watchedMovies.length - 1],
    });
  } catch (error) {
    console.error('Add movie error:', error);
    return NextResponse.json(
      { error: 'Film eklenemedi: ' + error.message },
      { status: 500 }
    );
  }
}
