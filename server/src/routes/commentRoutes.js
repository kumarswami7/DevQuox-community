import express from 'express';
import { Comment } from '../models/Comment.js';
import { Project } from '../models/Project.js';
import { Post } from '../models/Post.js';
import { protect } from '../middleware/authMiddleware.js';

export const commentRouter = express.Router();

// PATCH /api/comments/:commentId - Edit comment content
commentRouter.patch('/:commentId', protect, async (req, res, next) => {
  try {
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Comment content is required' });
    }

    const comment = await Comment.findById(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    // Only author or admin can edit
    const isAuthor = String(comment.author) === String(req.user._id);
    const isAdmin = req.user.role === 'admin';
    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ success: false, message: 'You are not authorized to edit this comment' });
    }

    comment.content = content.trim();
    await comment.save();

    const populated = await Comment.findById(comment._id).populate(
      'author',
      'name username email avatar avatarUrl headline role'
    );

    return res.status(200).json({
      success: true,
      message: 'Comment updated successfully',
      comment: populated,
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/comments/:commentId - Delete comment and any replies
commentRouter.delete('/:commentId', protect, async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    // Check project owner if comment is on a project
    let isProjectOwner = false;
    if (comment.project) {
      const proj = await Project.findById(comment.project);
      if (proj && String(proj.owner) === String(req.user._id)) {
        isProjectOwner = true;
      }
    }

    const isAuthor = String(comment.author) === String(req.user._id);
    const isAdmin = req.user.role === 'admin';
    if (!isAuthor && !isProjectOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'You are not authorized to delete this comment' });
    }

    // Count replies to decrement counter accurately
    const childReplies = await Comment.find({ parentComment: comment._id });
    const totalDeletedCount = 1 + childReplies.length;

    await Comment.deleteMany({
      $or: [{ _id: comment._id }, { parentComment: comment._id }],
    });

    if (comment.project) {
      await Project.findByIdAndUpdate(comment.project, {
        $inc: { commentsCount: -totalDeletedCount },
      });
      // Ensure commentsCount doesn't go below 0
      await Project.updateOne({ _id: comment.project, commentsCount: { $lt: 0 } }, { $set: { commentsCount: 0 } });
    }

    if (comment.post) {
      await Post.findByIdAndUpdate(comment.post, {
        $inc: { commentsCount: -totalDeletedCount },
      });
      await Post.updateOne({ _id: comment.post, commentsCount: { $lt: 0 } }, { $set: { commentsCount: 0 } });
    }

    return res.status(200).json({
      success: true,
      message: 'Comment deleted successfully',
      deletedCount: totalDeletedCount,
    });
  } catch (err) {
    next(err);
  }
});

export default commentRouter;

