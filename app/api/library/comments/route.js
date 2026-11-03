import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { MovieComment } from '@/models/Movie';
import { verifyAuth } from '@/lib/auth';

// GET - Bir filme ait yorumları getir
export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const movieId = searchParams.get('movieId');

    if (!movieId) {
      return NextResponse.json(
        { success: false, message: 'Film ID gerekli' },
        { status: 400 }
      );
    }

    const comments = await MovieComment.find({ movieId })
      .populate('userId', 'username profileImage')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      comments,
    });
  } catch (error) {
    console.error('Yorum getirme hatası:', error);
    return NextResponse.json(
      { success: false, message: 'Yorumlar getirilemedi' },
      { status: 500 }
    );
  }
}

// POST - Yeni yorum ekle
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
    const { movieId, comment, spoiler } = body;

    if (!movieId || !comment || comment.trim() === '') {
      return NextResponse.json(
        { success: false, message: 'Film ID ve yorum gerekli' },
        { status: 400 }
      );
    }

    const newComment = await MovieComment.create({
      movieId,
      userId: user.userId,
      comment: comment.trim(),
      spoiler: spoiler || false,
    });

    const populatedComment = await MovieComment.findById(newComment._id)
      .populate('userId', 'username profileImage')
      .lean();

    return NextResponse.json({
      success: true,
      message: 'Yorum eklendi',
      comment: populatedComment,
    }, { status: 201 });
  } catch (error) {
    console.error('Yorum ekleme hatası:', error);
    return NextResponse.json(
      { success: false, message: 'Yorum eklenemedi' },
      { status: 500 }
    );
  }
}

// DELETE - Yorum sil
export async function DELETE(request) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Giriş yapmalısınız' },
        { status: 401 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get('commentId');

    if (!commentId) {
      return NextResponse.json(
        { success: false, message: 'Yorum ID gerekli' },
        { status: 400 }
      );
    }

    const comment = await MovieComment.findById(commentId);

    if (!comment) {
      return NextResponse.json(
        { success: false, message: 'Yorum bulunamadı' },
        { status: 404 }
      );
    }

    // Sadece kendi yorumunu veya admin silebilir
    if (comment.userId.toString() !== user.userId && user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Bu yorumu silemezsiniz' },
        { status: 403 }
      );
    }

    await MovieComment.findByIdAndDelete(commentId);

    return NextResponse.json({
      success: true,
      message: 'Yorum silindi',
    });
  } catch (error) {
    console.error('Yorum silme hatası:', error);
    return NextResponse.json(
      { success: false, message: 'Yorum silinemedi' },
      { status: 500 }
    );
  }
}
