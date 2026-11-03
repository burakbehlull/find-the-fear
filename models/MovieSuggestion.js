import mongoose from 'mongoose';

const MovieSuggestionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Film adı gerekli'],
    trim: true,
  },
  year: {
    type: Number,
    required: [true, 'Yıl gerekli'],
  },
  genres: [{
    type: String,
    enum: ['komedi', 'psikolojik', 'vahşet', 'gerilim', 'gizem', 'doğaüstü', 'belgesel'],
    required: true,
  }],
  imdbLink: {
    type: String,
    default: '',
  },
  description: {
    type: String,
    required: [true, 'Açıklama gerekli'],
    maxlength: [1000, 'Açıklama en fazla 1000 karakter olabilir'],
  },
  director: {
    type: String,
    default: '',
  },
  poster: {
    type: String,
    default: '',
  },
  suggestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  adminNote: {
    type: String,
    maxlength: [500, 'Admin notu en fazla 500 karakter olabilir'],
    default: '',
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  reviewedAt: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.MovieSuggestion || mongoose.model('MovieSuggestion', MovieSuggestionSchema);
