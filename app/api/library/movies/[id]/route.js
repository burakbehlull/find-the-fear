import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { LibraryMovie } from '@/models/Movie';
import { verifyAuth } from '@/lib/auth';

// GET - Tek film/dizi getir (ID ile)
export async function GET(request, { params }) {
  try {
    await connectDB();
    
    const movie = await LibraryMovie.findById(params.id);
    
    if (!movie) {
      return NextResponse.json(
        { success: false, message: 'İçerik bulunamadı' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      movie,
    });
  } catch (error) {
    console.error('Movie fetch error:', error);
    return NextResponse.json(
      { success: false, message: 'İçerik getirilemedi' },
      { status: 500 }
    );
  }
}

// PUT - Film/dizi güncelle (Admin/Moderator)
export async function PUT(request, { params }) {
  try {
    const user = await verifyAuth(request);
    if (!user || !user.isAdmin) {
      return NextResponse.json(
        { success: false, message: 'Yetkiniz yok' },
        { status: 403 }
      );
    }

    await connectDB();

    const updates = await request.json();
    const { id } = params;

    // Güncellenebilir alanlar
    const allowedUpdates = [
      'title',
      'year',
      'series',
      'genres',
      'description',
      'director',
      'poster',
      'imdbId',
      'imdbRating',
      'imdbLink',
      'duration',
      'type',
      'seasons',
      'totalSeasons',
      'totalEpisodes',
      'seriesStatus',
    ];

    const updateData = {};
    Object.keys(updates).forEach((key) => {
      if (allowedUpdates.includes(key)) {
        updateData[key] = updates[key];
      }
    });

      // Dizi ise total hesapla
      if (updateData.seasons && Array.isArray(updateData.seasons)) {
        updateData.totalSeasons = updateData.seasons.length;
        updateData.totalEpisodes = updateData.seasons.reduce(
          (sum, season) => sum + (season.episodes?.length || 0),
          0
        );
        // Her sezon için episodeCount'u episodes.length'ten hesapla
        updateData.seasons.forEach(season => {
          season.episodeCount = season.episodes?.length || 0;
        });
      }

    const movie = await LibraryMovie.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!movie) {
      return NextResponse.json(
        { success: false, message: 'İçerik bulunamadı' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'İçerik güncellendi',
      movie,
    });
  } catch (error) {
    console.error('Movie update error:', error);
    return NextResponse.json(
      { success: false, message: 'Güncelleme başarısız', error: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Film/dizi sil (Admin/Owner)
export async function DELETE(request, { params }) {
  try {
    const user = await verifyAuth(request);
    if (!user || !user.isAdmin) {
      return NextResponse.json(
        { success: false, message: 'Yetkiniz yok' },
        { status: 403 }
      );
    }

    await connectDB();

    const movie = await LibraryMovie.findByIdAndDelete(params.id);

    if (!movie) {
      return NextResponse.json(
        { success: false, message: 'İçerik bulunamadı' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'İçerik silindi',
    });
  } catch (error) {
    console.error('Movie delete error:', error);
    return NextResponse.json(
      { success: false, message: 'Silme başarısız' },
      { status: 500 }
    );
  }
}
