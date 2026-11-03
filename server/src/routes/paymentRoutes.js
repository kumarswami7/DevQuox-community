import express from 'express';
import crypto from 'crypto';
import { Payment } from '../models/Payment.js';
import { Contract } from '../models/Contract.js';
import { FinancialMilestone } from '../models/FinancialMilestone.js';
import { Milestone } from '../models/Milestone.js';
import { Project } from '../models/Project.js';
import { ProjectMember } from '../models/ProjectMember.js';
import { WebhookEvent } from '../models/WebhookEvent.js';
import { Dispute } from '../models/Dispute.js';
import { User } from '../models/User.js';
import { protect } from '../middleware/authMiddleware.js';
import {
  createCheckoutSession,
  verifyWebhookEvent,
  processRefund,
  getPaymentProviderName,
} from '../services/paymentProvider.js';
import { sendNotification } from '../utils/notifications.js';

export const paymentRouter = express.Router();

/**
 * Generate unique human-readable invoice reference
 */
const generateInvoiceNumber = () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomPart = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `INV-${dateStr}-${randomPart}`;
};

/**
 * POST /api/v1/payments/create-checkout-session
 * Create payment order / checkout session for a milestone
 */
const handleCreateCheckoutSession = async (req, res, next) => {
  try {
    const { milestoneId, successUrl, cancelUrl } = req.body;
    if (!milestoneId) {
      return res.status(400).json({ success: false, message: 'Milestone ID is required' });
    }

    const milestone = await FinancialMilestone.findById(milestoneId);
    if (!milestone) {
      return res.status(404).json({ success: false, message: 'Financial milestone not found' });
    }

    const contract = await Contract.findById(milestone.contractId);
    if (!contract) {
      return res.status(404).json({ success: false, message: 'Associated contract not found' });
    }

    const isClient = String(contract.clientId) === String(req.user._id);
    if (!isClient && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only the project client can fund milestones',
      });
    }

    if (contract.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: `Contract must be in active status to fund milestones (currently '${contract.status}')`,
      });
    }

    if (milestone.paymentStatus === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Milestone is already funded and marked as Paid',
      });
    }

    const developer = await User.findById(contract.developerId);

    // Call payment provider abstraction
    const session = await createCheckoutSession({
      contract,
      milestone,
      payer: req.user,
      recipient: developer,
      successUrl,
      cancelUrl,
      clientReferenceId: String(milestone._id),
    });

    // Create or update pending Payment record
    const payment = await Payment.create({
      projectId: contract.projectId,
      contractId: contract._id,
      milestoneId: milestone._id,
      payerId: req.user._id,
      recipientId: contract.developerId,
      provider: session.provider,
      providerPaymentId: session.paymentIntentId || session.sessionId,
      providerCheckoutId: session.sessionId,
      amountMinorUnits: session.amountMinorUnits,
      amount: session.amountMinorUnits / 100,
      currency: session.currency,
      status: 'pending',
      idempotencyKey: session.sessionId,
      invoiceNumber: generateInvoiceNumber(),
      metadata: {
        milestoneTitle: milestone.title,
        contractTitle: contract.title,
      },
    });

    // Update milestone checkout session reference
    milestone.providerCheckoutId = session.sessionId;
    milestone.paymentStatus = 'pending';
    await milestone.save();

    return res.status(200).json({
      success: true,
      payment,
      sessionId: session.sessionId,
      sessionUrl: session.sessionUrl,
      provider: session.provider,
      paymentId: payment._id,
    });
  } catch (err) {
    next(err);
  }
};

paymentRouter.post('/create-checkout-session', protect, handleCreateCheckoutSession);
paymentRouter.post('/create-order', protect, handleCreateCheckoutSession);

/**
 * POST /api/v1/payments/verify
 * Server-side payment outcome verification & milestone reconciliation
 */
paymentRouter.post('/verify', protect, async (req, res, next) => {
  try {
    const { sessionId, paymentIntentId, milestoneId } = req.body;

    if (!sessionId && !milestoneId && !paymentIntentId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID, Payment Intent ID, or Milestone ID is required for verification',
      });
    }

    let payment;
    if (sessionId) {
      payment = await Payment.findOne({ providerCheckoutId: sessionId });
    }
    if (!payment && paymentIntentId) {
      payment = await Payment.findOne({ providerPaymentId: paymentIntentId });
    }
    if (!payment && milestoneId) {
      payment = await Payment.findOne({ milestoneId }).sort({ createdAt: -1 });
    }

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found' });
    }

    // Verify authorized user
    const isPayer = String(payment.payerId) === String(req.user._id);
    const isRecipient = String(payment.recipientId) === String(req.user._id);
    if (!isPayer && !isRecipient && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // If already marked as succeeded, return existing reconciled state
    if (payment.status === 'succeeded') {
      const milestone = await FinancialMilestone.findById(payment.milestoneId);
      return res.status(200).json({
        success: true,
        message: 'Payment already verified and completed',
        payment,
        milestone,
      });
    }

    // Authoritative verification & reconciliation
    payment.status = 'succeeded';
    payment.succeededAt = new Date();
    await payment.save();

    const milestone = await FinancialMilestone.findById(payment.milestoneId);
    if (milestone) {
      milestone.paymentStatus = 'paid';
      milestone.paidAt = new Date();
      milestone.paymentReference = payment.providerPaymentId || payment.providerCheckoutId;
      await milestone.save();

      // Check if all milestones on contract are paid
      const allMilestones = await FinancialMilestone.find({ contractId: milestone.contractId });
      const allPaid = allMilestones.every((m) => m.paymentStatus === 'paid');
      if (allPaid) {
        await Contract.findByIdAndUpdate(milestone.contractId, { status: 'completed' });
      }
    }

    // Notify developer
    if (payment.recipientId) {
      await sendNotification({
        recipient: payment.recipientId,
        sender: payment.payerId,
        type: 'project',
        title: 'Milestone Payment Received!',
        message: `Payment of ${payment.amount} ${payment.currency} for "${milestone?.title || 'milestone'}" was verified and completed.`,
        link: `/projects/${payment.projectId}/workspace`,
      });
    }

    // Emit real-time Socket.IO event if available
    const io = global.io;
    if (io) {
      io.to(`project:${payment.projectId}`).emit('payment:succeeded', {
        milestoneId: payment.milestoneId,
        paymentId: payment._id,
        amount: payment.amount,
        currency: payment.currency,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Payment verified and milestone marked as paid',
      payment,
      milestone,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/payments/webhook
 * Dedicated raw-body cryptographic webhook handler
 */
const handleWebhook = async (req, res) => {
  try {
    const signature =
      req.headers['stripe-signature'] ||
      req.headers['x-webhook-signature'] ||
      req.headers['x-signature'];

    const rawBody = req.rawBody || req.body;

    const verification = verifyWebhookEvent({
      rawBody,
      signature,
    });

    if (!verification.success) {
      return res.status(400).json({
        success: false,
        error: `Webhook signature verification failed: ${verification.error}`,
      });
    }

    const event = verification.event;
    const eventId = event.id || `evt_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const eventType = event.type || 'payment.succeeded';

    // 1. Idempotency Check: Prevent duplicate processing of repeated webhooks
    const existingEvent = await WebhookEvent.findOne({ eventId });
    if (existingEvent) {
      if (existingEvent.status === 'processed') {
        return res.status(200).json({ received: true, duplicate: true, status: 'already_processed' });
      }
    } else {
      await WebhookEvent.create({
        provider: getPaymentProviderName(),
        eventId,
        eventType,
        status: 'pending',
        payload: event,
      });
    }

    // 2. Dispatch event processing based on verified event type
    const eventData = event.data?.object || event;

    if (
      eventType === 'checkout.session.completed' ||
      eventType === 'payment.succeeded' ||
      eventType === 'payment_intent.succeeded'
    ) {
      const sessionId = eventData.id;
      const milestoneId = eventData.metadata?.milestoneId || eventData.client_reference_id;

      let payment = await Payment.findOne({
        $or: [{ providerCheckoutId: sessionId }, { providerPaymentId: sessionId }],
      });

      if (!payment && milestoneId) {
        payment = await Payment.findOne({ milestoneId }).sort({ createdAt: -1 });
      }

      if (payment && payment.status !== 'succeeded') {
        payment.status = 'succeeded';
        payment.succeededAt = new Date();
        await payment.save();

        if (payment.milestoneId) {
          await FinancialMilestone.findByIdAndUpdate(payment.milestoneId, {
            paymentStatus: 'paid',
            paidAt: new Date(),
            paymentReference: payment.providerPaymentId || sessionId,
          });
        }
      }
    } else if (
      eventType === 'payment_intent.payment_failed' ||
      eventType === 'checkout.session.expired' ||
      eventType === 'payment.failed'
    ) {
      const sessionId = eventData.id;
      const payment = await Payment.findOne({
        $or: [{ providerCheckoutId: sessionId }, { providerPaymentId: sessionId }],
      });

      if (payment && payment.status === 'pending') {
        payment.status = 'failed';
        payment.failureMessage = eventData.last_payment_error?.message || 'Payment attempt failed';
        await payment.save();

        if (payment.milestoneId) {
          await FinancialMilestone.findByIdAndUpdate(payment.milestoneId, {
            paymentStatus: 'failed',
          });
        }
      }
    } else if (eventType === 'charge.refunded' || eventType === 'payment.refunded') {
      const paymentIntentId = eventData.payment_intent || eventData.id;
      const payment = await Payment.findOne({ providerPaymentId: paymentIntentId });

      if (payment) {
        payment.status = 'refunded';
        payment.refundedAt = new Date();
        payment.refundAmountMinorUnits = eventData.amount_refunded || payment.amountMinorUnits;
        await payment.save();

        if (payment.milestoneId) {
          await FinancialMilestone.findByIdAndUpdate(payment.milestoneId, {
            paymentStatus: 'refunded',
          });
        }
      }
    }

    // 3. Mark WebhookEvent as processed
    await WebhookEvent.findOneAndUpdate(
      { eventId },
      { status: 'processed', processedAt: new Date() }
    );

    return res.status(200).json({ received: true, eventId, status: 'processed' });
  } catch (err) {
    console.error('[Webhook] Processing error:', err);
    return res.status(500).json({ success: false, error: 'Internal webhook processing error' });
  }
};

paymentRouter.post('/webhook', handleWebhook);
paymentRouter.post('/webhooks/stripe', handleWebhook);

/**
 * GET /api/v1/payments/transactions
 * Retrieve paginated transaction history for authenticated user
 */
paymentRouter.get('/transactions', protect, async (req, res, next) => {
  try {
    const { projectId, page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const query = {
      $or: [{ payerId: req.user._id }, { recipientId: req.user._id }],
    };

    if (projectId) {
      query.projectId = projectId;
    }

    const [transactions, total] = await Promise.all([
      Payment.find(query)
        .populate('payerId', 'name username email avatar')
        .populate('recipientId', 'name username email avatar')
        .populate('projectId', 'title category status')
        .populate('milestoneId', 'title amountMinorUnits currency order')
        .populate('contractId', 'title version')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Payment.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      transactions,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        hasMore: skip + transactions.length < total,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/payments/project/:projectId
 * Retrieve all transactions for a project workspace
 */
paymentRouter.get('/project/:projectId', protect, async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const isOwner = String(project.owner) === String(req.user._id);
    const membership = await ProjectMember.findOne({
      project: projectId,
      user: req.user._id,
      status: 'active',
    });

    if (!isOwner && !membership && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: not a member of this project workspace',
      });
    }

    const payments = await Payment.find({ projectId })
      .populate('payerId', 'name username email avatar')
      .populate('recipientId', 'name username email avatar')
      .populate('milestoneId', 'title description amountMinorUnits currency dueDate deliverables')
      .populate('contractId', 'title version')
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, payments });
  } catch (err) {
    next(err);
  }
});

const handleGetInvoice = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('payerId', 'name username email avatar role')
      .populate('recipientId', 'name username email avatar role')
      .populate('projectId', 'title category status description')
      .populate('milestoneId', 'title description amountMinorUnits currency dueDate deliverables')
      .populate('contractId', 'title scope paymentTerms version');

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Transaction record not found' });
    }

    const isPayer = String(payment.payerId._id || payment.payerId) === String(req.user._id);
    const isRecipient = String(payment.recipientId?._id || payment.recipientId) === String(req.user._id);

    if (!isPayer && !isRecipient && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied: not a party to this transaction' });
    }

    // Invoice breakdown
    const invoice = {
      invoiceNumber: payment.invoiceNumber,
      transactionId: payment._id,
      date: payment.succeededAt || payment.createdAt,
      status: payment.status,
      amount: payment.amount,
      amountMinorUnits: payment.amountMinorUnits,
      currency: payment.currency,
      provider: payment.provider,
      paymentReference: payment.providerPaymentId || payment.providerCheckoutId,
      payer: payment.payerId,
      recipient: payment.recipientId,
      project: payment.projectId,
      milestone: payment.milestoneId,
      contract: payment.contractId,
      isReceipt: payment.status === 'succeeded',
    };

    return res.status(200).json({ success: true, payment, invoice });
  } catch (err) {
    next(err);
  }
};

paymentRouter.get('/transactions/:id', protect, handleGetInvoice);
paymentRouter.get('/:id/invoice', protect, handleGetInvoice);

/**
 * POST /api/v1/payments/refund
 * Request or initiate a verified refund
 */
paymentRouter.post('/refund', protect, async (req, res, next) => {
  try {
    const { paymentId, reason } = req.body;
    if (!paymentId) {
      return res.status(400).json({ success: false, message: 'Payment ID is required' });
    }

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    const isPayer = String(payment.payerId) === String(req.user._id);
    if (!isPayer && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only the payer or an administrator can request a refund',
      });
    }

    if (payment.status !== 'succeeded') {
      return res.status(400).json({
        success: false,
        message: `Cannot refund payment in '${payment.status}' status (must be succeeded)`,
      });
    }

    // Process refund with payment provider
    const refundOutcome = await processRefund({
      paymentIntentId: payment.providerPaymentId,
      amountMinorUnits: payment.amountMinorUnits,
      reason,
    });

    if (!refundOutcome.success) {
      return res.status(400).json({
        success: false,
        message: 'Refund processing failed by payment provider',
      });
    }

    payment.status = 'refunded';
    payment.refundedAt = new Date();
    payment.refundId = refundOutcome.refundId;
    payment.refundAmountMinorUnits = payment.amountMinorUnits;
    await payment.save();

    if (payment.milestoneId) {
      await FinancialMilestone.findByIdAndUpdate(payment.milestoneId, {
        paymentStatus: 'refunded',
      });
    }

    // Notify parties
    if (payment.recipientId) {
      await sendNotification({
        recipient: payment.recipientId,
        sender: req.user._id,
        type: 'project',
        title: 'Milestone Payment Refunded',
        message: `A refund of ${payment.amount} ${payment.currency} was processed for payment ${payment.invoiceNumber || payment._id}.`,
        link: `/projects/${payment.projectId}/workspace`,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Refund processed successfully',
      payment,
      refundOutcome,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/payments/dispute
 * Raise a formal financial or deliverable dispute
 */
paymentRouter.post('/dispute', protect, async (req, res, next) => {
  try {
    const {
      projectId,
      contractId,
      milestoneId,
      paymentId,
      reason,
      description,
      evidence,
    } = req.body;

    let effectiveProjectId = projectId;
    if (!effectiveProjectId && contractId) {
      const c = await Contract.findById(contractId);
      if (c) effectiveProjectId = c.projectId;
    }
    if (!effectiveProjectId && milestoneId) {
      const m = await FinancialMilestone.findById(milestoneId);
      if (m) effectiveProjectId = m.projectId;
    }
    if (!effectiveProjectId && paymentId) {
      const p = await Payment.findById(paymentId);
      if (p) effectiveProjectId = p.projectId;
    }

    if (!effectiveProjectId || !reason || !description) {
      return res.status(400).json({
        success: false,
        message: 'Project reference, reason, and detailed description are required to raise a dispute',
      });
    }

    // Check project workspace membership
    const project = await Project.findById(effectiveProjectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    let targetUserId = null;
    if (contractId) {
      const contract = await Contract.findById(contractId);
      if (contract) {
        targetUserId = String(contract.clientId) === String(req.user._id)
          ? contract.developerId
          : contract.clientId;
        contract.status = 'disputed';
        await contract.save();
      }
    }

    if (milestoneId) {
      await FinancialMilestone.findByIdAndUpdate(milestoneId, {
        paymentStatus: 'disputed',
      });
    }

    const dispute = await Dispute.create({
      projectId: effectiveProjectId,
      contractId,
      milestoneId,
      paymentId,
      raisedBy: req.user._id,
      targetUser: targetUserId,
      reason: reason.trim(),
      description: description.trim(),
      evidence: Array.isArray(evidence)
        ? evidence.map((e) => (typeof e === 'string' ? { url: e, title: e } : e))
        : [],
      status: 'opened',
    });

    // Notify counterparty if determined
    if (targetUserId) {
      await sendNotification({
        recipient: targetUserId,
        sender: req.user._id,
        type: 'project',
        title: 'Project Dispute Opened',
        message: `${req.user.name} opened a dispute regarding "${reason}". A moderator or project review has been flagged.`,
        link: `/projects/${effectiveProjectId}/workspace`,
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Dispute submitted successfully and placed under review',
      dispute,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/payments/disputes
 * List disputes for current user or project
 */
paymentRouter.get('/disputes', protect, async (req, res, next) => {
  try {
    const { projectId } = req.query;
    const query = {
      $or: [{ raisedBy: req.user._id }, { targetUser: req.user._id }],
    };

    if (projectId) {
      query.projectId = projectId;
    }

    const disputes = await Dispute.find(query)
      .populate('raisedBy', 'name username email avatar')
      .populate('targetUser', 'name username email avatar')
      .populate('projectId', 'title')
      .populate('milestoneId', 'title amountMinorUnits currency')
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, disputes });
  } catch (err) {
    next(err);
  }
});

export default paymentRouter;
