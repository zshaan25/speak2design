import express from 'express';
import {
  registerUserAccount,
  loginUserAccount,
  getUserContextData,
  updateUserProfile,
  upgradeToPremium,
  forgotPassword,
  resetPassword
} from '../controllers/authController.js';
import { oauthRedirect, oauthCallback } from '../controllers/oauthController.js';
import { requireAuthentication } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', registerUserAccount);
router.post('/login', loginUserAccount);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// OAuth (Google / GitHub) — redirect + callback
router.get('/oauth/:provider', oauthRedirect);
router.get('/oauth/:provider/callback', oauthCallback);
router.get('/profile', requireAuthentication, getUserContextData);
router.put('/profile', requireAuthentication, updateUserProfile);
router.post('/upgrade', requireAuthentication, upgradeToPremium);

export default router;
