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
} from '@mui/material';
import { Close, Save } from '@mui/icons-material';
import { bugsApi } from '../utils/api';
import type { Bug, User, UpdateBugData } from '../types';

const editBugSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title is too long'),
  description: z.string().min(1, 'Description is required').max(1000, 'Description is too long'),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  status: z.enum(['open', 'in-progress', 'resolved', 'closed']),
  assigneeId: z.string().optional(),
});

type EditBugFormData = z.infer<typeof editBugSchema>;

interface EditBugModalProps {
  bug: Bug;
  users: User[];
  onClose: () => void;
}

export const EditBugModal: React.FC<EditBugModalProps> = ({
  bug,
  users,
  onClose,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    setValue,
  } = useForm<EditBugFormData>({
    resolver: zodResolver(editBugSchema),
    defaultValues: {
      title: bug.title,
      description: bug.description,
      priority: bug.priority,
      status: bug.status,
      assigneeId: bug.assignee?.id || '',
    },
    mode: 'onChange',
  });

  const updateBugMutation = useMutation({
    mutationFn: (data: UpdateBugData) => bugsApi.updateBug(bug.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bugs'] });
      onClose(); // Close the modal after successful update
    },
  });

  const onSubmit = async (data: EditBugFormData) => {
    setIsSubmitting(true);
    try {
      const updateData: UpdateBugData = {
        ...data,
        assigneeId: data.assigneeId || undefined,
      };
      await updateBugMutation.mutateAsync(updateData);
    } catch (error) {
      console.error('Failed to update bug:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const watchedStatus = watch('status');
  const watchedPriority = watch('priority');
  const watchedAssigneeId = watch('assigneeId');

  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Edit Bug Report</Typography>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={3} sx={{ mt: 1 }}>
          {updateBugMutation.error && (
            <Alert severity="error">
              Failed to update bug. Please try again.
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
          />

          {/* Status and Priority Row */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            {/* Status */}
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={watchedStatus}
                label="Status"
                onChange={(e) => setValue('status', e.target.value as any)}
              >
                <MenuItem value="open">Open</MenuItem>
                <MenuItem value="in-progress">In Progress</MenuItem>
                <MenuItem value="resolved">Resolved</MenuItem>
                <MenuItem value="closed">Closed</MenuItem>
              </Select>
            </FormControl>

            {/* Priority */}
            <FormControl fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select
                value={watchedPriority}
                label="Priority"
                onChange={(e) => setValue('priority', e.target.value as any)}
              >
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="critical">Critical</MenuItem>
              </Select>
            </FormControl>
          </Stack>

          {/* Assignee */}
          <FormControl fullWidth>
            <InputLabel>Assignee</InputLabel>
            <Select
              value={watchedAssigneeId || ''}
              label="Assignee"
              onChange={(e) => setValue('assigneeId', e.target.value)}
            >
              <MenuItem value="">
                <em>Unassigned</em>
              </MenuItem>
              {users.map((user) => (
                <MenuItem key={user.id} value={user.id}>
                  {user.name} ({user.email})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Bug Info */}
          <Stack spacing={1} sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Bug Information
            </Typography>
            <Typography variant="body2">
              <strong>Bug ID:</strong> #{bug.id?.slice(-6) || 'N/A'}
            </Typography>
            <Typography variant="body2">
              <strong>Reporter:</strong> {bug.reporter.name}
            </Typography>
            <Typography variant="body2">
              <strong>Created:</strong> {new Date(bug.createdAt).toLocaleDateString()}
            </Typography>
            <Typography variant="body2">
              <strong>Last Updated:</strong> {new Date(bug.updatedAt).toLocaleDateString()}
            </Typography>
          </Stack>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onClose} variant="outlined">
          Cancel
        </Button>
        <Button
          onClick={handleSubmit(onSubmit)}
          variant="contained"
          disabled={!isValid || isSubmitting}
          startIcon={isSubmitting ? <CircularProgress size={16} /> : <Save />}
          type="submit"
        >
          {isSubmitting ? 'Updating...' : 'Update Bug'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};