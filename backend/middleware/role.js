/**
 * requirePremium — blocks free-tier users from premium-only routes.
 * Must be placed AFTER requireAuthentication (req.user must exist).
 */
export const requirePremium = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }
  // Support both 'tier' (existing) and 'role' (Segment 2 spec) field
  const userTier = req.user.tier || req.user.role || 'free';
  if (userTier !== 'premium') {
    return res.status(403).json({
      success: false,
      message: 'Premium subscription required.'
    });
  }
  next();
};
