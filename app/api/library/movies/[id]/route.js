import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { LibraryMovie } from '@/models/Movie';
import { verifyAuth } from '@/lib/auth';

// GET - Tek bir filmi getir
export async function GET(request, { params }) {
  try {
    await connectDB();
    const { id } = params;

    const movie = await LibraryMovie.findById(id)
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

// PUT - Film güncelle (sadece admin)
export async function PUT(request, { params }) {
  try {
    const user = await verifyAuth(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Yetkisiz erişim' },
        { status: 403 }
      );
    }

    await connectDB();
    const { id } = params;
    const body = await request.json();

    const movie = await LibraryMovie.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    );

    if (!movie) {
      return NextResponse.json(
        { success: false, message: 'Film bulunamadı' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Film güncellendi',
      movie,
    });
  } catch (error) {
    console.error('Film güncelleme hatası:', error);
    return NextResponse.json(
      { success: false, message: 'Film güncellenemedi' },
      { status: 500 }
    );
  }
}

// DELETE - Film sil (sadece admin)
export async function DELETE(request, { params }) {
  try {
    const user = await verifyAuth(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Yetkisiz erişim' },
        { status: 403 }
      );
    }

    await connectDB();
    const { id } = params;

    const movie = await LibraryMovie.findByIdAndDelete(id);

    if (!movie) {
      return NextResponse.json(
        { success: false, message: 'Film bulunamadı' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Film silindi',
    });
  } catch (error) {
    console.error('Film silme hatası:', error);
    return NextResponse.json(
      { success: false, message: 'Film silinemedi' },
      { status: 500 }
    );
  }
}
