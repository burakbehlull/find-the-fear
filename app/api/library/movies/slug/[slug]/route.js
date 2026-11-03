import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { LibraryMovie } from '@/models/Movie';

// GET - Slug ile tek bir filmi getir
export async function GET(request, { params }) {
  try {
    await connectDB();
    const { slug } = params;

    const movie = await LibraryMovie.findOne({ slug })
      .populate('addedBy', 'username')
      .lean();

    if (!movie) {
      return NextResponse.json(
        { success: false, message: 'Film bulunamadı' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      movie,
    });
  } catch (error) {
    console.error('Film getirme hatası:', error);
    return NextResponse.json(
      { success: false, message: 'Film getirilemedi' },
      { status: 500 }
    );
  }
}
