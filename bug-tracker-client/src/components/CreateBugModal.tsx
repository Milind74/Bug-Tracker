import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Typography,
  IconButton,
  Alert,
  CircularProgress,
  Box,
} from '@mui/material';
import { Close, Add } from '@mui/icons-material';
import { bugsApi } from '../utils/api';
import type { User, CreateBugData } from '../types';

const createBugSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title is too long'),
  description: z.string().min(1, 'Description is required').max(1000, 'Description is too long'),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  assigneeId: z.string().optional(),
  tags: z.string().optional(),
});

type CreateBugFormData = z.infer<typeof createBugSchema>;

interface CreateBugModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
}

export const CreateBugModal: React.FC<CreateBugModalProps> = ({
  isOpen,
  onClose,
  users,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    watch,
    setValue,
  } = useForm<CreateBugFormData>({
    resolver: zodResolver(createBugSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'medium',
      assigneeId: '',
      tags: '',
    },
    mode: 'onChange',
  });

  const createBugMutation = useMutation({
    mutationFn: (data: CreateBugData) => bugsApi.createBug(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bugs'] });
      handleClose();
    },
  });

  const handleClose = () => {
    reset();
    setError(null);
    onClose();
  };

  const onSubmit = async (data: CreateBugFormData) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const createData: CreateBugData = {
        title: data.title,
        description: data.description,
        priority: data.priority,
        assigneeId: data.assigneeId || undefined,
        tags: data.tags ? data.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
      };
      await createBugMutation.mutateAsync(createData);
    } catch (error: any) {
      console.error('Failed to create bug:', error);
      const message = error?.response?.data?.message || 'Failed to create bug. Please try again.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const watchedPriority = watch('priority');
  const watchedAssigneeId = watch('assigneeId');

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'error.main';
      case 'high': return 'warning.main';
      case 'medium': return 'info.main';
      case 'low': return 'success.main';
      default: return 'grey.500';
    }
  };

  return (
    <Dialog open={isOpen} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={1} alignItems="center">
            <Add color="primary" />
            <Typography variant="h6">Create New Bug Report</Typography>
          </Stack>
          <IconButton onClick={handleClose} size="small">
            <Close />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent dividers>
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <Stack spacing={3} sx={{ mt: 1 }}>
            {createBugMutation.error && (
              <Alert severity="error">
                Failed to create bug. Please try again.
              </Alert>
            )}

            {/* Title */}
            <TextField
              fullWidth
              label="Bug Title"
              {...register('title')}
              error={!!errors.title}
              helperText={errors.title?.message}
              variant="outlined"
              placeholder="Enter a descriptive title for the bug..."
            />

            {/* Description */}
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Description"
              {...register('description')}
              error={!!errors.description}
              helperText={errors.description?.message}
              variant="outlined"
              placeholder="Describe the bug in detail, including steps to reproduce..."
            />

            {/* Priority and Assignee Row */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              {/* Priority */}
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={watchedPriority}
                  label="Priority"
                  onChange={(e) => setValue('priority', e.target.value as any)}
                >
                  <MenuItem value="low">
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'success.main' }} />
                      <Typography>Low</Typography>
                    </Stack>
                  </MenuItem>
                  <MenuItem value="medium">
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'info.main' }} />
                      <Typography>Medium</Typography>
                    </Stack>
                  </MenuItem>
                  <MenuItem value="high">
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'warning.main' }} />
                      <Typography>High</Typography>
                    </Stack>
                  </MenuItem>
                  <MenuItem value="critical">
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'error.main' }} />
                      <Typography>Critical</Typography>
                    </Stack>
                  </MenuItem>
                </Select>
              </FormControl>

              {/* Assignee */}
              <FormControl fullWidth>
                <InputLabel>Assignee</InputLabel>
                <Select
                  value={watchedAssigneeId || ''}
                  label="Assignee"
                  onChange={(e) => setValue('assigneeId', e.target.value)}
                >
                  <MenuItem value="">
                    <Typography color="text.secondary">
                      <em>Leave unassigned</em>
                    </Typography>
                  </MenuItem>
                  {users.map((user) => (
                    <MenuItem key={user.id} value={user.id}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Box
                          sx={{
                            width: 24,
                            height: 24,
                            borderRadius: '50%',
                            bgcolor: 'primary.main',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px',
                            fontWeight: 'bold'
                          }}
                        >
                          {user.name?.charAt(0) || '?'}
                        </Box>
                        <Box>
                          <Typography variant="body2">{user.name || 'Unknown User'}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {user.email || 'No email'}
                          </Typography>
                        </Box>
                      </Stack>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>

            {/* Tags */}
            <TextField
              fullWidth
              label="Tags (Optional)"
              {...register('tags')}
              error={!!errors.tags}
              helperText={errors.tags?.message || 'Separate tags with commas (e.g., ui, login, critical)'}
              variant="outlined"
              placeholder="frontend, authentication, critical..."
            />

            {/* Error Alert */}
            {error && (
              <Alert severity="error" sx={{ borderRadius: 2 }}>
                {error}
              </Alert>
            )}

            {/* Preview */}
            <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Preview
              </Typography>
              <Stack spacing={1}>
                <Typography variant="body2">
                  <strong>Priority:</strong>{' '}
                  <Box 
                    component="span" 
                    sx={{ 
                      px: 1, 
                      py: 0.5, 
                      bgcolor: getPriorityColor(watchedPriority),
                      color: 'white',
                      borderRadius: 1,
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}
                  >
                    {watchedPriority?.toUpperCase()}
                  </Box>
                </Typography>
                <Typography variant="body2">
                  <strong>Assignee:</strong>{' '}
                  {watchedAssigneeId 
                    ? users.find(u => u.id === watchedAssigneeId)?.name || 'Unknown User'
                    : 'Unassigned'
                  }
                </Typography>
                <Typography variant="body2">
                  <strong>Status:</strong> Open (new bugs start as Open)
                </Typography>
              </Stack>
            </Box>
          </Stack>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={handleClose} variant="outlined" size="large">
          Cancel
        </Button>
        <Button
          onClick={handleSubmit(onSubmit)}
          variant="contained"
          disabled={!isValid || isSubmitting}
          startIcon={isSubmitting ? <CircularProgress size={16} /> : <Add />}
          size="large"
          sx={{ fontWeight: 'bold' }}
        >
          {isSubmitting ? 'Creating Bug...' : 'Create Bug Report'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};