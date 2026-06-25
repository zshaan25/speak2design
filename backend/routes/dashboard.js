import express from 'express';
import { requireAuthentication } from '../middleware/auth.js';
import { getDashboard } from '../controllers/dashboardController.js';

const router = express.Router();

/**
 * GET /api/dashboard
 * Returns all dashboard data in a single aggregated response:
 *   - user profile
 *   - stats (designs, templates, voice quota)
 *   - recentDesigns (last 5)
 *   - publishedTemplates (by this user)
 *   - purchasedLibrary (templates user has purchased)
 */
router.get('/', requireAuthentication, getDashboard);

export default router;
