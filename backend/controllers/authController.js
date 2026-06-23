import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

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

    const matchedProfile = await User.findOne({ email: email.toLowerCase().trim() });
    if (!matchedProfile) {
      return res.status(401).json({ success: false, message: 'Invalid credentials entered.' });
    }

    const signatureIsAuthentic = await bcrypt.compare(password, matchedProfile.password);
    if (!signatureIsAuthentic) {
      return res.status(401).json({ success: false, message: 'Invalid credentials entered.' });
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

    const user = await User.findById(req.user._id);
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

// ─── Upgrade to Premium ───────────────────────────────────────────────────────
export const upgradeToPremium = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { tier: 'premium' },
      { new: true }
    ).select('-password');

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
