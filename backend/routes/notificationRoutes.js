import express from 'express';
import { requireAuthentication } from '../middleware/auth.js';
import { listNotifications, markAllRead, clearNotifications } from '../controllers/notificationController.js';

const router = express.Router();

router.get('/',           requireAuthentication, listNotifications);
router.patch('/read-all', requireAuthentication, markAllRead);
router.delete('/',        requireAuthentication, clearNotifications);

export default router;
