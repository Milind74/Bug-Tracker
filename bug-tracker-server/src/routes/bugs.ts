import express, { Request, Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import mongoose from 'mongoose';
import { Bug } from '../models/Bug';
import { User } from '../models/User';
import { Comment } from '../models/Comment';
import { authenticateToken, authorizeRole } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// @route   GET /api/bugs
// @desc    Get all bugs with pagination and filters
// @access  Private
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(['open', 'in-progress', 'resolved', 'closed', 'reopened']),
  query('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
  query('type').optional().isIn(['bug', 'feature', 'improvement', 'task']),
  query('assignedTo').optional().isMongoId(),
  query('reporter').optional().isMongoId(),
  query('search').optional().isString()
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        errors: errors.array()
      });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter: any = {};
    
    if (req.query.status) filter.status = req.query.status;
    if (req.query.priority) filter.priority = req.query.priority;
    if (req.query.type) filter.type = req.query.type;
    if (req.query.assignedTo) filter.assignedTo = req.query.assignedTo;
    if (req.query.reporter) filter.reporter = req.query.reporter;
    
    // Handle unassigned filter
    if (req.query.unassigned === 'true') {
      filter.assignedTo = null;
    }
    
    // Text search - use regex for partial matching
    if (req.query.search) {
      const searchTerm = req.query.search as string;
      filter.$or = [
        { title: { $regex: searchTerm, $options: 'i' } }, // Case-insensitive search in title
        { description: { $regex: searchTerm, $options: 'i' } } // Case-insensitive search in description
      ];
    }

    // Get bugs with pagination
    const [bugs, totalCount] = await Promise.all([
      Bug.find(filter)
        .populate('assignedTo', 'firstName lastName email avatar role')
        .populate('reporter', 'firstName lastName email avatar role')
        .populate('commentsCount')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Bug.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    res.json({
      success: true,
      data: {
        bugs,
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
    console.error('Get bugs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bugs'
    });
  }
});

// @route   GET /api/bugs/export
// @desc    Export bugs to CSV with filters
// @access  Private
router.get('/export', async (req: Request, res: Response) => {
  try {
    console.log('Export route called with query:', req.query);

    // Build filter object (same logic as GET /api/bugs)
    const filter: any = {};
    
    if (req.query.status) filter.status = req.query.status;
    if (req.query.priority) filter.priority = req.query.priority;
    if (req.query.type) filter.type = req.query.type;
    if (req.query.assignedTo) filter.assignedTo = req.query.assignedTo;
    if (req.query.reporter) filter.reporter = req.query.reporter;
    
    // Handle unassigned filter
    if (req.query.unassigned === 'true') {
      filter.assignedTo = null;
    }
    
    // Text search
    if (req.query.search) {
      filter.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    // Get all bugs matching the filter (no pagination for export)
    const bugs = await Bug.find(filter)
      .populate('assignedTo', 'firstName lastName email')
      .populate('reporter', 'firstName lastName email')
      .sort({ createdAt: -1 });

    // Convert to CSV format
    const csvHeader = 'ID,Title,Description,Status,Priority,Type,Assigned To,Reporter,Created At,Updated At\n';
    const csvRows = bugs.map(bug => {
      const assignedTo = bug.assignedTo 
        ? `${(bug.assignedTo as any).firstName} ${(bug.assignedTo as any).lastName}` 
        : 'Unassigned';
      const reporter = bug.reporter 
        ? `${(bug.reporter as any).firstName} ${(bug.reporter as any).lastName}` 
        : 'Unknown';
      
      // Escape CSV fields that might contain commas or quotes
      const escapeCSV = (field: string) => {
        if (field.includes(',') || field.includes('"') || field.includes('\n')) {
          return `"${field.replace(/"/g, '""')}"`;
        }
        return field;
      };

      return [
        bug._id,
        escapeCSV(bug.title),
        escapeCSV(bug.description || ''),
        bug.status,
        bug.priority,
        bug.type,
        escapeCSV(assignedTo),
        escapeCSV(reporter),
        bug.createdAt?.toISOString() || '',
        bug.updatedAt?.toISOString() || ''
      ].join(',');
    }).join('\n');

    const csv = csvHeader + csvRows;

    // Set headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="bugs-export-${new Date().toISOString().split('T')[0]}.csv"`);
    
    res.send(csv);

  } catch (error) {
    console.error('Export bugs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export bugs'
    });
  }
});

// @route   GET /api/bugs/analytics
// @desc    Get bug analytics and statistics
// @access  Private
router.get('/analytics', async (req: Request, res: Response) => {
  try {
    // Get basic counts
    const [
      totalBugs,
      openBugs,
      inProgressBugs,
      resolvedBugs,
      closedBugs,
      highPriorityBugs,
      criticalPriorityBugs
    ] = await Promise.all([
      Bug.countDocuments(),
      Bug.countDocuments({ status: 'open' }),
      Bug.countDocuments({ status: 'in-progress' }),
      Bug.countDocuments({ status: 'resolved' }),
      Bug.countDocuments({ status: 'closed' }),
      Bug.countDocuments({ priority: 'high' }),
      Bug.countDocuments({ priority: 'critical' })
    ]);

    // Get status distribution
    const statusStats = await Bug.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get priority distribution  
    const priorityStats = await Bug.aggregate([
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get bugs created in last 7 days
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);
    
    const recentBugs = await Bug.countDocuments({
      createdAt: { $gte: last7Days }
    });

    // Get assignee distribution (top 5)
    const assigneeStats = await Bug.aggregate([
      {
        $match: { assignedTo: { $ne: null } }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'assignedTo',
          foreignField: '_id',
          as: 'assignee'
        }
      },
      {
        $unwind: '$assignee'
      },
      {
        $group: {
          _id: '$assignedTo',
          name: { $first: { $concat: ['$assignee.firstName', ' ', '$assignee.lastName'] } },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 5
      }
    ]);

    // Get monthly trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyTrend = await Bug.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    res.json({
      success: true,
      data: {
        totalBugs,
        openBugs,
        inProgressBugs,
        resolvedBugs,
        closedBugs,
        highPriorityBugs,
        criticalBugs: criticalPriorityBugs,
        recentBugs,
        statusDistribution: statusStats.map(item => ({
          status: item._id,
          name: item._id,
          value: item.count
        })),
        priorityDistribution: priorityStats.map(item => ({
          priority: item._id,
          name: item._id,
          value: item.count
        })),
        assigneeStats: assigneeStats.map(item => ({
          name: item.name,
          value: item.count
        })),
        monthlyTrend: monthlyTrend.map(item => ({
          month: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
          count: item.count
        }))
      }
    });

  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics'
    });
  }
});

// @route   GET /api/bugs/:id
// @desc    Get single bug by ID
// @access  Private
router.get('/:id', async (req: Request, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid bug ID'
      });
    }

    const bug = await Bug.findById(req.params.id)
      .populate('assignedTo', 'firstName lastName email avatar role')
      .populate('reporter', 'firstName lastName email avatar role')
      .populate('commentsCount');

    if (!bug) {
      return res.status(404).json({
        success: false,
        message: 'Bug not found'
      });
    }

    res.json({
      success: true,
      data: { bug }
    });

  } catch (error) {
    console.error('Get bug error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bug'
    });
  }
});

// @route   POST /api/bugs
// @desc    Create a new bug
// @access  Private
router.post('/', [
  body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Title is required and must be max 200 characters'),
  body('description').trim().isLength({ min: 1, max: 5000 }).withMessage('Description is required and must be max 5000 characters'),
  body('priority').isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid priority'),
  body('type').optional().isIn(['bug', 'feature', 'improvement', 'task']),
  body('assignedTo').optional().isMongoId().withMessage('Invalid assigned user ID'),
  body('tags').optional().isArray(),
  body('estimatedHours').optional().isFloat({ min: 0, max: 1000 }),
  body('dueDate').optional().isISO8601()
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

    const { title, description, priority, type, assignedTo, tags, estimatedHours, dueDate } = req.body;

    // Validate assignedTo user exists if provided
    if (assignedTo) {
      const assignedUser = await User.findById(assignedTo);
      if (!assignedUser) {
        return res.status(400).json({
          success: false,
          message: 'Assigned user not found'
        });
      }
    }

    // Create bug
    const bug = new Bug({
      title,
      description,
      priority,
      type: type || 'bug',
      assignedTo: assignedTo || null,
      reporter: req.user!._id,
      tags: tags || [],
      estimatedHours,
      dueDate: dueDate ? new Date(dueDate) : null
    });

    await bug.save();

    // Populate bug data for response
    await bug.populate('assignedTo', 'firstName lastName email avatar role');
    await bug.populate('reporter', 'firstName lastName email avatar role');

    res.status(201).json({
      success: true,
      message: 'Bug created successfully',
      data: { bug }
    });

  } catch (error) {
    console.error('Create bug error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create bug'
    });
  }
});

// @route   PUT /api/bugs/:id
// @desc    Update a bug
// @access  Private
router.put('/:id', [
  body('title').optional().trim().isLength({ min: 1, max: 200 }),
  body('description').optional().trim().isLength({ min: 1, max: 5000 }),
  body('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
  body('status').optional().isIn(['open', 'in-progress', 'resolved', 'closed', 'reopened']),
  body('type').optional().isIn(['bug', 'feature', 'improvement', 'task']),
  body('assignedTo').optional().custom(value => {
    if (value === null || value === '') return true;
    return mongoose.Types.ObjectId.isValid(value);
  }),
  body('tags').optional().isArray(),
  body('estimatedHours').optional().isFloat({ min: 0, max: 1000 }),
  body('actualHours').optional().isFloat({ min: 0, max: 1000 }),
  body('dueDate').optional().custom(value => {
    if (value === null || value === '') return true;
    return new Date(value).toString() !== 'Invalid Date';
  })
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
        message: 'Invalid bug ID'
      });
    }

    const bug = await Bug.findById(req.params.id);
    if (!bug) {
      return res.status(404).json({
        success: false,
        message: 'Bug not found'
      });
    }

    const updateData = req.body;

    // Validate assignedTo user exists if provided
    if (updateData.assignedTo && updateData.assignedTo !== null) {
      const assignedUser = await User.findById(updateData.assignedTo);
      if (!assignedUser) {
        return res.status(400).json({
          success: false,
          message: 'Assigned user not found'
        });
      }
    }

    // Handle null assignedTo (unassigning)
    if (updateData.assignedTo === null || updateData.assignedTo === '') {
      updateData.assignedTo = null;
    }

    // Handle dueDate
    if (updateData.dueDate) {
      updateData.dueDate = new Date(updateData.dueDate);
    } else if (updateData.dueDate === null || updateData.dueDate === '') {
      updateData.dueDate = null;
    }

    // Update bug
    const updatedBug = await Bug.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('assignedTo', 'firstName lastName email avatar role')
      .populate('reporter', 'firstName lastName email avatar role');

    res.json({
      success: true,
      message: 'Bug updated successfully',
      data: { bug: updatedBug }
    });

  } catch (error) {
    console.error('Update bug error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update bug'
    });
  }
});

// @route   DELETE /api/bugs/:id
// @desc    Delete a bug
// @access  Private (Admin/Manager/Developer - creator can delete own bugs)
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid bug ID'
      });
    }

    // First, find the bug to check permissions
    const bug = await Bug.findById(req.params.id);
    if (!bug) {
      return res.status(404).json({
        success: false,
        message: 'Bug not found'
      });
    }

    // Check if user has permission to delete this bug
    const userRole = (req as any).user?.role;
    const userId = (req as any).user?.id;
    
    // Allow admin and manager to delete any bug
    // Allow the bug reporter to delete their own bug
    const canDelete = 
      userRole === 'admin' || 
      userRole === 'manager' || 
      bug.reporter.toString() === userId;

    if (!canDelete) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete bugs that you created'
      });
    }

    // Delete the bug
    await Bug.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Bug deleted successfully'
    });

  } catch (error) {
    console.error('Delete bug error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete bug'
    });
  }
});

// @route   GET /api/bugs/stats/overview
// @desc    Get bug statistics overview
// @access  Private
router.get('/stats/overview', async (req: Request, res: Response) => {
  try {
    const [
      totalBugs,
      openBugs,
      closedBugs,
      statusStats,
      priorityStats,
      typeStats
    ] = await Promise.all([
      Bug.countDocuments(),
      Bug.countDocuments({ status: { $ne: 'closed' } }),
      Bug.countDocuments({ status: 'closed' }),
      Bug.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]),
      Bug.aggregate([
        { $group: { _id: '$priority', count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]),
      Bug.aggregate([
        { $group: { _id: '$type', count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ])
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalBugs,
          openBugs,
          closedBugs,
          resolveRate: totalBugs > 0 ? Math.round((closedBugs / totalBugs) * 100) : 0
        },
        charts: {
          status: statusStats.map(item => ({
            name: item._id,
            value: item.count
          })),
          priority: priorityStats.map(item => ({
            name: item._id,
            value: item.count
          })),
          type: typeStats.map(item => ({
            name: item._id,
            value: item.count
          }))
        }
      }
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics'
    });
  }
});

// @route   GET /api/bugs/:id/comments
// @desc    Get comments for a specific bug (nested route)
// @access  Private
router.get('/:id/comments', async (req: Request, res: Response) => {
  try {
    const bugId = req.params.id;
    
    if (!mongoose.Types.ObjectId.isValid(bugId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid bug ID'
      });
    }

    // Verify bug exists
    const bug = await Bug.findById(bugId);
    if (!bug) {
      return res.status(404).json({
        success: false,
        message: 'Bug not found'
      });
    }
    
    // Get comments for this bug
    const comments = await Comment.find({ bug: bugId, parentComment: null })
      .populate('author', 'firstName lastName email avatar role')
      .populate({
        path: 'replies',
        populate: {
          path: 'author',
          select: 'firstName lastName email avatar role'
        }
      })
      .sort({ createdAt: -1 });

    // Transform the comments to include fullName for the author
    const transformedComments = comments.map(comment => {
      const commentObj = comment.toObject();
      if (commentObj.author && typeof commentObj.author === 'object') {
        (commentObj.author as any).name = `${(commentObj.author as any).firstName || ''} ${(commentObj.author as any).lastName || ''}`.trim() || 'Unknown User';
      }
      // Transform replies too
      if (commentObj.replies && Array.isArray(commentObj.replies)) {
        commentObj.replies = commentObj.replies.map((reply: any) => {
          if (reply.author && typeof reply.author === 'object') {
            reply.author.name = `${reply.author.firstName || ''} ${reply.author.lastName || ''}`.trim() || 'Unknown User';
          }
          return reply;
        });
      }
      return commentObj;
    });

    res.json({
      success: true,
      data: {
        comments: transformedComments
      }
    });

  } catch (error) {
    console.error('Get bug comments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch comments'
    });
  }
});

export default router;
