import mongoose, { Document, Schema } from 'mongoose';

export interface IBug extends Document {
  _id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in-progress' | 'resolved' | 'closed' | 'reopened';
  type: 'bug' | 'feature' | 'improvement' | 'task';
  assignedTo?: mongoose.Types.ObjectId;
  reporter: mongoose.Types.ObjectId;
  tags: string[];
  attachments: string[];
  estimatedHours?: number;
  actualHours?: number;
  dueDate?: Date;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  // Virtual populated fields
  assignedUser?: any;
  reporterUser?: any;
  commentsCount?: number;
}

const bugSchema = new Schema<IBug>(
  {
    title: {
      type: String,
      required: [true, 'Bug title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters']
    },
    description: {
      type: String,
      required: [true, 'Bug description is required'],
      trim: true,
      maxlength: [5000, 'Description cannot exceed 5000 characters']
    },
    priority: {
      type: String,
      enum: {
        values: ['low', 'medium', 'high', 'critical'],
        message: 'Priority must be one of: low, medium, high, critical'
      },
      required: true,
      default: 'medium'
    },
    status: {
      type: String,
      enum: {
        values: ['open', 'in-progress', 'resolved', 'closed', 'reopened'],
        message: 'Status must be one of: open, in-progress, resolved, closed, reopened'
      },
      required: true,
      default: 'open'
    },
    type: {
      type: String,
      enum: {
        values: ['bug', 'feature', 'improvement', 'task'],
        message: 'Type must be one of: bug, feature, improvement, task'
      },
      required: true,
      default: 'bug'
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    reporter: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reporter is required']
    },
    tags: [{
      type: String,
      trim: true,
      lowercase: true
    }],
    attachments: [{
      type: String // Store file paths/URLs
    }],
    estimatedHours: {
      type: Number,
      min: [0, 'Estimated hours cannot be negative'],
      max: [1000, 'Estimated hours cannot exceed 1000']
    },
    actualHours: {
      type: Number,
      min: [0, 'Actual hours cannot be negative'],
      max: [1000, 'Actual hours cannot exceed 1000']
    },
    dueDate: {
      type: Date,
      validate: {
        validator: function(value: Date) {
          return !value || value > new Date();
        },
        message: 'Due date must be in the future'
      }
    },
    resolvedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function(doc, ret) {
        const obj = ret as any;
        if (obj.__v !== undefined) delete obj.__v;
        return obj;
      }
    },
    toObject: {
      virtuals: true
    }
  }
);

// Indexes for better performance
bugSchema.index({ status: 1, priority: 1 });
bugSchema.index({ assignedTo: 1 });
bugSchema.index({ reporter: 1 });
bugSchema.index({ createdAt: -1 });
bugSchema.index({ title: 'text', description: 'text' }); // Text search index

// Pre-save middleware to set resolvedAt when status changes to closed
bugSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    if (this.status === 'closed' && !this.resolvedAt) {
      this.resolvedAt = new Date();
    } else if (this.status !== 'closed') {
      this.resolvedAt = undefined;
    }
  }
  next();
});

// Virtual for populated assignedUser
bugSchema.virtual('assignedUser', {
  ref: 'User',
  localField: 'assignedTo',
  foreignField: '_id',
  justOne: true
});

// Virtual for populated reporterUser
bugSchema.virtual('reporterUser', {
  ref: 'User',
  localField: 'reporter',
  foreignField: '_id',
  justOne: true
});

// Virtual for comments count
bugSchema.virtual('commentsCount', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'bug',
  count: true
});

export const Bug = mongoose.model<IBug>('Bug', bugSchema);
