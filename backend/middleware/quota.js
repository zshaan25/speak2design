import User from '../models/User.js';

const DAILY_LIMIT = 10;

/**
 * checkVoiceQuota — enforces the daily voice command limit for free-tier users.
 * - Resets the counter at midnight (date-change detection).
 * - Premium users bypass all checks.
 * - Must be placed AFTER requireAuthentication so req.user exists.
 *
 * On success attaches req.voiceQuota = { used, limit, remaining } for controllers.
 */
export const checkVoiceQuota = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const userTier = req.user.tier || req.user.role || 'free';
    // Premium users: unlimited — skip quota check
    if (userTier === 'premium') {
      req.voiceQuota = { used: 0, limit: 'unlimited', remaining: 'unlimited' };
      return next();
    }

    // Load fresh quota fields from DB (req.user may be stale)
    const user = await User.findById(req.user._id)
      .select('voiceCommandsToday voiceCommandsDate tier role');
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found.' });
    }

    // Determine today's midnight boundary
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastUsed = user.voiceCommandsDate ? new Date(user.voiceCommandsDate) : null;
    const isNewDay = !lastUsed || lastUsed < today;

    if (isNewDay) {
      user.voiceCommandsToday = 0;
      user.voiceCommandsDate  = new Date();
      await user.save();
    }

    if (user.voiceCommandsToday >= DAILY_LIMIT) {
      // Calculate midnight tonight for reset hint
      const resetAt = new Date();
      resetAt.setHours(24, 0, 0, 0);

      return res.status(429).json({
        success: false,
        message: `Daily voice command limit reached (${DAILY_LIMIT}/day). Upgrade to Premium for unlimited commands.`,
        limitReached: true,
        commandsUsed: user.voiceCommandsToday,
        limit: DAILY_LIMIT,
        remaining: 0,
        resetAt: 'midnight tonight'
      });
    }

    // Attach quota info for controllers to embed in their responses
    req.voiceQuota = {
      used:      user.voiceCommandsToday,
      limit:     DAILY_LIMIT,
      remaining: DAILY_LIMIT - user.voiceCommandsToday
    };

    next();
  } catch (err) {
    next(err);
  }
};
