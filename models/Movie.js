import mongoose from 'mongoose';

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
