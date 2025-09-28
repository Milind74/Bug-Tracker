import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Tooltip,
  Stack,
} from '@mui/material';
import {
  MoreVert,
  Edit,
  Delete,
  Visibility,
  Comment,
  Person,
} from '@mui/icons-material';
import { EditBugModal } from './EditBugModal';
import { BugDetailsModal } from './BugDetailsModal';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';
import { ErrorModal } from './ErrorModal';
import { bugsApi } from '../utils/api';
import type { Bug, User } from '../types';

interface BugTableProps {
  bugs: Bug[];
  users: User[];
  isLoading: boolean;
  onRefetch: () => void;
}

export const BugTable: React.FC<BugTableProps> = ({
  bugs,
  users,
  isLoading,
  onRefetch,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedBug, setSelectedBug] = useState<Bug | null>(null);
  const [editingBug, setEditingBug] = useState<Bug | null>(null);
  const [viewingBug, setViewingBug] = useState<Bug | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [bugToDelete, setBugToDelete] = useState<Bug | null>(null);
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const queryClient = useQueryClient();

  const deleteBugMutation = useMutation({
    mutationFn: bugsApi.deleteBug,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bugs'] });
      handleCloseMenu();
    },
    onError: (error: any) => {
      console.error('Delete bug error:', error);
      const message = error?.response?.data?.message || 'Failed to delete bug. Please try again.';
      setErrorMessage(message);
      setErrorModalOpen(true);
    },
  });

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>, bug: Bug) => {
    setAnchorEl(event.currentTarget);
    setSelectedBug(bug);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setSelectedBug(null);
  };

  const handleEdit = () => {
    if (selectedBug) {
      setEditingBug(selectedBug);
      handleCloseMenu();
    }
  };

  const handleView = () => {
    if (selectedBug) {
      setViewingBug(selectedBug);
      handleCloseMenu();
    }
  };

  const handleDelete = async () => {
    if (selectedBug) {
      setBugToDelete(selectedBug); // Store the bug before closing menu
      setDeleteModalOpen(true);
      handleCloseMenu();
    }
  };

  const handleDeleteConfirm = () => {
    if (bugToDelete) {
      deleteBugMutation.mutate(bugToDelete.id);
      setDeleteModalOpen(false);
      setBugToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModalOpen(false);
    setBugToDelete(null);
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
      default: return 'default';
    }
  };

  const getStatusIcon = (status: Bug['status']) => {
    switch (status) {
      case 'open': return '🔴';
      case 'in-progress': return '🟡';
      case 'resolved': return '🟢';
      default: return '⚪';
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
        <CircularProgress />
      </Box>
    );
  }

  if (bugs.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Alert severity="info">
          <Typography variant="h6" gutterBottom>
            No bugs found
          </Typography>
          <Typography variant="body2">
            Create your first bug report to get started!
          </Typography>
        </Alert>
      </Paper>
    );
  }

  return (
    <>
      <TableContainer component={Paper} elevation={2}>
        <Table size="medium">
          <TableHead>
            <TableRow sx={{ backgroundColor: 'grey.50' }}>
              <TableCell>
                <Typography variant="subtitle2" fontWeight="bold">
                  Bug ID
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="subtitle2" fontWeight="bold">
                  Title
                </Typography>
              </TableCell>
              <TableCell align="center">
                <Typography variant="subtitle2" fontWeight="bold">
                  Status
                </Typography>
              </TableCell>
              <TableCell align="center">
                <Typography variant="subtitle2" fontWeight="bold">
                  Priority
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="subtitle2" fontWeight="bold">
                  Assignee
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="subtitle2" fontWeight="bold">
                  Reporter
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="subtitle2" fontWeight="bold">
                  Created
                </Typography>
              </TableCell>
              <TableCell align="center">
                <Typography variant="subtitle2" fontWeight="bold">
                  Actions
                </Typography>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {bugs.map((bug) => (
              <TableRow 
                key={bug.id} 
                hover
                sx={{ '&:hover': { backgroundColor: 'grey.25' } }}
              >
                {/* Bug ID */}
                <TableCell>
                  <Typography 
                    variant="body2" 
                    fontFamily="monospace"
                    sx={{ cursor: 'pointer', color: 'primary.main' }}
                    onClick={() => setViewingBug(bug)}
                  >
                    #{bug.id?.slice(-6) || 'N/A'}
                  </Typography>
                </TableCell>

                {/* Title */}
                <TableCell>
                  <Box>
                    <Typography 
                      variant="body1" 
                      fontWeight="medium"
                      sx={{ 
                        cursor: 'pointer',
                        '&:hover': { color: 'primary.main' }
                      }}
                      onClick={() => setViewingBug(bug)}
                    >
                      {bug.title}
                    </Typography>
                    <Typography 
                      variant="caption" 
                      color="text.secondary"
                      sx={{ 
                        display: 'block',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: 300
                      }}
                    >
                      {bug.description}
                    </Typography>
                  </Box>
                </TableCell>

                {/* Status */}
                <TableCell align="center">
                  <Chip
                    size="small"
                    label={
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <span>{getStatusIcon(bug.status)}</span>
                        <span>
                          {(bug.status || '').split('-').map(word => 
                            word.charAt(0).toUpperCase() + word.slice(1)
                          ).join(' ') || 'Unknown'}
                        </span>
                      </Stack>
                    }
                    color={getStatusColor(bug.status) as any}
                    variant="filled"
                  />
                </TableCell>

                {/* Priority */}
                <TableCell align="center">
                  <Chip
                    size="small"
                    label={(bug.priority || '').charAt(0).toUpperCase() + (bug.priority || '').slice(1) || 'Unknown'}
                    color={getPriorityColor(bug.priority) as any}
                    variant="outlined"
                  />
                </TableCell>

                {/* Assignee */}
                <TableCell>
                  {bug.assignee ? (
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Avatar sx={{ width: 32, height: 32 }}>
                        {bug.assignee.name?.charAt(0) || '?'}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {bug.assignee.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {bug.assignee.email}
                        </Typography>
                      </Box>
                    </Stack>
                  ) : (
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Avatar sx={{ width: 32, height: 32, bgcolor: 'grey.300' }}>
                        <Person fontSize="small" />
                      </Avatar>
                      <Typography variant="body2" color="text.secondary">
                        Unassigned
                      </Typography>
                    </Stack>
                  )}
                </TableCell>

                {/* Reporter */}
                <TableCell>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Avatar sx={{ width: 28, height: 28 }}>
                      {bug.reporter.name?.charAt(0) || '?'}
                    </Avatar>
                    <Typography variant="body2">
                      {bug.reporter.name}
                    </Typography>
                  </Stack>
                </TableCell>

                {/* Created Date */}
                <TableCell>
                  <Tooltip title={format(new Date(bug.createdAt), 'PPpp')}>
                    <Typography variant="body2" color="text.secondary">
                      {format(new Date(bug.createdAt), 'MMM dd, yyyy')}
                    </Typography>
                  </Tooltip>
                </TableCell>

                {/* Actions */}
                <TableCell align="center">
                  <Stack direction="row" spacing={0.5} justifyContent="center">
                    <Tooltip title="View Details">
                      <IconButton 
                        size="small"
                        onClick={() => setViewingBug(bug)}
                        color="info"
                      >
                        <Visibility fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    
                    <Tooltip title="Comments">
                      <IconButton 
                        size="small"
                        onClick={() => setViewingBug(bug)}
                        color="default"
                      >
                        <Comment fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="More Actions">
                      <IconButton
                        size="small"
                        onClick={(e) => handleOpenMenu(e, bug)}
                        color="default"
                      >
                        <MoreVert fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={handleView}>
          <Visibility fontSize="small" sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        <MenuItem onClick={handleEdit}>
          <Edit fontSize="small" sx={{ mr: 1 }} />
          Edit Bug
        </MenuItem>
        <MenuItem 
          onClick={handleDelete}
          sx={{ color: 'error.main' }}
          disabled={deleteBugMutation.isPending}
        >
          <Delete fontSize="small" sx={{ mr: 1 }} />
          Delete Bug
        </MenuItem>
      </Menu>

      {/* Edit Bug Modal */}
      {editingBug && (
        <EditBugModal
          bug={editingBug}
          users={users}
          onClose={() => setEditingBug(null)}
        />
      )}

      {/* Bug Details Modal */}
      {viewingBug && (
        <BugDetailsModal
          bug={viewingBug}
          users={users}
          isOpen={!!viewingBug}
          onClose={() => setViewingBug(null)}
          onUpdate={() => {
            onRefetch();
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        open={deleteModalOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        bug={bugToDelete}
        isLoading={deleteBugMutation.isPending}
      />

      {/* Error Modal */}
      <ErrorModal
        isOpen={errorModalOpen}
        title="Delete Failed"
        message={errorMessage}
        onClose={() => setErrorModalOpen(false)}
      />
    </>
  );
};