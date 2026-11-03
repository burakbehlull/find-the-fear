/**
 * Temizlik Script - Silinmiş Film Referanslarını Kullanıcı Profillerinden Kaldır
 * 
 * Bu script, kullanıcıların watchedMovies listesinde olan ancak veritabanından
 * silinmiş filmlerin referanslarını temizler.
 * 
 * Kullanım: node scripts/cleanup-deleted-movies.js
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

const User = require('../models/User');
const LibraryMovie = require('../models/Movie');

async function cleanupDeletedMovies() {
  try {
    console.log('MongoDB\'ye bağlanılıyor...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Bağlantı başarılı\n');

    // Tüm kullanıcıları getir
    const users = await User.find({}).populate('watchedMovies.movieId');
    
    let totalRemoved = 0;
    
    for (const user of users) {
      const validMovies = [];
      const removedMovies = [];
      
      // Her filmi kontrol et
      for (const watchedMovie of user.watchedMovies) {
        if (watchedMovie.movieId) {
          // Film hala mevcut
          validMovies.push(watchedMovie);
        } else {
          // Film silinmiş
          removedMovies.push(watchedMovie._id);
          totalRemoved++;
        }
      }
      
      // Eğer silinmiş film varsa kullanıcıyı güncelle
      if (removedMovies.length > 0) {
        user.watchedMovies = validMovies;
        await user.save();
        console.log(`✓ ${user.username}: ${removedMovies.length} silinmiş film referansı kaldırıldı`);
      } else {
        console.log(`- ${user.username}: Temizlenecek referans yok`);
      }
    }
    
    console.log(`\n✓ Toplam ${totalRemoved} silinmiş film referansı temizlendi`);
    console.log(`✓ ${users.length} kullanıcı kontrol edildi`);
    
  } catch (error) {
    console.error('Hata:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nBağlantı kapatıldı');
  }
}

// Script'i çalıştır
cleanupDeletedMovies();
