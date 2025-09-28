import React, { useState, useEffect } from 'react';
import {
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Paper,
  InputAdornment,
  CircularProgress,
} from '@mui/material';
import { Search, Clear } from '@mui/icons-material';
import { useDebounce } from '../hooks';
import type { BugFilters, User } from '../types';

interface BugFiltersComponentProps {
  filters: BugFilters;
  onFiltersChange: (filters: BugFilters) => void;
  users: User[];
}

export const BugFiltersComponent: React.FC<BugFiltersComponentProps> = ({
  filters,
  onFiltersChange,
  users,
}) => {
  // Local state for immediate search input
  const [searchInput, setSearchInput] = useState(filters.search || '');
  
  // Debounced search value
  const debouncedSearchValue = useDebounce(searchInput, 150); // Reduced to 150ms for faster response
  
  // Track if search is pending (user typed but debounce hasn't triggered yet)
  const isSearchPending = searchInput !== debouncedSearchValue;
  
  // Update filters when debounced value changes
  useEffect(() => {
    // Only search if there are at least 1 characters or if it's empty (to clear search)
    if (debouncedSearchValue !== (filters.search || '')) {
      onFiltersChange({
        ...filters,
        search: debouncedSearchValue || undefined,
      });
    }
  }, [debouncedSearchValue, filters, onFiltersChange]);
  
  // Update local search input when filters change from parent
  useEffect(() => {
    setSearchInput(filters.search || '');
  }, [filters.search]);

  const handleFilterChange = (key: keyof BugFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value || undefined,
    });
  };

  const handleSearchInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(event.target.value);
  };

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
        <TextField
          fullWidth
          label="Search"
          variant="outlined"
          size="small"
          value={searchInput}
          onChange={handleSearchInputChange}
          placeholder="Type to search bugs (title, description)..."
          sx={{ minWidth: 200 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                {isSearchPending ? (
                  <CircularProgress size={16} />
                ) : (
                  <Search fontSize="small" />
                )}
              </InputAdornment>
            ),
            endAdornment: searchInput && (
              <InputAdornment position="end">
                <Clear 
                  fontSize="small" 
                  sx={{ cursor: 'pointer', color: 'text.secondary' }}
                  onClick={() => setSearchInput('')}
                />
              </InputAdornment>
            ),
          }}
        />

        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={filters.status || ''}
            label="Status"
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <MenuItem value="">All Statuses</MenuItem>
            <MenuItem value="open">Open</MenuItem>
            <MenuItem value="in-progress">In Progress</MenuItem>
            <MenuItem value="resolved">Resolved</MenuItem>
            <MenuItem value="closed">Closed</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Priority</InputLabel>
          <Select
            value={filters.priority || ''}
            label="Priority"
            onChange={(e) => handleFilterChange('priority', e.target.value)}
          >
            <MenuItem value="">All Priorities</MenuItem>
            <MenuItem value="low">Low</MenuItem>
            <MenuItem value="medium">Medium</MenuItem>
            <MenuItem value="high">High</MenuItem>
            <MenuItem value="critical">Critical</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Assignee</InputLabel>
          <Select
            value={filters.assigneeId || ''}
            label="Assignee"
            onChange={(e) => handleFilterChange('assigneeId', e.target.value)}
          >
            <MenuItem value="">All Assignees</MenuItem>
            <MenuItem value="unassigned">Unassigned</MenuItem>
            {users.map((user) => (
              <MenuItem key={user.id} value={user.id}>
                {user.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>
    </Paper>
  );
};