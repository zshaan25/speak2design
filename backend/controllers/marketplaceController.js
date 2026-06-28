import crypto from 'crypto';
import Template from '../models/Template.js';
import User     from '../models/User.js';
import Project  from '../models/Project.js';
import {
  createStripeProduct,
  createCheckoutSession,
  constructWebhookEvent,
} from '../services/stripe.js';
import { createNotification } from './notificationController.js';

// ─── Demo template seeding ────────────────────────────────────────────────────
// Re-adds curated starter templates so a fresh database isn't an empty marketplace.
// Idempotent: only seeds when no system templates exist. uniquenessHash is left
// null on purpose (sparse-unique index allows many nulls).
const DEMO_TEMPLATES = [
  { title: 'Modern Dashboard UI', description: 'Clean analytics dashboard with charts and stat panels.', price: 0,    imageUrl: '/previews/dashboard.svg', color: 'from-indigo-500 to-blue-600',  lang: 'English', category: 'Dashboards',    tags: ['dashboard','admin','charts'],  rating: 4.8, sales: 124, isPremiumOnly: false },
  { title: 'E-commerce Storefront', description: 'Product listing storefront with cart and pricing.',      price: 1500, imageUrl: '/previews/ecommerce.svg', color: 'from-rose-400 to-pink-600',  lang: 'English', category: 'Landing Pages', tags: ['ecommerce','shop','store'],     rating: 4.9, sales: 98,  isPremiumOnly: false },
  { title: 'اردو بلاگ ٹیمپلیٹ',      description: 'Urdu RTL blog layout with clean typography.',             price: 0,    imageUrl: '/previews/blog.svg',      color: 'from-cyan-500 to-teal-600', lang: 'Urdu',    category: 'Blogs',         tags: ['blog','urdu','rtl'],           rating: 4.7, sales: 67,  isPremiumOnly: false },
  { title: 'SaaS Landing Page',     description: 'Premium SaaS product page with hero and pricing tiers.',  price: 3500, imageUrl: '/previews/saas.svg',      color: 'from-emerald-500 to-green-600', lang: 'English', category: 'Landing Pages', tags: ['saas','startup','pricing'],    rating: 5.0, sales: 215, isPremiumOnly: true  },
  { title: 'Mobile App Kit',        description: 'Complete mobile app UI kit with all key screens.',        price: 3000, imageUrl: '/previews/mobile.svg',    color: 'from-amber-500 to-orange-600',  lang: 'English', category: 'UI Kits',       tags: ['mobile','app','kit'],          rating: 4.6, sales: 89,  isPremiumOnly: true  },
  { title: 'اردو پورٹ فولیو',        description: 'Urdu portfolio site for freelancers and creatives.',     price: 0,    imageUrl: '/previews/portfolio.svg', color: 'from-blue-600 to-indigo-800',   lang: 'Urdu',    category: 'Portfolio',     tags: ['portfolio','urdu','freelance'],rating: 4.8, sales: 45,  isPremiumOnly: false },
];

export const seedDefaultTemplates = async ({ force = false } = {}) => {
  // Only consider live system templates so leftover inactive rows don't block seeding.
  const existing = await Template.countDocuments({ sellerId: null, isActive: true });
  if (existing > 0 && !force) return { seeded: 0, skipped: true };

  const docs = DEMO_TEMPLATES.map(t => ({
    ...t,
    name: t.title,
    author: 'Speak2Design Team',
    authorName: 'Speak2Design Team',
    sellerId: null,
    // Distinct hash per demo — avoids the sparse-unique index collision that a
    // shared null value would cause.
    uniquenessHash: crypto.createHash('md5').update(`seed:${t.title}`).digest('hex'),
    canvasSnapshot: [],
    isActive: true,
  }));
  // ordered:false → skip any pre-existing duplicates instead of aborting the batch.
  let seeded = 0;
  try {
    const r = await Template.insertMany(docs, { ordered: false });
    seeded = r.length;
  } catch (err) {
    seeded = err?.insertedDocs?.length ?? 0; // partial inserts still count
    if (err.code !== 11000) console.warn('>>> Seed warning:', err.message);
  }
  console.log(`[Seed] Inserted ${seeded}/${docs.length} demo marketplace templates.`);
  return { seeded, skipped: false };
};

// POST /api/marketplace/seed — dev helper to (re)seed demo templates.
export const reseedTemplates = async (req, res) => {
  try {
    const result = await seedDefaultTemplates({ force: true });
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    console.error('>>> Reseed error:', err);
    return res.status(500).json({ success: false, message: 'Failed to seed templates.' });
  }
};

// ─── GET /api/marketplace ─────────────────────────────────────────────────────
export const getTemplates = async (req, res) => {
  try {
    const { category, lang, search } = req.query;
    const filter = { isActive: true };
    if (category) filter.category = category;
    if (lang)     filter.lang     = lang;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    const templates = await Template.find(filter)
      .sort({ createdAt: -1 })
      .select('-canvasSnapshot -buyers')
      .lean();

    return res.status(200).json({ success: true, templates });
  } catch (err) {
    console.error('>>> Get templates error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch templates.' });
  }
};

// ─── POST /api/marketplace/publish ───────────────────────────────────────────
export const publishTemplate = async (req, res) => {
  try {
    const { title, description, price, language, tags, imageUrl, designId } = req.body;

    if (!title || !description || price === undefined) {
      return res.status(400).json({ success: false, message: 'title, description, and price are required.' });
    }

    // Premium-only gating
    const seller = req.user;
    if ((seller.tier || seller.role) !== 'premium') {
      return res.status(403).json({ success: false, premiumRequired: true, message: 'Publishing requires a Premium account.' });
    }

    const priceNum = Number(price);
    if (isNaN(priceNum) || priceNum < 0) {
      return res.status(400).json({ success: false, message: 'Price must be a non-negative number.' });
    }

    // MD5 uniqueness check
    let canvasSnapshot = [];
    if (designId) {
      const sourceProject = await Project.findOne({ _id: designId, user: seller._id });
      if (sourceProject) {
        canvasSnapshot = sourceProject.canvasState || [];
      }
    }
    const uniquenessHash = crypto.createHash('md5').update(JSON.stringify(canvasSnapshot)).digest('hex');

    const existing = await Template.findOne({ uniquenessHash, isActive: true });
    if (existing) {
      return res.status(409).json({ success: false, message: 'An identical template is already listed on the marketplace.' });
    }

    // Create Stripe product if key configured and price > 0
    let stripePriceId   = null;
    let stripeProductId = null;

    if (process.env.STRIPE_SECRET_KEY && priceNum > 0) {
      try {
        const { productId, priceId } = await createStripeProduct({
          templateName: title,
          description,
          priceInCents: Math.round(priceNum * 100),
        });
        stripePriceId   = priceId;
        stripeProductId = productId;
      } catch (stripeErr) {
        console.warn('>>> Stripe product creation skipped:', stripeErr.message);
      }
    }

    const template = await Template.create({
      title,
      name:            title,
      description,
      price:           priceNum,
      lang:            language || 'English',
      tags:            Array.isArray(tags) ? tags : (tags || '').split(',').map(t => t.trim()).filter(Boolean),
      imageUrl:        imageUrl || '',
      sellerId:        seller._id,
      authorName:      seller.name,
      author:          seller.name,
      canvasSnapshot,
      uniquenessHash,
      stripePriceId,
      stripeProductId,
      isActive:        true,
      designId:        designId || null,
    });

    // Mark source design as public
    if (designId) {
      await Project.findOneAndUpdate(
        { _id: designId, user: seller._id },
        { isPublic: true }
      );
    }

    await createNotification(seller._id, {
      type: 'publish',
      title: 'Template published',
      message: `"${title}" is now live on the marketplace.`,
    });

    return res.status(201).json({ success: true, message: 'Template published successfully!', template });
  } catch (err) {
    console.error('>>> Publish template error:', err);
    return res.status(500).json({ success: false, message: 'Failed to publish template.' });
  }
};

// ─── POST /api/marketplace/checkout/:id ──────────────────────────────────────
export const createCheckoutSessionHandler = async (req, res) => {
  try {
    const template = await Template.findById(req.params.id);
    if (!template || !template.isActive) {
      return res.status(404).json({ success: false, message: 'Template not found.' });
    }

    // Free templates — use purchase endpoint instead
    if (!template.price || template.price === 0) {
      return res.status(400).json({ success: false, message: 'Use /purchase for free templates.' });
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      // Simulated — no real Stripe key configured
      return res.status(200).json({ success: true, simulated: true, message: 'Stripe not configured — payment simulated.' });
    }

    const session = await createCheckoutSession({
      templateId:    template._id.toString(),
      templateName:  template.title,
      priceInCents:  Math.round(template.price * 100),
      stripePriceId: template.stripePriceId,
      successUrl:    `${process.env.FRONTEND_URL || 'http://localhost:5173'}/?purchase=success&templateId=${template._id}`,
      cancelUrl:     `${process.env.FRONTEND_URL || 'http://localhost:5173'}/?purchase=cancelled`,
    });

    return res.status(200).json({ success: true, url: session.url, sessionId: session.id });
  } catch (err) {
    console.error('>>> Checkout session error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create checkout session.' });
  }
};

// ─── POST /api/marketplace/webhook ───────────────────────────────────────────
export const webhookHandler = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = constructWebhookEvent(req.body, sig);
  } catch (err) {
    console.error('>>> Webhook signature error:', err.message);
    return res.status(400).json({ success: false, message: `Webhook Error: ${err.message}` });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    // Premium upgrade fulfillment (#9/#12)
    if (session.metadata?.type === 'premium_upgrade' && session.metadata?.userId) {
      try {
        await User.findByIdAndUpdate(session.metadata.userId, { tier: 'premium' });
        console.log(`[Webhook] Premium granted to user ${session.metadata.userId}`);
      } catch (e) { console.error('>>> Premium webhook error:', e.message); }
      return res.status(200).json({ received: true });
    }

    const templateId = session.metadata?.templateId;
    const buyerEmail = session.customer_details?.email;

    if (templateId) {
      try {
        const buyer = await User.findOne({ email: buyerEmail });
        const template = await Template.findById(templateId);

        if (buyer && template) {
          // Idempotent — only add if not already in library
          const alreadyOwns = buyer.purchasedTemplates.some(
            p => p.templateId?.toString() === templateId
          );
          if (!alreadyOwns) {
            buyer.purchasedTemplates.push({ templateId: template._id, purchasedAt: new Date() });
            if (!buyer.ownedTemplates.includes(template._id)) {
              buyer.ownedTemplates.push(template._id);
            }
            await buyer.save();
          }

          // Increment template sales/downloads
          await Template.findByIdAndUpdate(templateId, { $inc: { sales: 1, downloads: 1 } });

          console.log(`[Webhook] Fulfilled purchase: ${buyerEmail} → template ${templateId}`);
        }
      } catch (fulfillErr) {
        console.error('>>> Webhook fulfillment error:', fulfillErr.message);
      }
    }
  }

  return res.status(200).json({ received: true });
};

// ─── POST /api/marketplace/purchase/:id (free templates only) ────────────────
export const purchaseTemplate = async (req, res) => {
  try {
    const template = await Template.findById(req.params.id);
    if (!template || !template.isActive) {
      return res.status(404).json({ success: false, message: 'Template not found.' });
    }

    if (template.price > 0) {
      return res.status(400).json({ success: false, message: 'This is a paid template. Use the Stripe checkout flow.' });
    }

    const buyer = await User.findById(req.user._id);
    const alreadyOwns = buyer.purchasedTemplates.some(
      p => p.templateId?.toString() === template._id.toString()
    );
    if (alreadyOwns) {
      return res.status(200).json({ success: true, message: 'Already in your library.' });
    }

    buyer.purchasedTemplates.push({ templateId: template._id, purchasedAt: new Date() });
    if (!buyer.ownedTemplates.includes(template._id)) {
      buyer.ownedTemplates.push(template._id);
    }
    await buyer.save();
    await Template.findByIdAndUpdate(template._id, { $inc: { downloads: 1 } });

    await createNotification(buyer._id, {
      type: 'purchase',
      title: 'Added to your library',
      message: `"${template.title}" is now in your library.`,
    });
    if (template.sellerId) {
      await createNotification(template.sellerId, {
        type: 'sale',
        title: 'Your template was downloaded',
        message: `"${template.title}" was added by another user.`,
      });
    }

    return res.status(200).json({ success: true, message: 'Template added to your library!' });
  } catch (err) {
    console.error('>>> Purchase template error:', err);
    return res.status(500).json({ success: false, message: 'Failed to process purchase.' });
  }
};

// POST /api/marketplace/cart/checkout — bulk add cart items to the library.
// Simulated payment (the app already falls back to simulated payments when Stripe
// isn't configured); fine for the marketplace demo. Body: { templateIds: [] }.
export const checkoutCart = async (req, res) => {
  try {
    const ids = Array.isArray(req.body.templateIds) ? req.body.templateIds : [];
    if (ids.length === 0) return res.status(400).json({ success: false, message: 'Cart is empty.' });

    const buyer = await User.findById(req.user._id);
    const templates = await Template.find({ _id: { $in: ids }, isActive: true });

    let added = 0;
    for (const template of templates) {
      const owns = buyer.purchasedTemplates.some(p => p.templateId?.toString() === template._id.toString());
      if (owns) continue;
      buyer.purchasedTemplates.push({ templateId: template._id, purchasedAt: new Date() });
      if (!buyer.ownedTemplates.includes(template._id)) buyer.ownedTemplates.push(template._id);
      added++;
      await Template.findByIdAndUpdate(template._id, { $inc: { downloads: 1 } });
      if (template.sellerId) {
        await createNotification(template.sellerId, {
          type: 'sale',
          title: 'Your template sold',
          message: `"${template.title}" was purchased.`,
        });
      }
    }
    await buyer.save();

    await createNotification(buyer._id, {
      type: 'purchase',
      title: 'Order complete',
      message: `${added} template${added !== 1 ? 's' : ''} added to your library.`,
    });

    return res.status(200).json({ success: true, added, message: `${added} item(s) added to your library.` });
  } catch (err) {
    console.error('>>> Cart checkout error:', err);
    return res.status(500).json({ success: false, message: 'Checkout failed.' });
  }
};

// ─── DELETE /api/marketplace/unpublish/:id ────────────────────────────────────
export const unpublishTemplate = async (req, res) => {
  try {
    const template = await Template.findById(req.params.id);
    if (!template) return res.status(404).json({ success: false, message: 'Template not found.' });

    if (template.sellerId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You can only unpublish your own templates.' });
    }

    template.isActive = false;
    await template.save();

    // Unmark source design's isPublic flag if it exists
    if (template.designId) {
      await Project.findOneAndUpdate(
        { _id: template.designId, user: req.user._id },
        { isPublic: false }
      );
    }

    return res.status(200).json({ success: true, message: 'Template unpublished.' });
  } catch (err) {
    console.error('>>> Unpublish error:', err);
    return res.status(500).json({ success: false, message: 'Failed to unpublish template.' });
  }
};

// ─── POST /api/marketplace/:id/use — open a template as an editable project (#14)
export const createProjectFromTemplate = async (req, res) => {
  try {
    const template = await Template.findById(req.params.id);
    if (!template || !template.isActive) {
      return res.status(404).json({ success: false, message: 'Template not found.' });
    }
    // Premium-only templates require a premium buyer/owner.
    if (template.isPremiumOnly && (req.user.tier || req.user.role) !== 'premium') {
      const owns = (req.user.ownedTemplates || []).some(id => id.toString() === template._id.toString());
      if (!owns) return res.status(403).json({ success: false, premiumRequired: true, message: 'This is a Premium template. Upgrade or purchase it first.' });
    }

    const project = await Project.create({
      user:        req.user._id,
      title:       `${template.title} (copy)`,
      language:    ['English', 'Urdu'].includes(template.lang) ? template.lang : 'English',
      canvasState: Array.isArray(template.canvasSnapshot) ? template.canvasSnapshot : [],
    });

    return res.status(201).json({ success: true, project });
  } catch (err) {
    console.error('>>> Use template error:', err);
    return res.status(500).json({ success: false, message: 'Failed to open template.' });
  }
};

// ─── GET /api/marketplace/library ────────────────────────────────────────────
export const getMyLibrary = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate({ path: 'purchasedTemplates.templateId', select: 'title description imageUrl price lang category' });

    const library = (user.purchasedTemplates || [])
      .filter(p => p.templateId)
      .map(p => ({ ...p.templateId.toObject(), purchasedAt: p.purchasedAt }));

    return res.status(200).json({ success: true, templates: library });
  } catch (err) {
    console.error('>>> Get library error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch library.' });
  }
};
