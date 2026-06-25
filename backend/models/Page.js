import mongoose from 'mongoose';

// Reuse the same component schema shape as Project.js so canvas data is consistent.
const componentSchema = new mongoose.Schema({
  id:          { type: String, required: true },
  type:        { type: String, required: true },
  name:        { type: String, required: true },
  styles:      { type: Map, of: String, default: {} },
  content:     { type: String, default: '' },
  children:    { type: Array,  default: [] },
  htmlContent: { type: String, default: '' }
}, { _id: false });

const pageSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    default: 'Home'
  },
  // URL slug used when exporting as a multi-page site (e.g. "/" or "/about")
  slug: {
    type: String,
    trim: true,
    default: '/'
  },
  // Zero-based sort position within the project's page list
  order: {
    type: Number,
    default: 0
  },
  canvasState: {
    type: [componentSchema],
    default: []
  }
}, { timestamps: true });

// Hot query: all pages for a project in order
pageSchema.index({ project: 1, order: 1 });

export default mongoose.model('Page', pageSchema);
