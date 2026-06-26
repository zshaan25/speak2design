import express from 'express';
import { requireAuthentication } from '../middleware/auth.js';
import {
  getTemplates,
  publishTemplate,
  purchaseTemplate,
  getMyLibrary,
  createCheckoutSessionHandler,
  webhookHandler,
  unpublishTemplate,
  reseedTemplates,
  createProjectFromTemplate,
} from '../controllers/marketplaceController.js';

const router = express.Router();

// ─── Dev helper: (re)seed demo templates ──────────────────────────────────────
router.post('/seed', requireAuthentication, reseedTemplates);

// ─── Stripe webhook — raw body, NO auth ──────────────────────────────────────
// express.raw() is mounted in server.js at /api/marketplace/webhook BEFORE express.json()
router.post('/webhook', webhookHandler);

// ─── Public browse ────────────────────────────────────────────────────────────
router.get('/', requireAuthentication, getTemplates);

// ─── Seller actions (premium-gated inside controller) ─────────────────────────
router.post('/publish',           requireAuthentication, publishTemplate);
router.delete('/unpublish/:id',   requireAuthentication, unpublishTemplate);

// ─── Buyer actions ────────────────────────────────────────────────────────────
router.post('/checkout/:id',      requireAuthentication, createCheckoutSessionHandler);
router.post('/purchase/:id',      requireAuthentication, purchaseTemplate);
router.post('/:id/use',           requireAuthentication, createProjectFromTemplate);
router.get('/library',            requireAuthentication, getMyLibrary);

export default router;
