import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Kullanıcı adı gerekli'],
    unique: true,
    trim: true,
    minlength: [3, 'Kullanıcı adı en az 3 karakter olmalı'],
  },
  email: {
    type: String,
    required: [true, 'E-posta gerekli'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Şifre gerekli'],
    minlength: [6, 'Şifre en az 6 karakter olmalı'],
  },
  roles: {
    type: [String],
    enum: ['user', 'admin', 'owner'],
    default: ['user'],
  },
  lastUsernameChange: {
    type: Date,
    default: null,
  },
  bio: {
    type: String,
    maxlength: [200, 'Bio en fazla 200 karakter olabilir'],
    default: '',
  },
  profileImage: {
    type: String,
    default: '',
  },
  favoriteGenre: {
    type: String,
    default: '',
  },
  privacy: {
    showMovies: {
      type: Boolean,
      default: true,
    },
  },
  watchedMovies: [{
    movieId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LibraryMovie',
      required: true,
    },
    contentType: {
      type: String,
      enum: ['film', 'series'],
      default: 'film',
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    // Film için
    rating: {
      type: Number,
      min: 0,
      max: 10,
      default: null,
    },
    tags: [{
      type: String,
      trim: true,
    }],
    note: {
      type: String,
      maxlength: [500, 'Not en fazla 500 karakter olabilir'],
      default: '',
    },
    watchedAt: {
      type: Date,
      default: null,
    },
    watchedWith: [{
      type: String,
      trim: true,
    }],
    // Dizi için - izlenen bölümler
    watchedEpisodes: [{
      season: {
        type: Number,
        required: true,
      },
      episode: {
        type: Number,
        required: true,
      },
      watchedAt: {
        type: Date,
        default: Date.now,
      },
      watchedWith: [{
        type: String,
        trim: true,
      }],
      rating: {
        type: Number,
        min: 0,
        max: 10,
        default: null,
      },
      note: {
        type: String,
        maxlength: [500, 'Not en fazla 500 karakter olabilir'],
        default: '',
      },
    }],
    // Dizi progress (otomatik hesaplanan)
    currentSeason: {
      type: Number,
      default: 1,
    },
    currentEpisode: {
      type: Number,
      default: 0,
    },
    totalWatchedEpisodes: {
      type: Number,
      default: 0,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    // Re-watch için
    watchCount: {
      type: Number,
      default: 1,
    },
    lastWatchedAt: {
      type: Date,
      default: Date.now,
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  savedMovies: [{
    movieId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LibraryMovie',
      required: true,
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  doNotRecommend: [{
    title: {
      type: String,
      required: true,
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Şifreyi kaydetmeden önce hash'le
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Şifre karşılaştırma metodu
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.models.User || mongoose.model('User', UserSchema);
