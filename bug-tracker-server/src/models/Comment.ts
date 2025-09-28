import mongoose, { Document, Schema } from 'mongoose';

export interface IComment extends Document {
  _id: string;
  content: string;
  author: mongoose.Types.ObjectId;
  bug: mongoose.Types.ObjectId;
  parentComment?: mongoose.Types.ObjectId; // For threaded comments
  isEdited: boolean;
  editedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  // Virtual populated fields
  authorUser?: any;
  replies?: IComment[];
}

const commentSchema = new Schema<IComment>(
  {
    content: {
      type: String,
      required: [true, 'Comment content is required'],
      trim: true,
      maxlength: [2000, 'Comment cannot exceed 2000 characters']
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Comment author is required']
    },
    bug: {
      type: Schema.Types.ObjectId,
      ref: 'Bug',
      required: [true, 'Bug reference is required']
    },
    parentComment: {
      type: Schema.Types.ObjectId,
      ref: 'Comment',
      default: null
    },
    isEdited: {
      type: Boolean,
      default: false
    },
    editedAt: {
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
commentSchema.index({ bug: 1, createdAt: -1 });
commentSchema.index({ author: 1 });
commentSchema.index({ parentComment: 1 });

// Pre-save middleware to set editedAt when content is modified
commentSchema.pre('save', function(next) {
  if (this.isModified('content') && !this.isNew) {
    this.isEdited = true;
    this.editedAt = new Date();
  }
  next();
});

// Virtual for populated author
commentSchema.virtual('authorUser', {
  ref: 'User',
  localField: 'author',
  foreignField: '_id',
  justOne: true
});

// Virtual for replies (child comments)
commentSchema.virtual('replies', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'parentComment'
});

export const Comment = mongoose.model<IComment>('Comment', commentSchema);
