import express from 'express';
import { Application } from '../models/Application.js';
import { Project } from '../models/Project.js';
import { ProjectMember } from '../models/ProjectMember.js';
import { ProjectActivity } from '../models/ProjectActivity.js';
import { Conversation } from '../models/Conversation.js';
import { User } from '../models/User.js';
import { protect } from '../middleware/authMiddleware.js';
import { sendNotification } from '../utils/notifications.js';
import { emitToProject, emitToUser, revokeUserProjectAccess } from '../utils/socketEvents.js';

export const applicationRouter = express.Router();

// ==========================================
// 1. GET /api/applications/my-applications & GET /api/applications/my - Applicant's proposals
// ==========================================
const getMyApplicationsHandler = async (req, res, next) => {
  try {
    const applications = await Application.find({ applicant: req.user._id })
      .populate({
        path: 'project',
        select: 'title summary description category budget duration status experienceLevel teamSize acceptedApplicantsCount owner coverImage requiredSkills deadline applicationDeadline',
        populate: { path: 'owner', select: 'name username email avatar avatarUrl role' },
      })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: applications.length,
      applications,
      data: applications,
    });
  } catch (err) {
    next(err);
  }
};

applicationRouter.get('/my-applications', protect, getMyApplicationsHandler);
applicationRouter.get('/my', protect, getMyApplicationsHandler);

// ==========================================
// 2. GET /api/applications/project/:projectId - Applications for project (Owner only)
// ==========================================
applicationRouter.get('/project/:projectId', protect, async (req, res, next) => {
  try {
    if (!req.params.projectId || req.params.projectId === 'undefined') {
      return res.status(400).json({ success: false, message: 'Project ID is required' });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.projectId)) {
      return res.status(400).json({ success: false, message: 'Invalid project ID format' });
    }

    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const isOwner = String(project.owner) === String(req.user._id);
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only the project owner can view these applications',
      });
    }

    const query = { project: project._id };
    if (req.query.status && typeof req.query.status === 'string') {
      const normStatus = req.query.status.toLowerCase().trim();
      if (['pending', 'under_review', 'shortlisted', 'accepted', 'rejected', 'withdrawn'].includes(normStatus)) {
        query.status = normStatus;
      }
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));
    const skip = (page - 1) * limit;

    const [total, applications] = await Promise.all([
      Application.countDocuments(query),
      Application.find(query)
        .populate('applicant', 'name username email avatar avatarUrl role skills headline location')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
    ]);

    return res.status(200).json({
      success: true,
      count: applications.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      applications,
      data: applications,
    });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// 3. GET /api/applications/:id - View application details
// ==========================================
applicationRouter.get('/:id', protect, async (req, res, next) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate('project', 'title description budget status owner teamSize acceptedApplicantsCount')
      .populate('applicant', 'name username email avatar avatarUrl role skills headline');

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    const isApplicant = String(application.applicant._id) === String(req.user._id);
    const isOwner = String(application.project.owner) === String(req.user._id);
    const isAdmin = req.user.role === 'admin';

    if (!isApplicant && !isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this application',
      });
    }

    return res.status(200).json({
      success: true,
      application,
      data: application,
    });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// 4. PATCH /api/applications/:id/status - Status Transition Pipeline
// ==========================================
const updateApplicationStatus = async (req, res, next) => {
  try {
    if (!req.params.id || req.params.id === 'undefined') {
      return res.status(400).json({ success: false, message: 'Application ID is required' });
    }

    const { status, decisionReason } = req.body || {};
    const targetStatus = status ? status.toLowerCase().trim() : '';

    if (!['under_review', 'shortlisted', 'accepted', 'rejected'].includes(targetStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be updated to "under_review", "shortlisted", "accepted", or "rejected"',
      });
    }

    if (decisionReason && decisionReason.length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Decision notes cannot exceed 1000 characters',
      });
    }

    const application = await Application.findById(req.params.id).populate('project');
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    const project = application.project;
    if (!project) {
      return res.status(404).json({ success: false, message: 'Associated project no longer exists' });
    }

    const isOwner = String(project.owner) === String(req.user._id);
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only the project owner can update application statuses',
      });
    }

    // Status transition validation
    if (application.status === 'withdrawn') {
      return res.status(400).json({
        success: false,
        message: 'Cannot modify an application that was withdrawn by the applicant',
      });
    }

    if (application.status === 'rejected') {
      if (targetStatus === 'accepted') {
        return res.status(400).json({
          success: false,
          message: 'Cannot accept an application that has already been rejected',
        });
      }
      return res.status(200).json({
        success: true,
        message: 'Application is already rejected',
        application,
      });
    }

    if (application.status === 'accepted') {
      if (targetStatus === 'rejected') {
        return res.status(400).json({
          success: false,
          message: 'Cannot reject an application that has already been accepted',
        });
      }

      // Ensure membership is active (idempotency safeguard)
      await ProjectMember.findOneAndUpdate(
        { project: project._id, user: application.applicant },
        {
          $set: {
            role: 'member',
            status: 'active',
            joinedAt: new Date(),
            addedBy: req.user._id,
            removedAt: null,
            removedBy: null,
            removalReason: '',
          },
        },
        { upsert: true, new: true }
      );

      return res.status(200).json({
        success: true,
        message: 'Application is already accepted',
        application,
      });
    }

    // Check project status
    if (['completed', 'cancelled', 'closed'].includes(project.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot accept applications for a ${project.status} project`,
      });
    }

    // ── 4a. Handle Under Review ──────────────────────────────────────────
    if (targetStatus === 'under_review') {
      if (application.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: `Cannot move application with status "${application.status}" to under review`,
        });
      }
      application.status = 'under_review';
      application.underReviewAt = new Date();
      application.reviewedAt = new Date();
      application.reviewedBy = req.user._id;
      if (decisionReason) application.decisionReason = decisionReason.trim();
      await application.save();

      await sendNotification({
        recipient: application.applicant,
        sender: req.user._id,
        type: 'application',
        title: 'Application Under Review ⏳',
        message: `Your application to "${project.title}" is now under review by the project owner.`,
        link: `/projects/${project._id}`,
      });

      emitToUser(application.applicant, 'application:under_review', {
        applicationId: application._id,
        status: 'under_review',
        project: { _id: project._id, title: project.title },
      });

      return res.status(200).json({
        success: true,
        message: 'Application marked as under review',
        application,
        data: application,
      });
    }

    // ── 4b. Handle Shortlisted ───────────────────────────────────────────
    if (targetStatus === 'shortlisted') {
      if (!['pending', 'under_review'].includes(application.status)) {
        return res.status(400).json({
          success: false,
          message: `Cannot shortlist an application with status "${application.status}"`,
        });
      }
      application.status = 'shortlisted';
      application.shortlistedAt = new Date();
      application.reviewedAt = new Date();
      application.reviewedBy = req.user._id;
      if (decisionReason) application.decisionReason = decisionReason.trim();
      await application.save();

      await sendNotification({
        recipient: application.applicant,
        sender: req.user._id,
        type: 'application',
        title: 'You Have Been Shortlisted! 🌟',
        message: `Congratulations! You have been shortlisted for "${project.title}". The project owner will reach out soon.`,
        link: `/projects/${project._id}`,
      });

      emitToUser(application.applicant, 'application:shortlisted', {
        applicationId: application._id,
        status: 'shortlisted',
        project: { _id: project._id, title: project.title },
      });

      return res.status(200).json({
        success: true,
        message: 'Applicant successfully shortlisted',
        application,
        data: application,
      });
    }

    // ====================================================
    // CONCURRENCY & CAPACITY ENFORCEMENT VIA CONDITIONAL UPDATE
    // ====================================================
    if (targetStatus === 'accepted') {
      const capacityLimit = project.teamSize || 1;

      // Atomically check that accepted count < teamSize and increment
      const updatedProject = await Project.findOneAndUpdate(
        {
          _id: project._id,
          acceptedApplicantsCount: { $lt: capacityLimit },
          status: { $in: ['open', 'in_progress'] },
        },
        {
          $inc: { acceptedApplicantsCount: 1 },
          $addToSet: {
            members: {
              user: application.applicant,
              role: 'contributor',
              joinedAt: new Date(),
            },
          },
        },
        { new: true }
      );

      // If condition matched zero documents, capacity is full!
      if (!updatedProject) {
        return res.status(409).json({
          success: false,
          message: `Team capacity reached. This project has already accepted ${capacityLimit} member(s).`,
        });
      }

      // If capacity is completely filled, update status to in_progress if still open
      if (updatedProject.acceptedApplicantsCount >= capacityLimit && updatedProject.status === 'open') {
        updatedProject.status = 'in_progress';
        await updatedProject.save();
      }

      // Ensure project owner has explicit owner ProjectMember record
      await ProjectMember.findOneAndUpdate(
        { project: project._id, user: project.owner },
        {
          $setOnInsert: {
            role: 'owner',
            status: 'active',
            joinedAt: project.createdAt || new Date(),
            addedBy: project.owner,
          },
        },
        { upsert: true, new: true }
      );

      // Create or reactivate applicant's ProjectMember record
      const memberRecord = await ProjectMember.findOneAndUpdate(
        { project: project._id, user: application.applicant },
        {
          $set: {
            role: 'member',
            status: 'active',
            joinedAt: new Date(),
            addedBy: req.user._id,
            removedAt: null,
            removedBy: null,
            removalReason: '',
          },
        },
        { upsert: true, new: true }
      );

      // Ensure project conversation exists and includes the accepted applicant
      let projectConv = await Conversation.findOne({ project: project._id });
      if (!projectConv) {
        await Conversation.create({
          type: 'project',
          project: project._id,
          title: project.title,
          participants: [project.owner, application.applicant].filter(Boolean),
        });
      } else {
        await Conversation.updateOne(
          { _id: projectConv._id },
          { $addToSet: { participants: application.applicant } }
        );
      }

      application.status = 'accepted';
      application.acceptedAt = new Date();
      application.reviewedAt = new Date();
      application.reviewedBy = req.user._id;
      if (decisionReason) application.decisionReason = decisionReason.trim();
      await application.save();

      // Log project activities
      await ProjectActivity.create([
        {
          project: project._id,
          user: req.user._id,
          targetUser: application.applicant,
          action: 'application_accepted',
          details: { applicationId: application._id },
        },
        {
          project: project._id,
          user: application.applicant,
          action: 'member_joined',
          details: { role: 'member', membershipId: memberRecord._id },
        },
      ]);

      // Notify applicant
      await sendNotification({
        recipient: application.applicant,
        sender: req.user._id,
        type: 'application',
        title: 'Application Accepted! 🎉',
        message: `Congratulations! Your application to "${project.title}" has been accepted. You now have full access to the project team workspace.`,
        link: `/projects/${project._id}/workspace`,
      });

      // Real-time WebSocket synchronization
      const applicantUser = await User.findById(application.applicant)
        .select('name username avatar avatarUrl role')
        .lean();

      emitToProject(project._id, 'member:joined', {
        member: {
          ...memberRecord.toObject(),
          user: applicantUser,
        },
        user: applicantUser,
        project: updatedProject,
      }, {
        actor: req.user,
        resourceId: application.applicant,
      });

      emitToUser(application.applicant, 'workspace:updated', {
        projectId: project._id,
        action: 'accepted',
        role: 'member',
        projectTitle: project.title,
      });

      if (updatedProject.status === 'in_progress' && project.status === 'open') {
        emitToProject(project._id, 'project:statusChanged', {
          previousStatus: 'open',
          status: 'in_progress',
        }, {
          actor: req.user,
          resourceId: project._id,
        });
      }

      emitToProject(project._id, 'activity:new', {
        project: project._id,
        user: {
          _id: req.user._id,
          name: req.user.name,
          avatar: req.user.avatar || req.user.avatarUrl || '',
        },
        targetUser: application.applicant,
        action: 'application_accepted',
        details: { applicationId: application._id },
        createdAt: new Date(),
      });

      emitToProject(project._id, 'activity:new', {
        project: project._id,
        user: applicantUser
          ? {
              _id: applicantUser._id,
              name: applicantUser.name,
              avatar: applicantUser.avatar || applicantUser.avatarUrl || '',
            }
          : { _id: application.applicant },
        action: 'member_joined',
        details: { role: 'member', membershipId: memberRecord._id },
        createdAt: new Date(),
      });

      return res.status(200).json({
        success: true,
        message: 'Application accepted successfully and member added to project team',
        application,
        project: updatedProject,
        membership: memberRecord,
      });
    }

    // Handling rejection
    application.status = 'rejected';
    application.reviewedAt = new Date();
    application.reviewedBy = req.user._id;
    if (decisionReason) application.decisionReason = decisionReason.trim();
    await application.save();

    // Log rejection activity
    await ProjectActivity.create({
      project: project._id,
      user: req.user._id,
      targetUser: application.applicant,
      action: 'application_rejected',
      details: { applicationId: application._id, reason: decisionReason || '' },
    });

    // Notify applicant
    await sendNotification({
      recipient: application.applicant,
      sender: req.user._id,
      type: 'application',
      title: 'Application Update',
      message: `Your application to "${project.title}" was not selected at this time.`,
      link: `/projects/${project._id}`,
    });

    return res.status(200).json({
      success: true,
      message: 'Application rejected',
      application,
    });
  } catch (err) {
    next(err);
  }
};

// ==========================================
// 4. PATCH /api/applications/:id/status - Status Transition Pipeline
// ==========================================
applicationRouter.patch('/:id/status', protect, updateApplicationStatus);

// Dedicated action endpoints
applicationRouter.post('/:id/shortlist', protect, (req, res, next) => {
  req.body = { ...req.body, status: 'shortlisted' };
  return updateApplicationStatus(req, res, next);
});

applicationRouter.post('/:id/under-review', protect, (req, res, next) => {
  req.body = { ...req.body, status: 'under_review' };
  return updateApplicationStatus(req, res, next);
});

applicationRouter.post('/:id/accept', protect, (req, res, next) => {
  req.body = { ...req.body, status: 'accepted' };
  return updateApplicationStatus(req, res, next);
});

applicationRouter.post('/:id/reject', protect, (req, res, next) => {
  req.body = { ...req.body, status: 'rejected' };
  return updateApplicationStatus(req, res, next);
});

// ==========================================
// 5. DELETE & POST /api/applications/:id/withdraw - Withdraw application
// ==========================================
const withdrawApplicationHandler = async (req, res, next) => {
  try {
    if (!req.params.id || req.params.id === 'undefined') {
      return res.status(400).json({ success: false, message: 'Application ID is required' });
    }

    const application = await Application.findById(req.params.id).populate('project');
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    const isApplicant = String(application.applicant) === String(req.user._id);
    const isAdmin = req.user.role === 'admin';
    if (!isApplicant && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to withdraw this application',
      });
    }

    if (application.status === 'withdrawn') {
      return res.status(400).json({
        success: false,
        message: 'Application is already withdrawn',
      });
    }

    if (application.status === 'rejected') {
      return res.status(400).json({
        success: false,
        message: 'Cannot withdraw a rejected application',
      });
    }

    const wasAccepted = application.status === 'accepted';
    application.status = 'withdrawn';
    application.withdrawnAt = new Date();
    await application.save();

    const projectId = application.project?._id || application.project;
    if (projectId) {
      // Reconcile applicationsCount
      await Project.findOneAndUpdate(
        { _id: projectId, applicationsCount: { $gt: 0 } },
        { $inc: { applicationsCount: -1 } }
      );

      if (wasAccepted) {
        // Reconcile accepted count and members
        await Project.findOneAndUpdate(
          { _id: projectId, acceptedApplicantsCount: { $gt: 0 } },
          {
            $inc: { acceptedApplicantsCount: -1 },
            $pull: { members: { user: application.applicant } },
          }
        );

        await ProjectMember.deleteMany({
          project: projectId,
          user: application.applicant,
        });

        const proj = await Project.findById(projectId);
        if (proj && proj.status === 'in_progress' && proj.acceptedApplicantsCount < (proj.teamSize || 1)) {
          proj.status = 'open';
          await proj.save();
          emitToProject(projectId, 'project:statusChanged', {
            previousStatus: 'in_progress',
            status: 'open',
          }, {
            actor: req.user,
            resourceId: projectId,
          });
        }

        // Real-time WebSocket synchronization
        emitToProject(projectId, 'member:removed', {
          userId: application.applicant,
          reason: 'Application withdrawn by applicant',
        }, {
          actor: req.user,
          resourceId: application.applicant,
        });
        revokeUserProjectAccess(application.applicant, projectId, 'Application withdrawn');
      }

      await ProjectActivity.create({
        project: projectId,
        user: req.user._id,
        action: 'application_withdrawn',
        details: { applicationId: application._id },
      });

      const ownerId = application.project?.owner;
      if (ownerId) {
        await sendNotification({
          recipient: ownerId,
          sender: req.user._id,
          type: 'application',
          title: 'Application Withdrawn',
          message: `${req.user.name} withdrew their application from "${application.project?.title || 'project'}"`,
          link: `/projects/${projectId}`,
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Application withdrawn successfully',
      application,
    });
  } catch (err) {
    next(err);
  }
};

applicationRouter.delete('/:id', protect, withdrawApplicationHandler);
applicationRouter.post('/:id/withdraw', protect, withdrawApplicationHandler);

// ==========================================
// 6. POST /api/applications - Submit proposal directly
// ==========================================
applicationRouter.post('/', protect, async (req, res, next) => {
  try {
    const {
      project: targetProjectId,
      projectId,
      coverLetter,
      proposedRate,
      rateType = 'fixed',
      estimatedDuration = '',
      relevantRole = 'Developer',
      relevantSkills = [],
      portfolioLinks = [],
      relevantExperience = '',
      availability = 'immediate',
      proposalAttachments = [],
      resumeUrl = '',
    } = req.body || {};

    const pId = targetProjectId || projectId;
    if (!pId) {
      return res.status(400).json({ success: false, message: 'Project ID is required' });
    }

    const project = await Project.findById(pId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    if (project.applicationStatus === 'closed' || project.status !== 'open') {
      return res.status(400).json({
        success: false,
        message: 'Applications for this project are currently closed',
      });
    }

    if (String(project.owner) === String(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: 'Project owner cannot apply to their own project',
      });
    }

    const deadline = project.applicationDeadline || project.deadline;
    if (deadline && new Date() > new Date(deadline)) {
      return res.status(400).json({
        success: false,
        message: 'The application deadline for this project has passed',
      });
    }

    if (project.teamSize && project.acceptedApplicantsCount >= project.teamSize) {
      return res.status(400).json({
        success: false,
        message: 'This project has already filled all available team positions',
      });
    }

    if (coverLetter && typeof coverLetter === 'string' && coverLetter.length > 3000) {
      return res.status(400).json({
        success: false,
        message: 'Cover letter cannot exceed 3000 characters',
      });
    }

    let existingApp = await Application.findOne({
      project: project._id,
      applicant: req.user._id,
    });

    if (existingApp) {
      if (existingApp.status === 'withdrawn') {
        existingApp.status = 'pending';
        existingApp.coverLetter = coverLetter || existingApp.coverLetter;
        existingApp.proposedRate = proposedRate || existingApp.proposedRate;
        existingApp.rateType = ['fixed', 'hourly', 'per_milestone'].includes(rateType) ? rateType : existingApp.rateType;
        existingApp.estimatedDuration = estimatedDuration || existingApp.estimatedDuration;
        existingApp.relevantSkills = Array.isArray(relevantSkills) && relevantSkills.length > 0 ? relevantSkills : existingApp.relevantSkills;
        existingApp.portfolioLinks = Array.isArray(portfolioLinks) && portfolioLinks.length > 0 ? portfolioLinks : existingApp.portfolioLinks;
        existingApp.relevantExperience = relevantExperience || existingApp.relevantExperience;
        existingApp.availability = availability || existingApp.availability;
        existingApp.withdrawnAt = null;
        await existingApp.save();

        await Project.findByIdAndUpdate(project._id, { $inc: { applicationsCount: 1 } });

        await sendNotification({
          recipient: project.owner,
          sender: req.user._id,
          type: 'application',
          title: 'Application Resubmitted',
          message: `${req.user.name} resubmitted their proposal to "${project.title}"`,
          link: `/projects/${project._id}`,
        });

        emitToUser(project.owner, 'application:submitted', {
          application: existingApp,
          project: { _id: project._id, title: project.title },
        });

        return res.status(200).json({
          success: true,
          message: 'Application resubmitted successfully',
          application: existingApp,
        });
      }

      return res.status(400).json({
        success: false,
        message: 'You have already submitted an active application for this project',
      });
    }

    const applicantUser = await User.findById(req.user._id);

    const application = await Application.create({
      project: project._id,
      applicant: req.user._id,
      coverLetter: coverLetter || 'I am interested in collaborating on this project.',
      proposedRate: proposedRate || '',
      rateType: ['fixed', 'hourly', 'per_milestone'].includes(rateType) ? rateType : 'fixed',
      estimatedDuration: typeof estimatedDuration === 'string' ? estimatedDuration.trim() : '',
      relevantRole: typeof relevantRole === 'string' ? relevantRole.trim() : 'Developer',
      relevantSkills: Array.isArray(relevantSkills) ? relevantSkills.map(s => String(s).trim()).filter(Boolean) : [],
      portfolioLinks: Array.isArray(portfolioLinks) ? portfolioLinks.map(l => String(l).trim()).filter(Boolean) : [],
      relevantExperience: typeof relevantExperience === 'string' ? relevantExperience.trim().slice(0, 2000) : '',
      availability: typeof availability === 'string' ? availability.trim() : 'immediate',
      proposalAttachments: Array.isArray(proposalAttachments) ? proposalAttachments : [],
      resumeUrl: resumeUrl || '',
      status: 'pending',
      applicantSnapshot: {
        name: applicantUser?.name || req.user.name,
        username: applicantUser?.username || req.user.username,
        headline: applicantUser?.headline || '',
        avatar: applicantUser?.avatar || '',
        skills: applicantUser?.skills || [],
      },
    });

    await Project.findByIdAndUpdate(project._id, { $inc: { applicationsCount: 1 } });

    await sendNotification({
      recipient: project.owner,
      sender: req.user._id,
      type: 'application',
      title: 'New Application Received! 📩',
      message: `${req.user.name} applied for "${project.title}"`,
      link: `/projects/${project._id}`,
    });

    emitToUser(project.owner, 'application:submitted', {
      application,
      project: { _id: project._id, title: project.title },
    });

    return res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      application,
      data: application,
    });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// 7. PATCH /api/applications/:id - Edit pending proposal
// ==========================================
applicationRouter.patch('/:id', protect, async (req, res, next) => {
  try {
    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }
    if (String(application.applicant) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this application' });
    }
    if (!['pending', 'under_review'].includes(application.status)) {
      return res.status(400).json({ success: false, message: `Cannot edit application with status "${application.status}"` });
    }
    const { coverLetter, proposedRate, rateType, estimatedDuration, relevantSkills, portfolioLinks, relevantExperience, availability } = req.body || {};
    if (coverLetter !== undefined) application.coverLetter = coverLetter;
    if (proposedRate !== undefined) application.proposedRate = proposedRate;
    if (rateType !== undefined && ['fixed', 'hourly', 'per_milestone'].includes(rateType)) application.rateType = rateType;
    if (estimatedDuration !== undefined) application.estimatedDuration = estimatedDuration;
    if (relevantSkills !== undefined && Array.isArray(relevantSkills)) application.relevantSkills = relevantSkills;
    if (portfolioLinks !== undefined && Array.isArray(portfolioLinks)) application.portfolioLinks = portfolioLinks;
    if (relevantExperience !== undefined) application.relevantExperience = relevantExperience;
    if (availability !== undefined) application.availability = availability;
    await application.save();
    return res.status(200).json({ success: true, message: 'Application updated successfully', application, data: application });
  } catch (err) {
    next(err);
  }
});

export default applicationRouter;
