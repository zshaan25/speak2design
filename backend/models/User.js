import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'User full name field is mandatory.'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters.']
  },
  email: {
    type: String,
    required: [true, 'Email account specification is mandatory.'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, 'Provide a valid email address.']
  },
  password: {
    type: String,
    required: [function () { return !this.googleId && !this.githubId; }, 'Password is required for local accounts.'],
    minlength: [6, 'Password must be at least 6 characters.'],
    select: false
  },

  // ─── Tier & usage ──────────────────────────────────────────────────────────
  role: { type: String, enum: ['free', 'premium'], default: 'free' },
  tier: { type: String, enum: ['free', 'premium'], default: 'free' },

  usageCount:   { type: Number, default: 0 },
  usageResetAt: { type: Date, default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },

  voiceCommandsToday: { type: Number, default: 0 },
  voiceCommandsDate:  { type: Date, default: Date.now },

  // ─── Stripe ────────────────────────────────────────────────────────────────
  stripeCustomerId: { type: String, default: null },
  purchasedTemplates: [{
    templateId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Template' },
    purchasedAt: { type: Date, default: Date.now }
  }],
  ownedTemplates: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Template' }],

  // ─── OAuth ─────────────────────────────────────────────────────────────────
  googleId:     { type: String, default: undefined },
  githubId:     { type: String, default: undefined },
  authProvider: { type: String, enum: ['local', 'google', 'github'], default: 'local' },

  // ─── Password reset ────────────────────────────────────────────────────────
  resetPasswordToken:   { type: String, default: undefined },
  resetPasswordExpires: { type: Date,   default: undefined },

  // ─── Deactivation ─────────────────────────────────────────────────────────
  isDeactivated: { type: Boolean, default: false },
  deactivatedAt: { type: Date,    default: undefined },

}, { timestamps: true });

// ─── Indexes ──────────────────────────────────────────────────────────────────
// email already gets a unique index from `unique: true` on the field — declaring
// it again here caused Mongoose's "Duplicate schema index" warning.
userSchema.index({ resetPasswordToken: 1 });

// ─── Pre-save: hash password only when modified and not already hashed ────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  if (!this.password) return next();
  // Guard against double-hashing when authController already hashes before save.
  if (this.password.startsWith('$2')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ─── Instance methods ─────────────────────────────────────────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.getSignedJWT = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

export default mongoose.model('User', userSchema);
