import mongoose from 'mongoose';

const templateSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  color: { type: String, default: 'from-blue-500 to-indigo-600' },
  canvasSnapshot: { type: Array, default: [] },
  author: { type: String, default: 'Speak2Design Team' },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  sales: { type: Number, default: 0 },
  lang: { type: String, enum: ['English', 'Urdu', 'Bilingual'], default: 'English' },
  category: { type: String, default: 'General' },
  tags: { type: [String], default: [] }
}, { timestamps: true });

export default mongoose.model('Template', templateSchema);