import express from 'express';
import { requireAuthentication } from '../middleware/auth.js';
import {
  getPages,
  createPage,
  updatePage,
  deletePage,
  duplicatePage,
  reorderPages
} from '../controllers/pageController.js';

const router = express.Router();

// All page routes require a valid JWT
router.use(requireAuthentication);

// IMPORTANT: /reorder must come before /:pageId or Express captures "reorder" as a pageId param.
router.get(   '/projects/:projectId/pages',                     getPages);
router.post(  '/projects/:projectId/pages',                     createPage);
router.put(   '/projects/:projectId/pages/reorder',             reorderPages);
router.put(   '/projects/:projectId/pages/:pageId',             updatePage);
router.delete('/projects/:projectId/pages/:pageId',             deletePage);
router.post(  '/projects/:projectId/pages/:pageId/duplicate',   duplicatePage);

export default router;
