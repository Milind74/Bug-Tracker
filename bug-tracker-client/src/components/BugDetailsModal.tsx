import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Button,
  TextField,
  Chip,
  Avatar,
  Typography,
  Box,
  Stack,
  IconButton,
} from '@mui/material';
import { Send, Close } from '@mui/icons-material';
import { commentsApi } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import type { Bug, User } from '../types';

interface BugDetailsModalProps {
  bug: Bug;
  users: User[];
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export const BugDetailsModal: React.FC<BugDetailsModalProps> = ({
  bug,
  users: _users,
  isOpen,
  onClose,
  onUpdate: _onUpdate,
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState('');

  const { data: commentsResponse, isLoading: commentsLoading, error: commentsError } = useQuery({
    queryKey: ['bug-comments', bug.id],
    queryFn: () => commentsApi.getBugComments(bug.id),
    enabled: !!bug.id && isOpen, // Only fetch when modal is open and bug.id exists
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
    gcTime: 1000 * 60 * 10, // Keep in cache for 10 minutes
    retry: 1, // Only retry once on failure
    retryOnMount: false, // Don't retry when component mounts
    refetchOnWindowFocus: false, // Don't refetch when window gets focus
  });

  const comments = Array.isArray(commentsResponse) ? commentsResponse : commentsResponse?.data || [];

  const createCommentMutation = useMutation({
    mutationFn: (content: string) => commentsApi.createComment({ 
      content, 
      bugId: bug.id 
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bug-comments', bug.id] });
      setNewComment('');
    },
  });

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim()) {
      createCommentMutation.mutate(newComment.trim());
    }
  };

  const getPriorityColor = (priority: Bug['priority']) => {
    switch (priority) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const getStatusColor = (status: Bug['status']) => {
    switch (status) {
      case 'open': return 'info';
      case 'in-progress': return 'warning';
      case 'resolved': return 'success';
      case 'closed': return 'default';
      default: return 'default';
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">{bug.title}</Typography>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Stack>
      </DialogTitle>
      
      <DialogContent>
        <Stack spacing={3}>
          {/* Bug Info */}
          <Stack direction="row" spacing={1}>
            <Chip 
              label={(bug.priority || '').charAt(0).toUpperCase() + (bug.priority || '').slice(1) || 'Unknown'}
              color={getPriorityColor(bug.priority) as any}
            />
            <Chip 
              label={(bug.status || '').split('-').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1)
              ).join(' ') || 'Unknown'}
              color={getStatusColor(bug.status) as any}
            />
          </Stack>

          {/* Description */}
          <Box>
            <Typography variant="h6" gutterBottom>
              Description
            </Typography>
            <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="body1">{bug.description}</Typography>
            </Box>
          </Box>

          {/* Reporter & Assignee */}
          <Stack direction="row" spacing={4}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Reporter
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <Avatar sx={{ width: 24, height: 24 }}>
                  {bug.reporter.name?.charAt(0) || '?'}
                </Avatar>
                <Typography variant="body2">{bug.reporter.name}</Typography>
              </Stack>
            </Box>
            
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Assignee
              </Typography>
              {bug.assignee ? (
                <Stack direction="row" spacing={1} alignItems="center">
                  <Avatar sx={{ width: 24, height: 24 }}>
                    {bug.assignee.name?.charAt(0) || '?'}
                  </Avatar>
                  <Typography variant="body2">{bug.assignee.name}</Typography>
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Unassigned
                </Typography>
              )}
            </Box>
          </Stack>

          {/* Comments Section */}
          <Box>
            <Typography variant="h6" gutterBottom>
              Comments
            </Typography>
            
            {/* Add Comment Form */}
            <Box component="form" onSubmit={handleSubmitComment} sx={{ mb: 2 }}>
              <Stack direction="row" spacing={2} alignItems="flex-end">
                <Avatar sx={{ width: 32, height: 32 }}>
                  {user?.name?.charAt(0) || '?'}
                </Avatar>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  variant="outlined"
                  size="small"
                />
                <Button
                  type="submit"
                  variant="contained"
                  disabled={!newComment.trim() || createCommentMutation.isPending}
                  startIcon={<Send />}
                >
                  Post
                </Button>
              </Stack>
            </Box>

            {/* Comments List */}
            {commentsError ? (
              <Typography color="error">
                Failed to load comments. Please try again later.
              </Typography>
            ) : commentsLoading ? (
              <Typography>Loading comments...</Typography>
            ) : comments.length === 0 ? (
              <Typography color="text.secondary">
                No comments yet. Be the first to comment!
              </Typography>
            ) : (
              <Stack spacing={2}>
                {comments.map((comment: any) => {
                  const authorName = comment.author?.name || 'Unknown User';
                  
                  return (
                    <Stack key={comment.id || comment._id} direction="row" spacing={2}>
                      <Avatar sx={{ width: 32, height: 32 }}>
                        {authorName.charAt(0) || '?'}
                      </Avatar>
                      <Box sx={{ flex: 1, bgcolor: 'grey.50', p: 2, borderRadius: 1 }}>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                          <Typography variant="subtitle2">
                            {authorName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {format(new Date(comment.createdAt), 'MMM dd, yyyy at h:mm a')}
                          </Typography>
                        </Stack>
                        <Typography variant="body2">{comment.content}</Typography>
                      </Box>
                    </Stack>
                  );
                })}
              </Stack>
            )}
          </Box>
        </Stack>
      </DialogContent>
    </Dialog>
  );
};