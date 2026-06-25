import express from 'express';
import { requireAuthentication } from '../middleware/auth.js';
import {
  createDesign,
  getDesigns,
  getDesignById,
  updateDesign,
  deleteDesign,
  undoDesign,
  duplicateDesign,
  autosaveDesign,
} from '../controllers/designController.js';

const router = express.Router();

// All /api/designs routes require authentication
router.use(requireAuthentication);

// ─── Collection routes ────────────────────────────────────────────────────────
router.post('/',  createDesign);   // POST /api/designs        — create new design
router.get('/',   getDesigns);     // GET  /api/designs        — list user's designs (no canvasState)

// ─── Document routes ──────────────────────────────────────────────────────────
router.get('/:id',                 getDesignById);    // GET    /api/designs/:id
router.put('/:id',                 updateDesign);     // PUT    /api/designs/:id  (name + canvasState, pushes undo)
router.delete('/:id',              deleteDesign);     // DELETE /api/designs/:id

// ─── Action routes (must come BEFORE /:id to avoid conflict) ─────────────────
router.post('/:id/undo',           undoDesign);       // POST   /api/designs/:id/undo
router.post('/:id/duplicate',      duplicateDesign);  // POST   /api/designs/:id/duplicate
router.put('/:id/autosave',        autosaveDesign);   // PUT    /api/designs/:id/autosave

export default router;
