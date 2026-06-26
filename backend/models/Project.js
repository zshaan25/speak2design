import mongoose from 'mongoose';

const componentSchema = new mongoose.Schema({
  id: { type: String, required: true },
  type: { type: String, required: true },
  name: { type: String, required: true },
  styles: { type: Map, of: String, default: {} },
  content: { type: String, default: '' },
  children: { type: Array, default: [] },
  htmlContent: { type: String, default: '' }
});

const projectSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Project title label notation is mandatory.'],
    trim: true,
    default: 'Untitled Design Workspace'
  },
  language: {
    type: String,
    enum: ['English', 'Urdu'],
    default: 'English'
  },
  canvasState: {
    type: [componentSchema],
    default: []
  },
  historyStack: {
    type: Array,
    default: []
  },
  historyPointer: {
    type: Number,
    default: -1
  },
  thumbnailUrl: {
    type: String,
    default: null
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  // ─── Organisation flags (#16 sidebar views) ─────────────────────────────────
  isFavorite: { type: Boolean, default: false },
  isArchived: { type: Boolean, default: false },
  deletedAt:  { type: Date, default: null },  // soft-delete → Trash
  shareToken: {
    type: String,
    default: null,
    index: { sparse: true }
  }
}, { timestamps: true });

// Optimizes the hot query: list a user's projects newest-first.
projectSchema.index({ user: 1, updatedAt: -1 });

export default mongoose.model('Project', projectSchema);
