import express from 'express';
import multer from 'multer';
import { requireAuthentication } from '../middleware/auth.js';
import {
  createProject,
  getUserProjects,
  getProjectById,
  updateProjectCanvas,
  deleteProject,
  shareProject,
  regenerateShareToken,
  getPublicProject,
  uploadThumbnail,
} from '../controllers/projectController.js';

// Memory storage for thumbnail uploads (PNG, max 5MB)
const thumbnailUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'image/png' || file.mimetype === 'image/jpeg') {
      cb(null, true);
    } else {
      cb(new Error('Only PNG or JPEG thumbnails are accepted.'));
    }
  },
});

const router = express.Router();

// IMPORTANT: Static / prefix paths must be declared BEFORE dynamic /:id routes.
// Express matches in declaration order — "public" and "public/token" would otherwise
// be captured as /:id values and hit the wrong handler.

// Public view — no auth (before /:id to avoid collision)
router.get('/public/:token', getPublicProject);

router.post('/', requireAuthentication, createProject);
router.get('/', requireAuthentication, getUserProjects);
router.get('/:id', requireAuthentication, getProjectById);
router.put('/:id', requireAuthentication, updateProjectCanvas);
router.delete('/:id', requireAuthentication, deleteProject);

// Share — toggle public/private, regenerate token
router.post('/:id/share', requireAuthentication, shareProject);
router.post('/:id/share/regenerate', requireAuthentication, regenerateShareToken);

// Thumbnail upload (S3 — gracefully degraded if AWS not configured)
router.post('/:id/thumbnail', requireAuthentication, thumbnailUpload.single('thumbnail'), uploadThumbnail);

export default router;
