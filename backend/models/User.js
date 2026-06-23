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
    required: [true, 'Security storage password hash parameter required.'],
    minlength: [6, 'Password must consist of a minimum of 6 characters.']
  },
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