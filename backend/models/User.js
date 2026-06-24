import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'User full name field is mandatory.'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email account specification is mandatory.'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, 'Provide a valid email composition address.']
  },
  password: {
    type: String,
    // Password is only required for local accounts. OAuth accounts (Google/GitHub)
    // authenticate via the provider and have no local password.
    required: [function () { return !this.googleId && !this.githubId; }, 'Security storage password hash parameter required.'],
    minlength: [6, 'Password must consist of a minimum of 6 characters.']
  },
  // ─── OAuth (Google / GitHub) ────────────────────────────────────────────────
  googleId: { type: String, default: undefined },
  githubId: { type: String, default: undefined },
  authProvider: { type: String, enum: ['local', 'google', 'github'], default: 'local' },
  avatarUrl: { type: String, default: '' },
  // ─── Password reset ─────────────────────────────────────────────────────────
  resetPasswordToken: { type: String, default: undefined },
  resetPasswordExpires: { type: Date, default: undefined },
  tier: {
    type: String,
    enum: ['free', 'premium'],
    default: 'free'
  },
  usageCount: {
    type: Number,
    default: 0
  },
  // Free-tier command counter resets when now passes this timestamp (rolling 30-day window).
  usageResetAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  },
  // Templates this user has purchased from the marketplace (their library).
  ownedTemplates: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Template'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

export default mongoose.model('User', userSchema);