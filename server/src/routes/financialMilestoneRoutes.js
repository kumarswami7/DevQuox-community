import express from 'express';
import { FinancialMilestone } from '../models/FinancialMilestone.js';
import { Contract } from '../models/Contract.js';
import { Project } from '../models/Project.js';
import { protect } from '../middleware/authMiddleware.js';
import { sendNotification } from '../utils/notifications.js';

export const financialMilestoneRouter = express.Router();

/**
 * Helper to verify user permissions on milestone/contract
 */
const verifyMilestoneAccess = async (milestone, userId) => {
  const contract = await Contract.findById(milestone.contractId);
  if (!contract) return { allowed: false, error: 'Associated contract not found' };

  const userIdStr = String(userId);
  const clientIdStr = String(contract.clientId?._id || contract.clientId);
  const developerIdStr = String(contract.developerId?._id || contract.developerId);

  const isClient = clientIdStr === userIdStr;
  const isDeveloper = developerIdStr === userIdStr;

  return {
    allowed: isClient || isDeveloper,
    isClient,
    isDeveloper,
    contract,
  };
};

/**
 * GET /api/v1/financial-milestones/contract/:contractId
 * List financial milestones for a contract
 */
financialMilestoneRouter.get('/contract/:contractId', protect, async (req, res, next) => {
  try {
    const { contractId } = req.params;
    const contract = await Contract.findById(contractId);
    if (!contract) {
      return res.status(404).json({ success: false, message: 'Contract not found' });
    }

    const userIdStr = String(req.user._id);
    const isClient = String(contract.clientId?._id || contract.clientId) === userIdStr;
    const isDeveloper = String(contract.developerId?._id || contract.developerId) === userIdStr;

    // Check project owner
    let isOwner = false;
    if (contract.projectId) {
      const project = await Project.findById(contract.projectId);
      if (project && String(project.owner) === userIdStr) isOwner = true;
    }

    if (!isClient && !isDeveloper && !isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const milestones = await FinancialMilestone.find({ contractId }).sort({ order: 1 });
    return res.status(200).json({ success: true, milestones });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/financial-milestones
 * Create a new financial milestone for a contract
 */
financialMilestoneRouter.post('/', protect, async (req, res, next) => {
  try {
    const {
      contractId,
      title,
      description,
      deliverables,
      amountMinorUnits,
      amount,
      dueDate,
    } = req.body;

    if (!contractId || !title) {
      return res.status(400).json({
        success: false,
        message: 'Contract ID and milestone title are required',
      });
    }

    const contract = await Contract.findById(contractId);
    if (!contract) {
      return res.status(404).json({ success: false, message: 'Contract not found' });
    }

    const isClient = String(contract.clientId) === String(req.user._id);
    if (!isClient && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only the client can define milestones on this contract',
      });
    }

    if (contract.status === 'completed' || contract.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: `Cannot add milestones to a ${contract.status} contract`,
      });
    }

    const minorUnits =
      amountMinorUnits || (amount ? Math.round(Number(amount) * 100) : 0);

    if (!minorUnits || minorUnits <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Milestone amount must be greater than zero',
      });
    }

    // Verify sum of milestones does not exceed contract total
    const existing = await FinancialMilestone.find({ contractId });
    const currentSum = existing.reduce((acc, m) => acc + m.amountMinorUnits, 0);

    if (currentSum + minorUnits > contract.totalAmountMinorUnits) {
      return res.status(400).json({
        success: false,
        message: `Adding this milestone (${minorUnits / 100} ${contract.currency}) would exceed contract total (${contract.totalAmountMinorUnits / 100} ${contract.currency}). Remaining budget: ${(contract.totalAmountMinorUnits - currentSum) / 100} ${contract.currency}`,
      });
    }

    const milestone = await FinancialMilestone.create({
      contractId: contract._id,
      projectId: contract.projectId,
      title: title.trim(),
      description: description || '',
      deliverables: Array.isArray(deliverables) ? deliverables : [],
      amountMinorUnits: minorUnits,
      currency: contract.currency,
      order: existing.length + 1,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      workStatus: 'in_progress',
      paymentStatus: 'not_funded',
    });

    return res.status(201).json({ success: true, milestone });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/v1/financial-milestones/:id
 * Update milestone details (before paid)
 */
financialMilestoneRouter.patch('/:id', protect, async (req, res, next) => {
  try {
    const milestone = await FinancialMilestone.findById(req.params.id);
    if (!milestone) {
      return res.status(404).json({ success: false, message: 'Milestone not found' });
    }

    const access = await verifyMilestoneAccess(milestone, req.user._id);
    if (!access.allowed || (!access.isClient && req.user.role !== 'admin')) {
      return res.status(403).json({ success: false, message: 'Only the client can edit milestone definitions' });
    }

    if (milestone.paymentStatus === 'paid') {
      return res.status(400).json({ success: false, message: 'Cannot edit an already paid milestone' });
    }

    const {
      title,
      description,
      deliverables,
      amountMinorUnits,
      amount,
      dueDate,
      paymentStatus, // Attempted security bypass check!
    } = req.body;

    // SECURITY: Strictly prohibit client from self-authorizing payment status via PATCH
    if (paymentStatus && paymentStatus === 'paid' && milestone.paymentStatus !== 'paid') {
      return res.status(403).json({
        success: false,
        message: 'Milestone payment status cannot be marked as Paid through regular update requests. Payment must be verified through the payment provider workflow.',
      });
    }

    if (title) milestone.title = title.trim();
    if (description !== undefined) milestone.description = description.trim();
    if (Array.isArray(deliverables)) milestone.deliverables = deliverables;
    if (dueDate) milestone.dueDate = new Date(dueDate);

    if (amountMinorUnits || amount) {
      const newMinor = amountMinorUnits || Math.round(Number(amount) * 100);
      // Validate against contract total
      const others = await FinancialMilestone.find({
        contractId: milestone.contractId,
        _id: { $ne: milestone._id },
      });
      const otherSum = others.reduce((acc, m) => acc + m.amountMinorUnits, 0);
      if (otherSum + newMinor > access.contract.totalAmountMinorUnits) {
        return res.status(400).json({
          success: false,
          message: 'Updated milestone amount exceeds total contract budget',
        });
      }
      milestone.amountMinorUnits = newMinor;
    }

    await milestone.save();
    return res.status(200).json({ success: true, milestone });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/financial-milestones/:id/submit
 * Developer submits completed deliverable for client review
 */
financialMilestoneRouter.post('/:id/submit', protect, async (req, res, next) => {
  try {
    const { text, links, notes } = req.body;
    const milestone = await FinancialMilestone.findById(req.params.id);
    if (!milestone) {
      return res.status(404).json({ success: false, message: 'Milestone not found' });
    }

    const access = await verifyMilestoneAccess(milestone, req.user._id);
    if (!access.allowed || (!access.isDeveloper && req.user.role !== 'admin')) {
      return res.status(403).json({
        success: false,
        message: 'Only the assigned developer can submit deliverables for review',
      });
    }

    const submissionText = (text || notes || '').trim();
    if (!submissionText && (!Array.isArray(links) || links.length === 0)) {
      return res.status(400).json({
        success: false,
        message: 'Submission must contain descriptive notes or link(s) to deliverables',
      });
    }

    milestone.workStatus = 'submitted';
    milestone.submittedAt = new Date();
    milestone.submissionNote = submissionText;
    milestone.submissionDetails = {
      text: submissionText,
      links: Array.isArray(links) ? links : [],
      submittedAt: new Date(),
      submittedBy: req.user._id,
    };

    await milestone.save();

    // Notify client
    await sendNotification({
      recipient: access.contract.clientId,
      sender: req.user._id,
      type: 'milestone',
      title: 'Milestone Deliverable Submitted for Review',
      message: `${req.user.name} submitted work for milestone "${milestone.title}". Please review the deliverable.`,
      link: `/projects/${access.contract.projectId}/workspace`,
    });

    return res.status(200).json({
      success: true,
      message: 'Work submitted for review successfully',
      milestone,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/financial-milestones/:id/review
 * Client reviews work: approve or request revisions
 */
financialMilestoneRouter.post('/:id/review', protect, async (req, res, next) => {
  try {
    const chosenAction = req.body.action || req.body.decision;
    const isApprove = chosenAction === 'approve' || chosenAction === 'approved';
    const isRevision = chosenAction === 'request_revision' || chosenAction === 'revision_requested';

    if (!isApprove && !isRevision) {
      return res.status(400).json({
        success: false,
        message: 'Action must be either "approve" or "request_revision"',
      });
    }

    const feedback = req.body.feedback;

    const milestone = await FinancialMilestone.findById(req.params.id);
    if (!milestone) {
      return res.status(404).json({ success: false, message: 'Milestone not found' });
    }

    const access = await verifyMilestoneAccess(milestone, req.user._id);
    if (!access.allowed || (!access.isClient && req.user.role !== 'admin')) {
      return res.status(403).json({
        success: false,
        message: 'Only the client can review milestone deliverables',
      });
    }

    if (milestone.workStatus !== 'submitted') {
      return res.status(400).json({
        success: false,
        message: `Milestone is currently '${milestone.workStatus}'. Deliverables must be submitted before review.`,
      });
    }

    if (isApprove) {
      milestone.workStatus = 'approved';
      milestone.approvedAt = new Date();
      milestone.reviewDetails = {
        action: 'approve',
        feedback: feedback ? feedback.trim() : 'Deliverable approved',
        reviewedAt: new Date(),
        reviewedBy: req.user._id,
      };

      await milestone.save();

      // Send notification to developer
      await sendNotification({
        recipient: access.contract.developerId,
        sender: req.user._id,
        type: 'milestone',
        title: 'Milestone Deliverable Approved',
        message: `Great job! ${req.user.name} approved your deliverable for "${milestone.title}".`,
        link: `/projects/${access.contract.projectId}/workspace`,
      });

      return res.status(200).json({
        success: true,
        message: 'Milestone deliverable approved',
        milestone,
      });
    }

    if (isRevision) {
      if (!feedback || !feedback.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Feedback explaining requested revisions is required',
        });
      }

      milestone.workStatus = 'revision_requested';
      milestone.reviewDetails = {
        action: 'request_revision',
        feedback: feedback.trim(),
        reviewedAt: new Date(),
        reviewedBy: req.user._id,
      };

      await milestone.save();

      // Send notification to developer
      await sendNotification({
        recipient: access.contract.developerId,
        sender: req.user._id,
        type: 'milestone',
        title: 'Milestone Revisions Requested',
        message: `${req.user.name} requested revisions on "${milestone.title}". Notes: ${feedback.slice(0, 100)}`,
        link: `/projects/${access.contract.projectId}/workspace`,
      });

      return res.status(200).json({
        success: true,
        message: 'Revision requested from developer',
        milestone,
      });
    }
  } catch (err) {
    next(err);
  }
});

export default financialMilestoneRouter;
