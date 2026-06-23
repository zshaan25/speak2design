import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const requireAuthentication = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access Denied: Missing authorization headers.'
      });
    }

    const token = authHeader.split(' ')[1];
    const decryptedPayload = jwt.verify(token, process.env.JWT_SECRET);

    const userProfile = await User.findById(decryptedPayload.id).select('-password');
    if (!userProfile) {
      return res.status(401).json({
        success: false,
        message: 'Access Denied: Target profile account data is no longer available.'
      });
    }

    // Attach active account contexts onto request references
    req.user = userProfile;
    next();
  } catch (error) {
    console.error('>>> Authentication Layer Violation Token Error:', error.message);
    return res.status(403).json({
      success: false,
      message: 'Access Denied: Revoked, expired, or invalid authorization credentials.'
    });
  }
};