import React from 'react';
import { Search, X } from 'lucide-react';
import { 
  Input, 
  Button, 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue,
  Badge
} from './ui';
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
  const handleFilterChange = (key: keyof BugFilters, value: string) => {
    const newFilters = {
      ...filters,
      [key]: value === '' ? undefined : value,
    };
    console.log('BugFilters: Filter changed -', key, 'to:', value);
    console.log('BugFilters: New filters object:', newFilters);
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search bugs..."
            value={filters.search || ''}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Status Filter */}
        <Select
          value={filters.status || ''}
          onValueChange={(value) => handleFilterChange('status', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Statuses</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in-progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>

        {/* Priority Filter */}
        <Select
          value={filters.priority || ''}
          onValueChange={(value) => handleFilterChange('priority', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Filter by priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Priorities</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
          </SelectContent>
        </Select>

        {/* Assignee Filter */}
        <Select
          value={filters.assigneeId || ''}
          onValueChange={(value) => handleFilterChange('assigneeId', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Filter by assignee" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Assignees</SelectItem>
            <SelectItem value="unassigned">Unassigned</SelectItem>
            {users.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                {user.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Active Filters */}
      {activeFiltersCount > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-600">Active filters:</span>
          
          {filters.search && (
            <Badge variant="secondary" className="gap-1">
              Search: {filters.search}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => handleFilterChange('search', '')}
              />
            </Badge>
          )}
          
          {filters.status && (
            <Badge variant="secondary" className="gap-1">
              Status: {filters.status.split('-').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1)
              ).join(' ')}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => handleFilterChange('status', '')}
              />
            </Badge>
          )}
          
          {filters.priority && (
            <Badge variant="secondary" className="gap-1">
              Priority: {filters.priority.charAt(0).toUpperCase() + filters.priority.slice(1)}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => handleFilterChange('priority', '')}
              />
            </Badge>
          )}
          
          {filters.assigneeId && (
            <Badge variant="secondary" className="gap-1">
              Assignee: {
                filters.assigneeId === 'unassigned' 
                  ? 'Unassigned' 
                  : users.find(u => u.id === filters.assigneeId)?.name || 'Unknown'
              }
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => handleFilterChange('assigneeId', '')}
              />
            </Badge>
          )}
          
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
};