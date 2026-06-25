import crypto from 'crypto';
import Template from '../models/Template.js';
import User     from '../models/User.js';
import Project  from '../models/Project.js';
import {
  createStripeProduct,
  createCheckoutSession,
  constructWebhookEvent,
} from '../services/stripe.js';

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

    return res.status(200).json({ success: true, message: 'Template added to your library!' });
  } catch (err) {
    console.error('>>> Purchase template error:', err);
    return res.status(500).json({ success: false, message: 'Failed to process purchase.' });
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
