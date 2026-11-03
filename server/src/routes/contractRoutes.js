import express from 'express';
import mongoose from 'mongoose';
import { Contract } from '../models/Contract.js';
import { FinancialMilestone } from '../models/FinancialMilestone.js';
import { Project } from '../models/Project.js';
import { ProjectMember } from '../models/ProjectMember.js';
import { User } from '../models/User.js';
import { protect } from '../middleware/authMiddleware.js';
import { requireWorkspaceMember } from '../middleware/workspaceMiddleware.js';
import { sendNotification } from '../utils/notifications.js';

export const contractRouter = express.Router();

/**
 * Helper to check if a user is authorized to view or edit a contract
 */
export const getContractAccess = async (contract, userId) => {
  const userIdStr = String(userId);
  const clientIdStr = String(contract.clientId?._id || contract.clientId);
  const developerIdStr = String(contract.developerId?._id || contract.developerId);

  const isClient = clientIdStr === userIdStr;
  const isDeveloper = developerIdStr === userIdStr;

  if (isClient || isDeveloper) {
    return {
      allowed: true,
      role: isClient ? 'client' : 'developer',
      isClient,
      isDeveloper,
    };
  }

  // Check if project owner
  const projectId = contract.projectId?._id || contract.projectId;
  const project = await Project.findById(projectId);
  if (project && String(project.owner) === userIdStr) {
    return { allowed: true, role: 'client', isClient: true, isDeveloper: false };
  }

  return { allowed: false };
};

/**
 * POST /api/v1/contracts
 * Create a draft contract for a project (Client/Owner only)
 */
contractRouter.post('/', protect, async (req, res, next) => {
  try {
    const {
      projectId,
      developerId,
      title,
      scope,
      deliverables,
      totalAmountMinorUnits,
      amount, // optional decimal fallback
      currency = 'USD',
      paymentTerms,
      startDate,
      expectedCompletionDate,
      milestones,
    } = req.body;

    if (!projectId || !developerId || !title || !scope || !deliverables) {
      return res.status(400).json({
        success: false,
        message: 'Project ID, developer ID, title, scope, and deliverables are required',
      });
    }

    const calculatedMinorUnits =
      totalAmountMinorUnits || (amount ? Math.round(Number(amount) * 100) : 0);

    if (!calculatedMinorUnits || calculatedMinorUnits <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Total amount must be greater than zero',
      });
    }

    // Verify project and ownership
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const isOwner = String(project.owner) === String(req.user._id);
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only the project owner can create financial contracts',
      });
    }

    // Verify developer is a valid user and active member/applicant
    const developer = await User.findById(developerId);
    if (!developer) {
      return res.status(404).json({ success: false, message: 'Developer not found' });
    }

    // Check membership
    const membership = await ProjectMember.findOne({
      project: projectId,
      user: developerId,
      status: 'active',
    });

    if (!membership && String(developerId) !== String(project.owner)) {
      return res.status(400).json({
        success: false,
        message: 'Contract recipient must be an active project member',
      });
    }

    const formattedDeliverables = Array.isArray(deliverables)
      ? deliverables.join('\n')
      : (typeof deliverables === 'string' ? deliverables.trim() : '');

    const contract = await Contract.create({
      projectId,
      clientId: req.user._id,
      developerId,
      title: title.trim(),
      scope: scope.trim(),
      deliverables: formattedDeliverables,
      totalAmountMinorUnits: calculatedMinorUnits,
      currency: currency.toUpperCase(),
      paymentTerms: paymentTerms || 'Milestone-based release upon deliverable approval',
      startDate: startDate ? new Date(startDate) : undefined,
      expectedCompletionDate: expectedCompletionDate ? new Date(expectedCompletionDate) : undefined,
      status: 'draft',
      proposedBy: req.user._id,
      acceptanceRecords: [
        {
          user: req.user._id,
          role: 'client',
          acceptedAt: new Date(),
          ipAddress: req.ip,
        },
      ],
    });

    // Optionally create initial milestones if provided
    let createdMilestones = [];
    if (Array.isArray(milestones) && milestones.length > 0) {
      let milestoneSum = 0;
      const milestoneDocs = milestones.map((m, index) => {
        const mMinor = m.amountMinorUnits || (m.amount ? Math.round(Number(m.amount) * 100) : 0);
        milestoneSum += mMinor;
        return {
          contractId: contract._id,
          projectId,
          title: m.title || `Milestone ${index + 1}`,
          description: m.description || '',
          deliverables: m.deliverables || [],
          amountMinorUnits: mMinor,
          currency: currency.toUpperCase(),
          order: index + 1,
          dueDate: m.dueDate ? new Date(m.dueDate) : undefined,
          workStatus: m.workStatus || 'pending',
          paymentStatus: 'not_funded',
        };
      });

      if (milestoneSum > calculatedMinorUnits) {
        // Rollback contract creation
        await Contract.findByIdAndDelete(contract._id);
        return res.status(400).json({
          success: false,
          message: `Sum of milestones (${milestoneSum / 100}) exceeds contract total (${calculatedMinorUnits / 100})`,
        });
      }

      createdMilestones = await FinancialMilestone.insertMany(milestoneDocs);
    }

    const populated = await Contract.findById(contract._id)
      .populate('clientId', 'name username email avatar avatarUrl role')
      .populate('developerId', 'name username email avatar avatarUrl role')
      .populate('projectId', 'title category status');

    return res.status(201).json({
      success: true,
      contract: populated,
      milestones: createdMilestones,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/contracts/project/:projectId
 * List all contracts for an authorized project workspace
 */
contractRouter.get('/project/:projectId', protect, async (req, res, next) => {
  try {
    const { projectId } = req.params;

    // Verify workspace access
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
        message: 'Access denied: not an active member of this project workspace',
      });
    }

    const query = { projectId };
    // If ordinary member (not owner), only show contracts where they are client or developer
    if (!isOwner && req.user.role !== 'admin') {
      query.$or = [{ clientId: req.user._id }, { developerId: req.user._id }];
    }

    const contracts = await Contract.find(query)
      .populate('clientId', 'name username email avatar avatarUrl role')
      .populate('developerId', 'name username email avatar avatarUrl role')
      .populate('projectId', 'title category status')
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, contracts });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/contracts/:id
 * View specific contract details
 */
contractRouter.get('/:id', protect, async (req, res, next) => {
  try {
    const contract = await Contract.findById(req.params.id)
      .populate('clientId', 'name username email avatar avatarUrl role')
      .populate('developerId', 'name username email avatar avatarUrl role')
      .populate('projectId', 'title category status owner');

    if (!contract) {
      return res.status(404).json({ success: false, message: 'Contract not found' });
    }

    const access = await getContractAccess(contract, req.user._id);
    if (!access.allowed && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: you are not a party to this agreement',
      });
    }

    // Fetch associated financial milestones
    const milestones = await FinancialMilestone.find({ contractId: contract._id }).sort({ order: 1 });

    return res.status(200).json({
      success: true,
      contract,
      milestones,
      userRole: access.role,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH & PUT /api/v1/contracts/:id
 * Update draft contract or propose amendment on active contract
 */
const handleUpdateContract = async (req, res, next) => {
  try {
    const contract = await Contract.findById(req.params.id);
    if (!contract) {
      return res.status(404).json({ success: false, message: 'Contract not found' });
    }

    const access = await getContractAccess(contract, req.user._id);
    if (!access.allowed && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const {
      title,
      scope,
      deliverables,
      totalAmountMinorUnits,
      amount,
      currency,
      paymentTerms,
      changeNote,
    } = req.body;

    const formattedDeliverables = deliverables
      ? (Array.isArray(deliverables) ? deliverables.join('\n') : (typeof deliverables === 'string' ? deliverables.trim() : ''))
      : undefined;

    const newMinorUnits =
      totalAmountMinorUnits || (amount ? Math.round(Number(amount) * 100) : contract.totalAmountMinorUnits);

    // 1. If Draft: Client can edit directly
    if (contract.status === 'draft') {
      if (title) contract.title = title.trim();
      if (scope) contract.scope = scope.trim();
      if (formattedDeliverables !== undefined) contract.deliverables = formattedDeliverables;
      if (newMinorUnits) contract.totalAmountMinorUnits = newMinorUnits;
      if (currency) contract.currency = currency.toUpperCase();
      if (paymentTerms) contract.paymentTerms = paymentTerms;

      await contract.save();
      return res.status(200).json({ success: true, contract });
    }

    // 2. If Active or Pending Acceptance: Modifications require creating a version amendment
    if (contract.status === 'active' || contract.status === 'pending_acceptance') {
      // Archive current version into versionHistory
      contract.versionHistory.push({
        version: contract.version,
        title: contract.title,
        scope: contract.scope,
        deliverables: contract.deliverables,
        totalAmountMinorUnits: contract.totalAmountMinorUnits,
        currency: contract.currency,
        paymentTerms: contract.paymentTerms,
        proposedBy: contract.proposedBy,
        proposedAt: contract.updatedAt,
        acceptedBy: contract.acceptedBy,
        acceptedAt: contract.acceptedAt,
        changeNote: changeNote || 'Contract amendment proposed',
      });

      // Update fields and bump version
      contract.version += 1;
      if (title) contract.title = title.trim();
      if (scope) contract.scope = scope.trim();
      if (formattedDeliverables !== undefined) contract.deliverables = formattedDeliverables;
      if (newMinorUnits) contract.totalAmountMinorUnits = newMinorUnits;
      if (currency) contract.currency = currency.toUpperCase();
      if (paymentTerms) contract.paymentTerms = paymentTerms;

      contract.status = 'pending_acceptance';
      contract.proposedBy = req.user._id;
      contract.acceptedBy = null;
      contract.acceptedAt = null;

      // Re-initialize acceptance records with proposer
      contract.acceptanceRecords = [
        {
          user: req.user._id,
          role: access.role,
          acceptedAt: new Date(),
          ipAddress: req.ip,
        },
      ];

      await contract.save();

      // Notify counterparty
      const counterpartyId = String(contract.clientId) === String(req.user._id)
        ? contract.developerId
        : contract.clientId;

      await sendNotification({
        recipient: counterpartyId,
        sender: req.user._id,
        type: 'project',
        title: 'Contract Amendment Proposed',
        message: `${req.user.name} proposed an amendment to "${contract.title}" (v${contract.version}). Please review and accept.`,
        link: `/projects/${contract.projectId}/workspace`,
      });

      return res.status(200).json({
        success: true,
        message: 'Contract amendment proposed. Pending counterparty acceptance.',
        contract,
      });
    }

    return res.status(400).json({
      success: false,
      message: `Cannot update contract in "${contract.status}" status`,
    });
  } catch (err) {
    next(err);
  }
};

contractRouter.patch('/:id', protect, handleUpdateContract);
contractRouter.put('/:id', protect, handleUpdateContract);

/**
 * POST /api/v1/contracts/:id/send
 * Submit draft contract for developer/client acceptance
 */
contractRouter.post('/:id/send', protect, async (req, res, next) => {
  try {
    const contract = await Contract.findById(req.params.id);
    if (!contract) {
      return res.status(404).json({ success: false, message: 'Contract not found' });
    }

    const access = await getContractAccess(contract, req.user._id);
    if (!access.allowed || (!access.isClient && req.user.role !== 'admin')) {
      return res.status(403).json({
        success: false,
        message: 'Only the client can submit draft contracts for acceptance',
      });
    }

    if (contract.status !== 'draft') {
      return res.status(400).json({
        success: false,
        message: `Contract is currently '${contract.status}'. Only draft contracts can be sent.`,
      });
    }

    // Validate milestone total equals contract total if milestones exist
    const milestones = await FinancialMilestone.find({ contractId: contract._id });
    if (milestones.length > 0) {
      const sum = milestones.reduce((acc, m) => acc + m.amountMinorUnits, 0);
      if (sum !== contract.totalAmountMinorUnits) {
        return res.status(400).json({
          success: false,
          message: `Milestone sum (${sum / 100} ${contract.currency}) must match contract total (${contract.totalAmountMinorUnits / 100} ${contract.currency}) before sending`,
        });
      }
    }

    contract.status = 'pending_acceptance';
    contract.proposedBy = req.user._id;
    await contract.save();

    // Send in-app notification to developer
    await sendNotification({
      recipient: contract.developerId,
      sender: req.user._id,
      type: 'project',
      title: 'Contract Agreement Ready for Review',
      message: `${req.user.name} submitted a project contract "${contract.title}" (${contract.totalAmountMinorUnits / 100} ${contract.currency}) for your review.`,
      link: `/projects/${contract.projectId}/workspace`,
    });

    return res.status(200).json({
      success: true,
      message: 'Contract submitted for acceptance',
      contract,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/contracts/:id/accept
 * Accept a pending contract agreement
 */
contractRouter.post('/:id/accept', protect, async (req, res, next) => {
  try {
    const contract = await Contract.findById(req.params.id);
    if (!contract) {
      return res.status(404).json({ success: false, message: 'Contract not found' });
    }

    const access = await getContractAccess(contract, req.user._id);
    if (!access.allowed) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: you are not a party to this agreement',
      });
    }

    if (contract.status !== 'pending_acceptance') {
      return res.status(400).json({
        success: false,
        message: `Contract status is '${contract.status}'. Only pending agreements can be accepted.`,
      });
    }

    // Prevent proposer from accepting their own proposal (must be counterparty)
    const isProposer = String(contract.proposedBy?._id || contract.proposedBy) === String(req.user._id);
    if (isProposer && contract.acceptanceRecords.length > 0) {
      return res.status(403).json({
        success: false,
        message: 'Awaiting counterparty acceptance. Proposer cannot accept their own terms.',
      });
    }

    // Record acceptance
    contract.acceptanceRecords.push({
      user: req.user._id,
      role: access.role,
      acceptedAt: new Date(),
      ipAddress: req.ip,
    });

    contract.status = 'active';
    contract.acceptedBy = req.user._id;
    contract.acceptedAt = new Date();
    contract.effectiveAt = new Date();
    await contract.save();

    // Notify other party
    const counterpartyId = String(contract.clientId) === String(req.user._id)
      ? contract.developerId
      : contract.clientId;

    await sendNotification({
      recipient: counterpartyId,
      sender: req.user._id,
      type: 'project',
      title: 'Contract Accepted & Active',
      message: `${req.user.name} accepted "${contract.title}". Contract is now active and ready for milestone execution.`,
      link: `/projects/${contract.projectId}/workspace`,
    });

    return res.status(200).json({
      success: true,
      message: 'Contract successfully accepted and activated',
      contract,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/contracts/:id/reject
 * Reject a pending contract agreement
 */
contractRouter.post('/:id/reject', protect, async (req, res, next) => {
  try {
    const { reason } = req.body;
    const contract = await Contract.findById(req.params.id);
    if (!contract) {
      return res.status(404).json({ success: false, message: 'Contract not found' });
    }

    const access = await getContractAccess(contract, req.user._id);
    if (!access.allowed) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (contract.status !== 'pending_acceptance') {
      return res.status(400).json({
        success: false,
        message: `Contract is in '${contract.status}' status and cannot be rejected`,
      });
    }

    contract.status = 'cancelled';
    contract.cancelledAt = new Date();
    contract.cancelledBy = req.user._id;
    contract.cancellationReason = reason || 'Agreement rejected by counterparty';
    await contract.save();

    // Notify proposer
    await sendNotification({
      recipient: contract.proposedBy,
      sender: req.user._id,
      type: 'project',
      title: 'Contract Agreement Declined',
      message: `${req.user.name} declined "${contract.title}". Reason: ${reason || 'Terms not agreed'}.`,
      link: `/projects/${contract.projectId}/workspace`,
    });

    return res.status(200).json({
      success: true,
      message: 'Contract agreement declined',
      contract,
    });
  } catch (err) {
    next(err);
  }
});

export default contractRouter;
