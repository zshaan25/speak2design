import express from 'express';
import { requireAuthentication } from '../middleware/auth.js';
import { getTemplates, publishTemplate, purchaseTemplate, getMyLibrary, createPaymentIntent } from '../controllers/marketplaceController.js';

const router = express.Router();

router.get('/', requireAuthentication, getTemplates);
router.get('/library', requireAuthentication, getMyLibrary);
router.post('/publish', requireAuthentication, publishTemplate);
router.post('/create-payment-intent/:id', requireAuthentication, createPaymentIntent);
router.post('/purchase/:id', requireAuthentication, purchaseTemplate);

export default router;
