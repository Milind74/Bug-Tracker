import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Box, 
  Container, 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Stack,
} from '@mui/material';
import { Add, Download } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { BugTable, CreateBugModal, BugFiltersComponent } from '../components';
import { Analytics } from '../components/Analytics';
import { bugsApi, usersApi } from '../utils/api';
import type { BugFilters } from '../types';

export const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const [view, setView] = useState<'bugs' | 'analytics'>('bugs');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [filters, setFilters] = useState<BugFilters>({});
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Debug: Log filter changes
  useEffect(() => {
    console.log('DashboardPage: Filters changed:', filters);
    setCurrentPage(1); // Reset to first page when filters change
  }, [filters]);

  // Fetch bugs with current filters and pagination
  const { data: bugsResponse, isLoading: bugsLoading, refetch: refetchBugs } = useQuery({
    queryKey: ['bugs', filters, currentPage],
    queryFn: () => {
      console.log('DashboardPage: React Query calling getBugs with filters:', filters, 'page:', currentPage);
      return bugsApi.getBugs(filters, currentPage, itemsPerPage);
    },
  });

  // Extract bugs array and pagination from the response
  const bugs = bugsResponse?.data || [];
  const pagination = bugsResponse?.pagination || {
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNext: false,
    hasPrev: false,
  };
  const totalBugs = pagination.totalCount;

  // Fetch users for assignments
  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: usersApi.getUsers,
  });

  const handleExport = async () => {
    try {
      const blob = await bugsApi.exportBugs(filters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bugs-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', backgroundColor: 'grey.50' }}>
      {/* Header */}
      <AppBar position="static" elevation={1}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            🐛 Bug Tracker Dashboard
          </Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' } }}>
              Welcome, <strong>{user?.name}</strong>
            </Typography>
            <Button color="inherit" onClick={logout} variant="outlined" size="small">
              Logout
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Container maxWidth="xl" sx={{ mt: 3, mb: 4 }}>
        {/* Navigation Tabs */}
        <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
          <Button
            variant={view === 'bugs' ? 'contained' : 'outlined'}
            onClick={() => setView('bugs')}
            size="large"
            sx={{ px: 3 }}
          >
            🐛 Bug Management
          </Button>
          <Button
            variant={view === 'analytics' ? 'contained' : 'outlined'}
            onClick={() => setView('analytics')}
            size="large"
            sx={{ px: 3 }}
          >
            📊 Analytics
          </Button>
        </Stack>

        {/* Content Area */}
        {view === 'bugs' ? (
          <>
            {/* Action Bar */}
            <Stack 
              direction={{ xs: 'column', md: 'row' }} 
              justifyContent="space-between"
              alignItems={{ xs: 'stretch', md: 'center' }}
              spacing={2}
              sx={{ mb: 3 }}
            >
              <Stack direction="row" spacing={2} alignItems="center">
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => setIsCreateModalOpen(true)}
                  size="large"
                  sx={{ fontWeight: 'bold' }}
                >
                  Create Bug
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Download />}
                  onClick={handleExport}
                  size="large"
                >
                  Export CSV
                </Button>
              </Stack>
              
              <Stack direction="row" spacing={2} alignItems="center">
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'medium' }}>
                  {filters.search ? (
                    <>
                      {totalBugs} result{totalBugs !== 1 ? 's' : ''} for "{filters.search}"
                    </>
                  ) : (
                    <>
                      {totalBugs} bug{totalBugs !== 1 ? 's' : ''} total
                    </>
                  )}
                  {bugsLoading && <span> • Searching...</span>}
                </Typography>
              </Stack>
            </Stack>

            {/* Filters */}
            <BugFiltersComponent
              filters={filters}
              onFiltersChange={setFilters}
              users={users as any}
            />

            {/* Bug Table */}
            <BugTable
              bugs={bugs as any}
              users={users as any}
              isLoading={bugsLoading}
              onRefetch={refetchBugs}
            />

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Typography variant="body2" color="text.secondary">
                    Page {pagination.currentPage} of {pagination.totalPages} 
                    ({pagination.totalCount} total bugs)
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      disabled={!pagination.hasPrev}
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      disabled={!pagination.hasNext}
                      onClick={() => setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))}
                    >
                      Next
                    </Button>
                  </Box>
                </Stack>
              </Box>
            )}
          </>
        ) : (
          /* Analytics View */
          <Analytics />
        )}
      </Container>

      {/* Create Bug Modal */}
      <CreateBugModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        users={users as any}
      />
    </Box>
  );
};