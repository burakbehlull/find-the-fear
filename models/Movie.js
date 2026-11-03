import mongoose from 'mongoose';
import slugify from 'slugify';

// Kütüphane filmleri için ana model
const LibraryMovieSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Film adı gerekli'],
    trim: true,
  },
  slug: {
    type: String,
    unique: true,
    sparse: true, // null değerlere izin ver ama unique olanlar olsun
  },
  year: {
    type: Number,
    required: [true, 'Yıl gerekli'],
  },
  series: {
    type: String,
    default: '',
    trim: true,
  },
  genres: [{
    type: String,
    enum: ['komedi', 'psikolojik', 'vahşet', 'gerilim', 'gizem', 'doğaüstü', 'belgesel'],
    required: true,
  }],
  imdbId: {
    type: String,
    default: '',
  },
  imdbRating: {
    type: Number,
    min: 0,
    max: 10,
    default: null,
  },
  imdbLink: {
    type: String,
    default: '',
  },
  poster: {
    type: String,
    default: '',
  },
  description: {
    type: String,
    required: [true, 'Açıklama gerekli'],
  },
  director: {
    type: String,
    default: '',
  },
  cast: [{
    type: String,
  }],
  duration: {
    type: Number, // dakika cinsinden
    default: null,
  },
  // İstatistikler
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  watchedByCount: {
    type: Number,
    default: 0,
  },
  averageRating: {
    type: Number,
    min: 0,
    max: 10,
    default: null,
  },
  totalRatings: {
    type: Number,
    default: 0,
  },
  // Onay sistemi
  status: {
    type: String,
    enum: ['approved', 'pending', 'rejected'],
    default: 'approved',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Slug oluşturma - kaydetmeden önce
LibraryMovieSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('title') || this.isModified('year')) {
    const baseSlug = slugify(`${this.title} ${this.year}`, {
      lower: true,
      strict: true,
      locale: 'tr'
    });
    this.slug = baseSlug;
  }
  next();
});

// Ortalama puanı hesaplama metodu
LibraryMovieSchema.methods.calculateAverageRating = async function() {
  const User = mongoose.model('User');
  const users = await User.find({ 'watchedMovies.movieId': this._id });
  
  let totalRating = 0;
  let ratingCount = 0;
  
  users.forEach(user => {
    const watchedMovie = user.watchedMovies.find(wm => wm.movieId.toString() === this._id.toString());
    if (watchedMovie && watchedMovie.rating !== null) {
      totalRating += watchedMovie.rating;
      ratingCount++;
    }
  });
  
  this.totalRatings = ratingCount;
  this.averageRating = ratingCount > 0 ? (totalRating / ratingCount) : null;
  await this.save();
};

// LibraryMovie Schema'da slug index
LibraryMovieSchema.index({ slug: 1 });

// Film yorumu modeli
const MovieCommentSchema = new mongoose.Schema({
  movieId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LibraryMovie',
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  comment: {
    type: String,
    required: [true, 'Yorum gerekli'],
    maxlength: [1000, 'Yorum en fazla 1000 karakter olabilir'],
  },
  spoiler: {
    type: Boolean,
    default: false,
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Profil yorumu modeli (kullanıcının profil filmlerine yapılan yorumlar)
const ProfileCommentSchema = new mongoose.Schema({
  profileUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  movieId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LibraryMovie',
    required: true,
  },
  commenterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  comment: {
    type: String,
    required: [true, 'Yorum gerekli'],
    maxlength: [500, 'Yorum en fazla 500 karakter olabilir'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const LibraryMovie = mongoose.models.LibraryMovie || mongoose.model('LibraryMovie', LibraryMovieSchema);
export const MovieComment = mongoose.models.MovieComment || mongoose.model('MovieComment', MovieCommentSchema);
export const ProfileComment = mongoose.models.ProfileComment || mongoose.model('ProfileComment', ProfileCommentSchema);

// Eski Movie modeli (geriye dönük uyumluluk için)
const MovieSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Film adı gerekli'],
    trim: true,
  },
  year: {
    type: String,
    default: 'Belirtilmemiş',
  },
  genre: {
    type: String,
    default: 'Belirtilmemiş',
  },
  description: {
    type: String,
    default: 'Açıklama eklenmemiş',
  },
  reason: {
    type: String,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Movie || mongoose.model('Movie', MovieSchema);
