/**
 * services/stripe.js  (Segment 6)
 * Stripe integration utilities for the Speak2Design marketplace.
 * Exports:
 *   - createCheckoutSession()   — Stripe Checkout Session (redirect-based)
 *   - createStripeProduct()     — creates Product + Price for a template
 *   - constructWebhookEvent()   — verifies & constructs Stripe webhook event
 *   - getStripeClient()         — lazy Stripe client getter (shared internally)
 */

import Stripe from 'stripe';

/** Lazy Stripe client — throws if key missing */
export const getStripeClient = () => {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY is not set.');
  return new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });
};

/**
 * createCheckoutSession — creates a Stripe Checkout Session for purchasing a template.
 *
 * @param {Object} params
 * @param {string} params.templateId    MongoDB Template _id (used in metadata)
 * @param {string} params.templateName  Display name on Checkout page
 * @param {number} params.priceInCents  Price in smallest currency unit (e.g. 499 for $4.99)
 * @param {string} params.stripePriceId Stripe Price ID (pre-created per template)
 * @param {string} params.buyerEmail    Customer's email for Stripe
 * @param {string} params.stripeCustomerId  Existing Stripe customer ID (optional)
 * @param {string} params.successUrl    Redirect URL on payment success
 * @param {string} params.cancelUrl     Redirect URL on payment cancel
 * @returns {Promise<{url: string, sessionId: string}>}
 */
export const createCheckoutSession = async ({
  templateId,
  templateName,
  stripePriceId,
  priceInCents,
  buyerEmail,
  stripeCustomerId,
  successUrl,
  cancelUrl,
}) => {
  const stripe = getStripeClient();

  const sessionConfig = {
    mode:                 'payment',
    payment_method_types: ['card'],
    line_items: [{
      price_data: stripePriceId ? undefined : {
        currency:     'usd',
        unit_amount:  priceInCents,
        product_data: { name: templateName },
      },
      price:    stripePriceId || undefined,
      quantity: 1,
    }],
    metadata:     { templateId, platform: 'speak2design' },
    success_url:  successUrl || `${process.env.FRONTEND_URL}/dashboard?purchase=success&templateId=${templateId}`,
    cancel_url:   cancelUrl  || `${process.env.FRONTEND_URL}/marketplace?purchase=cancelled`,
  };

  // Clean up undefined line_items keys (Stripe rejects them)
  sessionConfig.line_items[0] = Object.fromEntries(
    Object.entries(sessionConfig.line_items[0]).filter(([, v]) => v !== undefined)
  );

  // Attach existing customer or prefill email
  if (stripeCustomerId) {
    sessionConfig.customer = stripeCustomerId;
  } else if (buyerEmail) {
    sessionConfig.customer_email = buyerEmail;
  }

  const session = await stripe.checkout.sessions.create(sessionConfig);
  return { url: session.url, sessionId: session.id };
};

/**
 * createStripeProduct — creates a Stripe Product + Price for a new template listing.
 * Call this when a seller publishes a premium template.
 *
 * @param {Object} params
 * @param {string} params.templateName   Template display name
 * @param {string} params.description    Short description
 * @param {number} params.priceInCents   Price in smallest currency unit
 * @returns {Promise<{productId: string, priceId: string}>}
 */
export const createStripeProduct = async ({ templateName, description, priceInCents }) => {
  const stripe  = getStripeClient();
  const product = await stripe.products.create({
    name:        templateName,
    description: description || `Speak2Design template: ${templateName}`,
    metadata:    { platform: 'speak2design' },
  });

  const price = await stripe.prices.create({
    product:     product.id,
    unit_amount: priceInCents,
    currency:    'usd',
  });

  return { productId: product.id, priceId: price.id };
};

/**
 * constructWebhookEvent — verifies Stripe webhook signature and parses the event.
 * Must be called with the raw request body (Buffer from express.raw()).
 *
 * @param {Buffer} rawBody       Raw request body from express.raw()
 * @param {string} signature     Value of stripe-signature header
 * @returns {Stripe.Event}       Verified Stripe event object
 * @throws {Error}               If signature is invalid or webhook secret is missing
 */
export const constructWebhookEvent = (rawBody, signature) => {
  if (!process.env.STRIPE_WEBHOOK_SECRET) throw new Error('STRIPE_WEBHOOK_SECRET is not set.');
  const stripe = getStripeClient();
  return stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
};
