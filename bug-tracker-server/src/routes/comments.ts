import express, { Request, Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import mongoose from 'mongoose';
import { Comment } from '../models/Comment';
import { Bug } from '../models/Bug';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// @route   GET /api/comments
// @desc    Get comments for a specific bug
// @access  Private
router.get('/', [
  query('bugId').isMongoId().withMessage('Valid bug ID is required'),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 })
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { bugId } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    // Verify bug exists
    const bug = await Bug.findById(bugId);
    if (!bug) {
      return res.status(404).json({
        success: false,
        message: 'Bug not found'
      });
    }

    // Get top-level comments (no parent) with their replies
    const [comments, totalCount] = await Promise.all([
      Comment.find({ bug: bugId, parentComment: null })
        .populate('author', 'firstName lastName email avatar role')
        .populate({
          path: 'replies',
          populate: {
            path: 'author',
            select: 'firstName lastName email avatar role'
          },
          options: { sort: { createdAt: 1 } }
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Comment.countDocuments({ bug: bugId, parentComment: null })
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    res.json({
      success: true,
      data: {
        comments,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch comments'
    });
  }
});

// @route   GET /api/comments/:id
// @desc    Get single comment by ID
// @access  Private
router.get('/:id', async (req: Request, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid comment ID'
      });
    }

    const comment = await Comment.findById(req.params.id)
      .populate('author', 'firstName lastName email avatar role')
      .populate('replies');

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    res.json({
      success: true,
      data: { comment }
    });

  } catch (error) {
    console.error('Get comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch comment'
    });
  }
});

// @route   POST /api/comments
// @desc    Create a new comment
// @access  Private
router.post('/', [
  body('content').trim().isLength({ min: 1, max: 2000 }).withMessage('Comment content is required and must be max 2000 characters'),
  body('bugId').isMongoId().withMessage('Valid bug ID is required'),
  body('parentCommentId').optional().isMongoId().withMessage('Invalid parent comment ID')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { content, bugId, parentCommentId } = req.body;

    // Verify bug exists
    const bug = await Bug.findById(bugId);
    if (!bug) {
      return res.status(404).json({
        success: false,
        message: 'Bug not found'
      });
    }

    // Verify parent comment exists and belongs to the same bug if provided
    if (parentCommentId) {
      const parentComment = await Comment.findById(parentCommentId);
      if (!parentComment) {
        return res.status(404).json({
          success: false,
          message: 'Parent comment not found'
        });
      }

      if (parentComment.bug.toString() !== bugId) {
        return res.status(400).json({
          success: false,
          message: 'Parent comment does not belong to the specified bug'
        });
      }
    }

    // Create comment
    const comment = new Comment({
      content,
      author: req.user!._id,
      bug: bugId,
      parentComment: parentCommentId || null
    });

    await comment.save();

    // Populate author data for response
    await comment.populate('author', 'firstName lastName email avatar role');

    res.status(201).json({
      success: true,
      message: 'Comment created successfully',
      data: { comment }
    });

  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create comment'
    });
  }
});

// @route   PUT /api/comments/:id
// @desc    Update a comment (author only)
// @access  Private
router.put('/:id', [
  body('content').trim().isLength({ min: 1, max: 2000 }).withMessage('Comment content is required and must be max 2000 characters')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid comment ID'
      });
    }

    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check if user is the author of the comment
    if (comment.author.toString() !== req.user!._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own comments'
      });
    }

    // Update comment
    comment.content = req.body.content;
    await comment.save();

    // Populate author data for response
    await comment.populate('author', 'firstName lastName email avatar role');

    res.json({
      success: true,
      message: 'Comment updated successfully',
      data: { comment }
    });

  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update comment'
    });
  }
});

// @route   DELETE /api/comments/:id
// @desc    Delete a comment (author only)
// @access  Private
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid comment ID'
      });
    }

    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check if user is the author of the comment or has admin/manager role
    const isAuthor = comment.author.toString() === req.user!._id.toString();
    const hasDeletePermission = ['admin', 'manager'].includes(req.user!.role);

    if (!isAuthor && !hasDeletePermission) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own comments or need admin/manager permissions'
      });
    }

    // Delete all replies first
    await Comment.deleteMany({ parentComment: comment._id });
    
    // Delete the comment
    await Comment.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Comment and its replies deleted successfully'
    });

  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete comment'
    });
  }
});

export default router;
