import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { ProfileComment } from '@/models/Movie';
import User from '@/models/User';
import { verifyAuth } from '@/lib/auth';

// GET - Profil yorumlarını getir
export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const profileUserId = searchParams.get('profileUserId');
    const movieId = searchParams.get('movieId');

    if (!profileUserId || !movieId) {
      return NextResponse.json(
        { success: false, message: 'Kullanıcı ID ve Film ID gerekli' },
        { status: 400 }
      );
    }

    const comments = await ProfileComment.find({ profileUserId, movieId })
      .populate('commenterId', 'username profileImage')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      comments,
    });
  } catch (error) {
    console.error('Profil yorum getirme hatası:', error);
    return NextResponse.json(
      { success: false, message: 'Yorumlar getirilemedi' },
      { status: 500 }
    );
  }
}

// POST - Profil filmine yorum ekle
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
    const { profileUserId, movieId, comment } = body;

    if (!profileUserId || !movieId || !comment || comment.trim() === '') {
      return NextResponse.json(
        { success: false, message: 'Tüm alanlar gerekli' },
        { status: 400 }
      );
    }

    // Profil sahibinin bu filmi olup olmadığını kontrol et
    const profileUser = await User.findById(profileUserId);
    if (!profileUser) {
      return NextResponse.json(
        { success: false, message: 'Kullanıcı bulunamadı' },
        { status: 404 }
      );
    }

    const hasMovie = profileUser.watchedMovies.some(
      wm => wm.movieId.toString() === movieId && wm.isPublic
    );

    if (!hasMovie) {
      return NextResponse.json(
        { success: false, message: 'Bu film kullanıcının profilinde yok veya gizli' },
        { status: 403 }
      );
    }

    const newComment = await ProfileComment.create({
      profileUserId,
      movieId,
      commenterId: user.userId,
      comment: comment.trim(),
    });

    const populatedComment = await ProfileComment.findById(newComment._id)
      .populate('commenterId', 'username profileImage')
      .lean();

    return NextResponse.json({
      success: true,
      message: 'Yorum eklendi',
      comment: populatedComment,
    }, { status: 201 });
  } catch (error) {
    console.error('Profil yorum ekleme hatası:', error);
    return NextResponse.json(
      { success: false, message: 'Yorum eklenemedi' },
      { status: 500 }
    );
  }
}

// DELETE - Profil yorumunu sil
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

    const comment = await ProfileComment.findById(commentId);

    if (!comment) {
      return NextResponse.json(
        { success: false, message: 'Yorum bulunamadı' },
        { status: 404 }
      );
    }

    // Yorumu yapan veya profil sahibi veya admin silebilir
    if (
      comment.commenterId.toString() !== user.userId &&
      comment.profileUserId.toString() !== user.userId &&
      !user.isAdmin
    ) {
      return NextResponse.json(
        { success: false, message: 'Bu yorumu silemezsiniz' },
        { status: 403 }
      );
    }

    await ProfileComment.findByIdAndDelete(commentId);

    return NextResponse.json({
      success: true,
      message: 'Yorum silindi',
    });
  } catch (error) {
    console.error('Profil yorum silme hatası:', error);
    return NextResponse.json(
      { success: false, message: 'Yorum silinemedi' },
      { status: 500 }
    );
  }
}
