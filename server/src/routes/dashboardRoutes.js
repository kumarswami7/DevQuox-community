import express from 'express';
import {
  getDashboardSummary,
  getDashboardAnalytics,
  getDashboardActivities,
  getDashboardTasks,
  updateQuickAction,
} from '../controllers/dashboardController.js';
import { optionalAuth, protect } from '../middleware/authMiddleware.js';
import { seedDatabaseWithRealData } from '../database/seedTestData.js';

export const dashboardRouter = express.Router();

/**
 * @route   GET /api/v1/dashboard/summary
 * @desc    Get aggregated role-based dashboard overview & stats
 * @access  Public / Optional Auth (Customized when authenticated)
 */
dashboardRouter.get('/summary', optionalAuth, getDashboardSummary);

/**
 * @route   GET /api/v1/dashboard/analytics
 * @desc    Get visual charts & metric distribution data
 * @access  Public / Optional Auth
 */
dashboardRouter.get('/analytics', optionalAuth, getDashboardAnalytics);

/**
 * @route   GET /api/v1/dashboard/activities
 * @desc    Get recent project activities and events stream
 * @access  Public / Optional Auth
 */
dashboardRouter.get('/activities', optionalAuth, getDashboardActivities);

/**
 * @route   GET /api/v1/dashboard/tasks
 * @desc    Get user's assigned / created tasks across workspaces
 * @access  Private
 */
dashboardRouter.get('/tasks', protect, getDashboardTasks);

/**
 * @route   PATCH /api/v1/dashboard/quick-action
 * @desc    Perform rapid inline actions (status toggles, approvals)
 * @access  Private
 */
dashboardRouter.patch('/quick-action', protect, updateQuickAction);

/**
 * @route   POST /api/v1/dashboard/seed
 * @desc    Seed database with real projects, developers, tasks, and applications for testing
 * @access  Public / Development
 */
dashboardRouter.post('/seed', async (req, res) => {
  try {
    await seedDatabaseWithRealData();
    return res.status(200).json({
      success: true,
      message: 'MongoDB Atlas successfully populated with real projects, users, tasks, and proposals!',
    });
  } catch (error) {
    console.error('Seed API error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default dashboardRouter;
