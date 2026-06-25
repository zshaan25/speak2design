/**
 * controllers/designController.js  (Segment 5)
 * Design canvas persistence — full CRUD + undo + duplicate + autosave.
 * Uses the existing Project model as the canonical "design" document.
 */

import Project from '../models/Project.js';
import { randomUUID } from 'crypto';

const UNDO_HISTORY_LIMIT = 20;

// ─── POST /api/designs ────────────────────────────────────────────────────────
/**
 * createDesign — creates a new empty design (project) for the current user.
 * Body: { name? }
 */
export const createDesign = async (req, res, next) => {
  try {
    const name   = (req.body.name || 'Untitled Design').trim().slice(0, 100);
    const design = await Project.create({
      user:         req.user._id,
      title:        name,
      canvasState:  [],
      historyStack: []
    });
    return res.status(201).json({ success: true, design });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/designs ─────────────────────────────────────────────────────────
/**
 * getDesigns — returns summary list (no canvasState) for the current user.
 * Sorted by last update, newest first.
 */
export const getDesigns = async (req, res, next) => {
  try {
    const designs = await Project.find({ user: req.user._id })
      .select('title isPublic shareToken createdAt updatedAt')
      .sort({ updatedAt: -1 });

    return res.status(200).json({
      success: true,
      count:   designs.length,
      designs
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/designs/:id ─────────────────────────────────────────────────────
/**
 * getDesignById — returns a single design with full canvasState.
 * Returns 403 if the design belongs to a different user.
 */
export const getDesignById = async (req, res, next) => {
  try {
    const design = await Project.findById(req.params.id);
    if (!design) return res.status(404).json({ success: false, message: 'Design not found.' });
    if (design.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied — this design belongs to another user.' });
    }
    return res.status(200).json({ success: true, design });
  } catch (err) {
    next(err);
  }
};

// ─── PUT /api/designs/:id ─────────────────────────────────────────────────────
/**
 * updateDesign — updates name and/or canvasState.
 * When canvasState is updated:
 *   1. Pushes current canvasState to historyStack (undo history).
 *   2. Trims historyStack to last 20 entries.
 *   3. Replaces canvasState with the new value.
 */
export const updateDesign = async (req, res, next) => {
  try {
    const design = await Project.findById(req.params.id);
    if (!design) return res.status(404).json({ success: false, message: 'Design not found.' });
    if (design.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const { name, canvasState } = req.body;

    if (name !== undefined) {
      design.title = String(name).trim().slice(0, 100);
    }

    if (canvasState !== undefined) {
      // Push snapshot to undo history before overwriting
      design.historyStack = [
        ...(design.historyStack || []),
        design.canvasState
      ].slice(-UNDO_HISTORY_LIMIT);

      design.canvasState = Array.isArray(canvasState) ? canvasState : [];
    }

    await design.save();
    return res.status(200).json({ success: true, design });
  } catch (err) {
    next(err);
  }
};

// ─── DELETE /api/designs/:id ──────────────────────────────────────────────────
/**
 * deleteDesign — hard deletes the design.
 * Returns 400 if the design is published (isPublic).
 */
export const deleteDesign = async (req, res, next) => {
  try {
    const design = await Project.findById(req.params.id);
    if (!design) return res.status(404).json({ success: false, message: 'Design not found.' });
    if (design.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }
    if (design.isPublic) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete a published template. Unpublish it first.'
      });
    }
    await design.deleteOne();
    return res.status(200).json({ success: true, message: 'Design deleted.' });
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/designs/:id/undo ───────────────────────────────────────────────
/**
 * undoDesign — pops the last snapshot from historyStack and restores canvasState.
 */
export const undoDesign = async (req, res, next) => {
  try {
    const design = await Project.findById(req.params.id);
    if (!design) return res.status(404).json({ success: false, message: 'Design not found.' });
    if (design.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const history = design.historyStack || [];
    if (history.length === 0) {
      return res.status(400).json({ success: false, message: 'Nothing to undo.' });
    }

    const previousState    = history[history.length - 1];
    design.historyStack    = history.slice(0, -1);
    design.canvasState     = previousState;
    await design.save();

    return res.status(200).json({ success: true, canvasState: design.canvasState });
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/designs/:id/duplicate ─────────────────────────────────────────
/**
 * duplicateDesign — creates a new design with the same canvasState.
 * New name: "Copy of <original name>"
 */
export const duplicateDesign = async (req, res, next) => {
  try {
    const original = await Project.findById(req.params.id);
    if (!original) return res.status(404).json({ success: false, message: 'Design not found.' });
    if (original.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const copy = await Project.create({
      user:         req.user._id,
      title:        `Copy of ${original.title}`.slice(0, 100),
      canvasState:  JSON.parse(JSON.stringify(original.canvasState)), // deep clone
      historyStack: []
    });

    return res.status(201).json({ success: true, design: copy });
  } catch (err) {
    next(err);
  }
};

// ─── PUT /api/designs/:id/autosave ────────────────────────────────────────────
/**
 * autosaveDesign — lightweight save (canvasState only), minimal response.
 * Designed for frequent background calls — does NOT push to historyStack.
 */
export const autosaveDesign = async (req, res, next) => {
  try {
    const { canvasState } = req.body;
    const design = await Project.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { canvasState: Array.isArray(canvasState) ? canvasState : [] },
      { new: true, select: 'updatedAt' }
    );

    if (!design) return res.status(404).json({ success: false, message: 'Design not found.' });

    return res.status(200).json({ success: true, lastSaved: design.updatedAt });
  } catch (err) {
    next(err);
  }
};
