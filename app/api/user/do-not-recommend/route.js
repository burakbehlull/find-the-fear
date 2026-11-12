import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { verifyAuth } from '@/lib/auth';

// POST - Filmi "önerme" listesine ekle
export async function POST(request) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Giriş yapmalısınız' },
        { status: 401 }
      );
    }

    const { title } = await request.json();

    if (!title || !title.trim()) {
      return NextResponse.json(
        { success: false, message: 'Film adı gerekli' },
        { status: 400 }
      );
    }

    await connectDB();

    const userData = await User.findById(user.userId);

    // Zaten listede mi kontrol et
    const alreadyAdded = userData.doNotRecommend.some(
      (item) => item.title.toLowerCase() === title.toLowerCase()
    );

    if (alreadyAdded) {
      return NextResponse.json(
        { success: false, message: 'Bu film zaten "önerme" listenizde' },
        { status: 400 }
      );
    }

    // Listeye ekle
    userData.doNotRecommend.push({
      title: title.trim(),
      addedAt: new Date(),
    });

    await userData.save();

    return NextResponse.json({
      success: true,
      message: 'Film "önerme" listenize eklendi',
    });
  } catch (error) {
    console.error('Do not recommend error:', error);
    return NextResponse.json(
      { success: false, message: 'İşlem başarısız' },
      { status: 500 }
    );
  }
}

// GET - Kullanıcının "önerme" listesini getir
export async function GET(request) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Giriş yapmalısınız' },
        { status: 401 }
      );
    }

    await connectDB();

    const userData = await User.findById(user.userId).select('doNotRecommend');

    return NextResponse.json({
      success: true,
      doNotRecommend: userData.doNotRecommend || [],
    });
  } catch (error) {
    console.error('Get do not recommend error:', error);
    return NextResponse.json(
      { success: false, message: 'Liste getirilemedi' },
      { status: 500 }
    );
  }
}

// DELETE - Filmden "önerme" listesinden çıkar
export async function DELETE(request) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Giriş yapmalısınız' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const title = searchParams.get('title');

    if (!title) {
      return NextResponse.json(
        { success: false, message: 'Film adı gerekli' },
        { status: 400 }
      );
    }

    await connectDB();

    const userData = await User.findById(user.userId);
    userData.doNotRecommend = userData.doNotRecommend.filter(
      (item) => item.title.toLowerCase() !== title.toLowerCase()
    );

    await userData.save();

    return NextResponse.json({
      success: true,
      message: 'Film "önerme" listesinden çıkarıldı',
    });
  } catch (error) {
    console.error('Remove do not recommend error:', error);
    return NextResponse.json(
      { success: false, message: 'İşlem başarısız' },
      { status: 500 }
    );
  }
}
