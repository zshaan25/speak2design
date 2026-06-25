import mongoose from 'mongoose';
import crypto from 'crypto';

const templateSchema = new mongoose.Schema({
  // ─── Core fields ──────────────────────────────────────────────────────────
  title:          { type: String, required: true, trim: true, maxlength: 100 },
  name:           { type: String, trim: true, maxlength: 100 },
  description:    { type: String, required: true, maxlength: 1000 },
  price:          { type: Number, required: true, min: 0 },
  color:          { type: String, default: 'from-blue-500 to-indigo-600' },
  imageUrl:       { type: String, default: '' },
  canvasSnapshot: { type: Array, default: [] },
  author:         { type: String, default: 'Speak2Design Team' },
  authorName:     { type: String, default: 'Speak2Design Team' },
  rating:         { type: Number, default: 0, min: 0, max: 5 },
  sales:          { type: Number, default: 0 },
  downloads:      { type: Number, default: 0 },
  tags:           [{ type: String }],
  category:       { type: String, default: 'General' },

  lang: {
    type: String,
    enum: ['English', 'Urdu', 'Bilingual'],
    default: 'English'
  },

  // ─── Segment 6 additions ──────────────────────────────────────────────────
  designId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null },

  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },

  // MD5 hash of canvasSnapshot to prevent duplicate listings
  uniquenessHash: { type: String, default: null },

  buyers: [{
    userId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    purchasedAt: { type: Date, default: Date.now }
  }],

  isPremiumOnly: { type: Boolean, default: false },
  isActive:      { type: Boolean, default: true },

  // Stripe IDs (set when a seller publishes a paid template)
  stripePriceId:   { type: String, default: null },
  stripeProductId: { type: String, default: null },

}, { timestamps: true });

// ─── Indexes ──────────────────────────────────────────────────────────────────
templateSchema.index({ sellerId: 1 });
templateSchema.index({ isActive: 1, price: 1 });
templateSchema.index({ category: 1, lang: 1 });
templateSchema.index({ uniquenessHash: 1 }, { sparse: true, unique: true });

export default mongoose.model('Template', templateSchema);
