import express from 'express';
import { requireAuthentication } from '../middleware/auth.js';
import {
  createProject,
  getUserProjects,
  getProjectById,
  updateProjectCanvas,
  deleteProject,
  shareProject,
  regenerateShareToken,
  getPublicProject
} from '../controllers/projectController.js';

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

export default router;
