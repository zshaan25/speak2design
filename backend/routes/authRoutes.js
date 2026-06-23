import express from 'express';
import {
  registerUserAccount,
  loginUserAccount,
  getUserContextData,
  updateUserProfile,
  upgradeToPremium
} from '../controllers/authController.js';
import { requireAuthentication } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', registerUserAccount);
router.post('/login', loginUserAccount);
router.get('/profile', requireAuthentication, getUserContextData);
router.put('/profile', requireAuthentication, updateUserProfile);
router.post('/upgrade', requireAuthentication, upgradeToPremium);

export default router;
