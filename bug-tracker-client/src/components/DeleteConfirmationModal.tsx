import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
} from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';
import type { Bug } from '../types';

interface DeleteConfirmationModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  bug: Bug | null;
  isLoading?: boolean;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  open,
  onClose,
  onConfirm,
  bug,
  isLoading = false,
}) => {
  if (!bug) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon color="error" />
          <Typography variant="h6" component="span">
            Delete Bug
          </Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Alert severity="warning" sx={{ mb: 2 }}>
          This action cannot be undone. The bug and all its data will be permanently deleted.
        </Alert>
        
        <Typography variant="body1" sx={{ mb: 2 }}>
          Are you sure you want to delete the following bug?
        </Typography>
        
        <Box
          sx={{
            p: 2,
            bgcolor: 'grey.50',
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'grey.200',
          }}
        >
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Bug ID: #{bug.id?.slice(-6) || 'unknown'}
          </Typography>
          <Typography variant="h6" gutterBottom>
            {bug.title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {bug.description || 'No description provided'}
          </Typography>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          disabled={isLoading}
          sx={{ minWidth: 100 }}
        >
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color="error"
          disabled={isLoading}
          sx={{ minWidth: 100 }}
        >
          {isLoading ? 'Deleting...' : 'Delete Bug'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};