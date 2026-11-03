import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { MovieComment } from '@/models/Movie';
import { verifyAuth } from '@/lib/auth';

// POST - Yorumu beğen/beğeniyi kaldır
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
    const { commentId } = body;

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

    const likeIndex = comment.likes.indexOf(user.userId);

    if (likeIndex > -1) {
      // Beğeniyi kaldır
      comment.likes.splice(likeIndex, 1);
    } else {
      // Beğen
      comment.likes.push(user.userId);
    }

    await comment.save();

    return NextResponse.json({
      success: true,
      liked: likeIndex === -1,
      likesCount: comment.likes.length,
    });
  } catch (error) {
    console.error('Beğeni hatası:', error);
    return NextResponse.json(
      { success: false, message: 'İşlem başarısız' },
      { status: 500 }
    );
  }
}
