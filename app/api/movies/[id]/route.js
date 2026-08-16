import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { getUserFromRequest } from '@/lib/auth';

// Film sil
export async function DELETE(request, { params }) {
  try {
    await dbConnect();
    
    const userId = getUserFromRequest(request);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Giriş yapmanız gerekli' },
        { status: 401 }
      );
    }

    const { id } = params;

    const user = await User.findById(userId);

    if (!user) {
      return NextResponse.json(
        { error: 'Kullanıcı bulunamadı' },
        { status: 404 }
      );
    }

    // Filmi bul ve sil
    const movieIndex = user.watchedMovies.findIndex(
      (movie) => movie._id.toString() === id
    );

    if (movieIndex === -1) {
      return NextResponse.json(
        { error: 'Film bulunamadı' },
        { status: 404 }
      );
    }

    user.watchedMovies.splice(movieIndex, 1);
    await user.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete movie error:', error);
    return NextResponse.json(
      { error: 'Film silinemedi' },
      { status: 500 }
    );
  }
}
