import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { sendPasswordResetEmail, isMailConfigured } from '../utils/mailer.js';
import { createUpgradeCheckoutSession, retrieveCheckoutSession } from '../services/stripe.js';
import { createNotification } from './notificationController.js';

const hashToken = (raw) => crypto.createHash('sha256').update(raw).digest('hex');

const buildTokenSignature = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// ─── Register ────────────────────────────────────────────────────────────────
export const registerUserAccount = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'All entry fields must be completed.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    const collisionMatch = await User.findOne({ email: email.toLowerCase().trim() });
    if (collisionMatch) {
      return res.status(400).json({ success: false, message: 'This email is already linked to another account.' });
    }

    const saltRounds = await bcrypt.genSalt(10);
    const passwordHashValue = await bcrypt.hash(password, saltRounds);

    const createdUser = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: passwordHashValue,
      tier: 'free',
      usageCount: 0
    });

    const sessionWebToken = buildTokenSignature(createdUser._id);

    return res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      token: sessionWebToken,
      user: {
        id: createdUser._id,
        name: createdUser.name,
        email: createdUser.email,
        tier: createdUser.tier,
        usageCount: createdUser.usageCount,
        avatar: createdUser.name.split(' ').map(n => n[0]).join('').toUpperCase()
      }
    });
  } catch (err) {
    console.error('>>> Registration error:', err);
    return res.status(500).json({ success: false, message: 'An internal error occurred during registration.' });
  }
};

// ─── Login ───────────────────────────────────────────────────────────────────
export const loginUserAccount = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const matchedProfile = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!matchedProfile) {
      return res.status(401).json({ success: false, message: 'Invalid credentials entered.' });
    }

    const signatureIsAuthentic = await bcrypt.compare(password, matchedProfile.password);
    if (!signatureIsAuthentic) {
      return res.status(401).json({ success: false, message: 'Invalid credentials entered.' });
    }

    // Auto-reactivate if the user previously deactivated their own account.
    if (matchedProfile.isDeactivated) {
      matchedProfile.isDeactivated = false;
      matchedProfile.deactivatedAt = undefined;
      await matchedProfile.save();
    }

    const securitySessionToken = buildTokenSignature(matchedProfile._id);

    return res.status(200).json({
      success: true,
      message: 'Authentication successful.',
      token: securitySessionToken,
      user: {
        id: matchedProfile._id,
        name: matchedProfile.name,
        email: matchedProfile.email,
        tier: matchedProfile.tier,
        usageCount: matchedProfile.usageCount || 0,
        avatar: matchedProfile.name.split(' ').map(n => n[0]).join('').toUpperCase()
      }
    });
  } catch (err) {
    console.error('>>> Login error:', err);
    return res.status(500).json({ success: false, message: 'An error occurred while validating credentials.' });
  }
};

// ─── Get Profile ─────────────────────────────────────────────────────────────
export const getUserContextData = async (req, res) => {
  // Re-fetch to get latest usageCount from DB (not stale middleware cache)
  const freshUser = await User.findById(req.user._id).select('-password');
  return res.status(200).json({
    success: true,
    user: freshUser
  });
};

// ─── Update Profile ───────────────────────────────────────────────────────────
export const updateUserProfile = async (req, res) => {
  try {
    const { name, email, currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    // Update name
    if (name && name.trim()) user.name = name.trim();

    // Update email (check for collision)
    if (email && email.toLowerCase().trim() !== user.email) {
      const collision = await User.findOne({ email: email.toLowerCase().trim() });
      if (collision) return res.status(400).json({ success: false, message: 'Email already in use.' });
      user.email = email.toLowerCase().trim();
    }

    // Update password
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ success: false, message: 'Current password is required to set a new one.' });
      }
      const valid = await bcrypt.compare(currentPassword, user.password);
      if (!valid) return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
      if (newPassword.length < 6) return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        tier: user.tier,
        usageCount: user.usageCount,
        avatar: user.name.split(' ').map(n => n[0]).join('').toUpperCase()
      }
    });
  } catch (err) {
    console.error('>>> Profile update error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
};

// ─── Forgot Password — issue a reset token + email link ───────────────────────
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required.' });

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    // Always respond the same way to avoid leaking which emails are registered.
    const genericMsg = 'If an account exists for that email, a password reset link has been sent.';

    if (!user) return res.status(200).json({ success: true, message: genericMsg });

    // OAuth-only accounts have no password to reset.
    if (user.authProvider !== 'local') {
      return res.status(200).json({
        success: true,
        message: `This account uses ${user.authProvider} sign-in. Please log in with ${user.authProvider}.`
      });
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = hashToken(rawToken);
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    const base = process.env.FRONTEND_URL || 'https://d1khpu1t6zzts5.cloudfront.net';
    const resetLink = `${base}/?reset=${rawToken}`;

    let emailed = false;
    try {
      emailed = await sendPasswordResetEmail(user.email, resetLink);
    } catch (mailErr) {
      console.error('>>> Reset email send failed:', mailErr.message);
    }

    // If SMTP isn't configured (or send failed), return the link so the flow is
    // still usable in development / demo. With SMTP configured, never leak the link.
    const payload = { success: true, message: genericMsg };
    if (!emailed) {
      console.log(`>>> [DEV] Password reset link for ${user.email}: ${resetLink}`);
      payload.devLink = resetLink;
      payload.message = isMailConfigured()
        ? 'Email service error — use the reset link shown below.'
        : 'Email service not configured — use the reset link below to continue.';
    }
    return res.status(200).json(payload);
  } catch (err) {
    console.error('>>> Forgot password error:', err);
    return res.status(500).json({ success: false, message: 'Could not start password reset.' });
  }
};

// ─── Reset Password — consume token, set new password ─────────────────────────
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ success: false, message: 'Token and new password are required.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
    }

    const user = await User.findOne({
      resetPasswordToken: hashToken(token),
      resetPasswordExpires: { $gt: new Date() }
    });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Reset link is invalid or has expired. Request a new one.' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return res.status(200).json({ success: true, message: 'Password reset successfully. You can now log in.' });
  } catch (err) {
    console.error('>>> Reset password error:', err);
    return res.status(500).json({ success: false, message: 'Could not reset password.' });
  }
};

// ─── Deactivate Account ───────────────────────────────────────────────────────
// Sets isDeactivated = true. Reversible — logging back in clears the flag.
export const deactivateAccount = async (req, res) => {
  try {
    const { password } = req.body;
    const user = await User.findById(req.user._id).select('+password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    // Require password confirmation for local accounts (OAuth accounts have no password).
    if (user.authProvider === 'local' || user.password) {
      if (!password) {
        return res.status(400).json({ success: false, message: 'Enter your current password to confirm deactivation.' });
      }
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) return res.status(401).json({ success: false, message: 'Incorrect password.' });
    }

    user.isDeactivated = true;
    user.deactivatedAt = new Date();
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Account deactivated. You have been signed out. Log back in at any time to reactivate.'
    });
  } catch (err) {
    console.error('>>> Deactivate account error:', err);
    return res.status(500).json({ success: false, message: 'Could not deactivate account.' });
  }
};

// ─── Delete Account ────────────────────────────────────────────────────────────
// Permanently removes the user and all their projects. Irreversible.
export const deleteAccount = async (req, res) => {
  try {
    const { password, confirmation } = req.body;

    if (confirmation !== 'DELETE') {
      return res.status(400).json({ success: false, message: 'Type DELETE in the confirmation field to proceed.' });
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    // Require password confirmation for local accounts.
    if (user.authProvider === 'local' || user.password) {
      if (!password) {
        return res.status(400).json({ success: false, message: 'Enter your current password to confirm deletion.' });
      }
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) return res.status(401).json({ success: false, message: 'Incorrect password.' });
    }

    // Cascade delete: pages → projects → user (order matters for referential integrity).
    const Project = (await import('../models/Project.js')).default;
    const Page    = (await import('../models/Page.js')).default;

    // Collect project IDs so we can delete their pages in one query.
    const userProjects = await Project.find({ user: user._id }).select('_id');
    const projectIds   = userProjects.map(p => p._id);

    if (projectIds.length > 0) {
      await Page.deleteMany({ project: { $in: projectIds } });
    }
    await Project.deleteMany({ user: user._id });

    // Remove user document.
    await User.findByIdAndDelete(user._id);

    return res.status(200).json({
      success: true,
      message: 'Account and all associated data permanently deleted.'
    });
  } catch (err) {
    console.error('>>> Delete account error:', err);
    return res.status(500).json({ success: false, message: 'Could not delete account.' });
  }
};

// ─── Upgrade to Premium ───────────────────────────────────────────────────────
export const upgradeToPremium = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { tier: 'premium' },
      { new: true }
    ).select('-password');

    await createNotification(user._id, {
      type: 'success', title: 'Welcome to Premium 🎉',
      message: 'Unlimited voice commands, publishing and downloads are unlocked.'
    });

    return res.status(200).json({
      success: true,
      message: 'Upgraded to Premium successfully!',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        tier: user.tier,
        usageCount: user.usageCount,
        avatar: user.name.split(' ').map(n => n[0]).join('').toUpperCase()
      }
    });
  } catch (err) {
    console.error('>>> Upgrade error:', err);
    return res.status(500).json({ success: false, message: 'Upgrade failed.' });
  }
};

// ─── Premium upgrade via Stripe (#9/#12) ──────────────────────────────────────
const PREMIUM_PRICE_CENTS = 999; // $9.99

// POST /api/auth/upgrade/checkout — start a Stripe Checkout for Premium.
// Returns { simulated:true } when Stripe isn't configured so the client can fall
// back to the one-click /api/auth/upgrade route.
export const upgradeCheckout = async (req, res) => {
  try {
    if ((req.user.tier || req.user.role) === 'premium') {
      return res.status(200).json({ success: true, alreadyPremium: true });
    }
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(200).json({ success: true, simulated: true });
    }
    const base = process.env.FRONTEND_URL || 'https://d1khpu1t6zzts5.cloudfront.net';
    const { url, sessionId } = await createUpgradeCheckoutSession({
      userId:       req.user._id.toString(),
      email:        req.user.email,
      priceInCents: PREMIUM_PRICE_CENTS,
      successUrl:   `${base}/?upgrade=success&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl:    `${base}/?upgrade=cancelled`,
    });
    return res.status(200).json({ success: true, url, sessionId });
  } catch (err) {
    console.error('>>> upgradeCheckout error:', err);
    return res.status(500).json({ success: false, message: 'Could not start the upgrade.' });
  }
};

// POST /api/auth/upgrade/confirm — verify a paid session and grant Premium.
// Lets the upgrade work without a configured webhook (dev/demo).
export const confirmUpgrade = async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ success: false, message: 'sessionId is required.' });
    if (!process.env.STRIPE_SECRET_KEY) return res.status(400).json({ success: false, message: 'Stripe is not configured.' });

    const session = await retrieveCheckoutSession(sessionId);
    if (session.payment_status !== 'paid' || session.metadata?.type !== 'premium_upgrade') {
      return res.status(400).json({ success: false, message: 'Payment not completed.' });
    }
    if (session.metadata.userId !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'This payment is for a different account.' });
    }

    const user = await User.findByIdAndUpdate(req.user._id, { tier: 'premium' }, { new: true }).select('-password');
    await createNotification(user._id, {
      type: 'success', title: 'Welcome to Premium 🎉',
      message: 'Your payment was confirmed — all Premium features are unlocked.'
    });
    return res.status(200).json({
      success: true,
      message: 'Welcome to Premium!',
      user: { id: user._id, name: user.name, email: user.email, tier: user.tier, usageCount: user.usageCount, avatar: user.name.split(' ').map(n => n[0]).join('').toUpperCase() }
    });
  } catch (err) {
    console.error('>>> confirmUpgrade error:', err);
    return res.status(500).json({ success: false, message: 'Could not confirm the upgrade.' });
  }
};
