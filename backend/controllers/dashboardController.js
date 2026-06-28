/**
 * controllers/dashboardController.js  (Segment 7)
 * Single-endpoint dashboard aggregation — fetches all user data concurrently.
 *
 * GET /api/dashboard
 * Returns: designs, publishedTemplates, purchasedLibrary, voiceQuota in one request.
 */

import Project  from '../models/Project.js';
import Template from '../models/Template.js';
import User     from '../models/User.js';

const DAILY_LIMIT = 10;

/**
 * getDashboard — aggregates all data the dashboard page needs in one roundtrip.
 * Uses Promise.all() for parallel DB queries.
 *
 * Response shape:
 * {
 *   success:            true,
 *   user:               { name, email, tier, stripeCustomerId, createdAt },
 *   stats: {
 *     totalDesigns:      number,
 *     publishedTemplates: number,
 *     purchasedTemplates: number,
 *     voiceCommandsToday: number,
 *     voiceCommandsLimit: number | 'unlimited',
 *     commandsRemaining:  number | 'unlimited',
 *     usageCount:         number,    — rolling 30-day counter
 *     usageLimit:         number,    — 10 for free, 'unlimited' for premium
 *   },
 *   recentDesigns:       Design[] (last 5, no canvasState),
 *   publishedTemplates:  Template[] (templates this user published),
 *   purchasedLibrary:    Template[] (templates this user purchased),
 * }
 */
export const getDashboard = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // ── Parallel fetches ───────────────────────────────────────────────────
    const [
      recentDesigns,
      publishedTemplates,
      userFull,
    ] = await Promise.all([
      // Recent designs (summary, no canvasState)
      Project.find({ user: userId })
        .select('title isPublic shareToken updatedAt createdAt')
        .sort({ updatedAt: -1 })
        .limit(5),

      // Templates published by this user
      Template.find({ sellerId: userId, isActive: true })
        .select('title price sales downloads rating createdAt isActive')
        .sort({ createdAt: -1 }),

      // Full user doc (for tier, quota, purchasedTemplates)
      User.findById(userId)
        .select('name email tier role stripeCustomerId usageCount usageResetAt voiceCommandsToday voiceCommandsDate purchasedTemplates createdAt')
        .populate({ path: 'purchasedTemplates.templateId', select: 'title price imageUrl category' }),
    ]);

    if (!userFull) {
      return res.status(401).json({ success: false, message: 'User not found.' });
    }

    // ── Voice quota calculation ────────────────────────────────────────────
    const tier = userFull.tier || userFull.role || 'free';
    const isPremium = tier === 'premium';

    // Reset daily counter if it's a new day
    const today   = new Date();
    today.setHours(0, 0, 0, 0);
    const lastUsed = userFull.voiceCommandsDate ? new Date(userFull.voiceCommandsDate) : null;
    const isNewDay = !lastUsed || lastUsed < today;

    const voiceCommandsToday = isNewDay ? 0 : (userFull.voiceCommandsToday || 0);

    const voiceQuota = isPremium
      ? { limit: 'unlimited', used: voiceCommandsToday, remaining: 'unlimited' }
      : { limit: DAILY_LIMIT,   used: voiceCommandsToday, remaining: Math.max(0, DAILY_LIMIT - voiceCommandsToday) };

    // ── Stats ──────────────────────────────────────────────────────────────
    // totalDesigns requires a separate count (recentDesigns is capped at 5).
    // Match the main "My Projects" view exactly — exclude trashed AND archived —
    // so the headline stat never shows more than what the user actually sees.
    const totalDesigns = await Project.countDocuments({ user: userId, deletedAt: null, isArchived: false });

    const stats = {
      totalDesigns,
      publishedTemplates:  publishedTemplates.length,
      purchasedTemplates:  (userFull.purchasedTemplates || []).length,
      voiceCommandsToday:  voiceQuota.used,
      voiceCommandsLimit:  voiceQuota.limit,
      commandsRemaining:   voiceQuota.remaining,
      usageCount:          userFull.usageCount || 0,
      usageLimit:          isPremium ? 'unlimited' : 10,
    };

    // ── Build purchased library (flatten populate) ─────────────────────────
    const purchasedLibrary = (userFull.purchasedTemplates || [])
      .filter(p => p.templateId)
      .map(p => ({ ...p.templateId.toObject(), purchasedAt: p.purchasedAt }));

    return res.status(200).json({
      success: true,
      user: {
        name:             userFull.name,
        email:            userFull.email,
        tier,
        stripeCustomerId: userFull.stripeCustomerId || null,
        createdAt:        userFull.createdAt,
      },
      stats,
      recentDesigns,
      publishedTemplates,
      purchasedLibrary,
    });
  } catch (err) {
    console.error('>>> Dashboard fetch error:', err);
    next(err);
  }
};
