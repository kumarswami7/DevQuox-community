import crypto from 'crypto';
import Stripe from 'stripe';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const PAYMENT_PROVIDER = process.env.PAYMENT_PROVIDER || (STRIPE_SECRET_KEY && !STRIPE_SECRET_KEY.includes('replace_with') ? 'stripe' : 'mock');

let stripeClient = null;
if (STRIPE_SECRET_KEY && !STRIPE_SECRET_KEY.includes('replace_with')) {
  try {
    stripeClient = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    });
  } catch (err) {
    console.warn('[PaymentProvider] Failed to initialize Stripe client:', err.message);
  }
}

/**
 * Returns active provider name ('stripe' or 'mock')
 */
export const getPaymentProviderName = () => {
  if (process.env.NODE_ENV === 'test') return 'mock';
  return stripeClient ? 'stripe' : 'mock';
};

/**
 * Creates a checkout session for milestone funding
 */
export const createCheckoutSession = async ({
  contract,
  milestone,
  payer,
  recipient,
  successUrl,
  cancelUrl,
  clientReferenceId,
}) => {
  const provider = getPaymentProviderName();
  const currency = (milestone.currency || contract.currency || 'USD').toLowerCase();
  const amountMinorUnits = milestone.amountMinorUnits;

  if (!amountMinorUnits || amountMinorUnits <= 0) {
    throw new Error('Invalid milestone amount for checkout session creation');
  }

  // 1. Stripe Live / Test Mode
  if (provider === 'stripe' && stripeClient) {
    const session = await stripeClient.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: `Milestone: ${milestone.title}`,
              description: `Project: ${contract.title || 'DevConnect Contract'} - Milestone Deliverable Funding`,
            },
            unit_amount: amountMinorUnits,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      customer_email: payer.email,
      client_reference_id: clientReferenceId || String(milestone._id),
      success_url: successUrl || `${process.env.CLIENT_URL || 'http://localhost:3000'}/projects/${contract.projectId}/workspace?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${process.env.CLIENT_URL || 'http://localhost:3000'}/projects/${contract.projectId}/workspace?payment=cancelled`,
      metadata: {
        projectId: String(contract.projectId),
        contractId: String(contract._id),
        milestoneId: String(milestone._id),
        payerId: String(payer._id || payer.id),
        recipientId: String(recipient?._id || recipient?.id || contract.developerId || ''),
        amountMinorUnits: String(amountMinorUnits),
        currency: currency.toUpperCase(),
      },
    });

    return {
      provider: 'stripe',
      sessionId: session.id,
      sessionUrl: session.url,
      amountMinorUnits,
      currency: currency.toUpperCase(),
      paymentIntentId: session.payment_intent,
    };
  }

  // 2. Mock / Sandbox Mode for testing and local development
  const mockSessionId = `cs_mock_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
  const mockPaymentIntentId = `pi_mock_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
  const mockUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/checkout/mock?session_id=${mockSessionId}&milestone_id=${milestone._id}`;

  return {
    provider: 'mock',
    sessionId: mockSessionId,
    sessionUrl: mockUrl,
    amountMinorUnits,
    currency: currency.toUpperCase(),
    paymentIntentId: mockPaymentIntentId,
  };
};

/**
 * Verifies webhook payload authenticity using cryptographic signature
 */
export const verifyWebhookEvent = ({ rawBody, signature, webhookSecret }) => {
  const provider = getPaymentProviderName();
  const secret = process.env.NODE_ENV === 'test'
    ? (webhookSecret || 'whsec_mock_devconnect_test_secret')
    : (webhookSecret || STRIPE_WEBHOOK_SECRET || 'whsec_mock_devconnect_test_secret');

  // 1. Stripe Live Mode
  if (provider === 'stripe' && stripeClient && !secret.includes('mock')) {
    try {
      const event = stripeClient.webhooks.constructEvent(rawBody, signature, secret);
      return { success: true, event };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  // 2. Mock / Test Mode Signature Verification (HMAC-SHA256)
  try {
    if (!signature) {
      return { success: false, error: 'Missing webhook signature header' };
    }

    const payloadString = Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : (typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody));

    // Handle stripe-style header "t=12345,v1=abc..."
    let signatureHash = signature;
    if (signature.includes('v1=')) {
      const parts = signature.split(',').reduce((acc, part) => {
        const [k, v] = part.split('=');
        acc[k] = v;
        return acc;
      }, {});
      signatureHash = parts.v1;
    }

    const expectedHash = crypto
      .createHmac('sha256', secret)
      .update(payloadString)
      .digest('hex');

    if (signatureHash !== expectedHash) {
      return { success: false, error: 'Invalid webhook signature' };
    }

    const parsedEvent = typeof rawBody === 'string' || Buffer.isBuffer(rawBody) ? JSON.parse(payloadString) : rawBody;
    return { success: true, event: parsedEvent };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

/**
 * Initiates a verified refund through payment provider
 */
export const processRefund = async ({ paymentIntentId, amountMinorUnits, reason }) => {
  const provider = getPaymentProviderName();

  if (provider === 'stripe' && stripeClient && !paymentIntentId.startsWith('pi_mock_')) {
    const refund = await stripeClient.refunds.create({
      payment_intent: paymentIntentId,
      amount: amountMinorUnits,
      reason: reason || 'requested_by_customer',
    });

    return {
      success: true,
      refundId: refund.id,
      status: refund.status,
      amountMinorUnits: refund.amount,
      provider: 'stripe',
    };
  }

  // Mock refund
  const mockRefundId = `re_mock_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
  return {
    success: true,
    refundId: mockRefundId,
    status: 'succeeded',
    amountMinorUnits,
    provider: 'mock',
  };
};

export default {
  getPaymentProviderName,
  createCheckoutSession,
  verifyWebhookEvent,
  processRefund,
};
