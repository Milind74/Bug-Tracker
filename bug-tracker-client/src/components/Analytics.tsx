import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from 'recharts';
import { bugsApi } from '../utils/api';

interface StatusDistribution {
  status: string;
  name: string;
  value: number;
}

interface PriorityDistribution {
  priority: string;
  name: string;
  value: number;
}

interface AnalyticsData {
  totalBugs: number;
  openBugs: number;
  inProgressBugs: number;
  resolvedBugs: number;
  closedBugs: number;
  highPriorityBugs: number;
  criticalBugs: number;
  recentBugs: number;
  statusDistribution: StatusDistribution[];
  priorityDistribution: PriorityDistribution[];
}

const COLORS = {
  open: '#3B82F6',
  'in-progress': '#F59E0B',
  resolved: '#10B981',
  closed: '#6B7280',
  critical: '#DC2626',
  high: '#EA580C',
  medium: '#D97706',
  low: '#16A34A',
};

export const Analytics: React.FC = () => {
  const { data: analytics, isLoading, error } = useQuery<AnalyticsData>({
    queryKey: ['bug-analytics'],
    queryFn: bugsApi.getBugAnalytics,
    retry: 1,
    staleTime: 1000 * 60 * 5, // Fresh for 5 minutes
  });

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          Failed to load analytics data. Please try again later.
          <br />
          <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
            {error instanceof Error ? error.message : 'Unknown error occurred'}
          </Typography>
        </Alert>
      </Box>
    );
  }

  if (!analytics) {
    return (
      <Box sx={{ textAlign: 'center', py: 6 }}>
        <Alert severity="error">Failed to load analytics data.</Alert>
      </Box>
    );
  }

  const statusData = analytics.statusDistribution.map((item: StatusDistribution) => ({
    ...item,
    fill: COLORS[item.status as keyof typeof COLORS] || COLORS.open,
  }));

  const priorityData = analytics.priorityDistribution.map((item: PriorityDistribution) => ({
    ...item,
    fill: COLORS[item.priority as keyof typeof COLORS] || COLORS.medium,
  }));

  return (
    <Box sx={{ p: 2 }}>
      {/* Summary Cards */}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 4 }}>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="h6" component="div">
                Total Bugs
              </Typography>
              <Chip label={analytics.totalBugs} color="default" />
            </Stack>
            <Typography variant="h4" sx={{ mt: 1 }}>
              {analytics.totalBugs}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              All reported bugs
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="h6" component="div">
                Open Bugs
              </Typography>
              <Chip 
                label={analytics.openBugs} 
                sx={{ backgroundColor: COLORS.open, color: 'white' }}
              />
            </Stack>
            <Typography variant="h4" sx={{ mt: 1 }}>
              {analytics.openBugs}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Need attention
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="h6" component="div">
                In Progress
              </Typography>
              <Chip 
                label={analytics.inProgressBugs}
                sx={{ backgroundColor: COLORS['in-progress'], color: 'black' }}
              />
            </Stack>
            <Typography variant="h4" sx={{ mt: 1 }}>
              {analytics.inProgressBugs}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Being worked on
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="h6" component="div">
                Resolved
              </Typography>
              <Chip 
                label={analytics.resolvedBugs}
                sx={{ backgroundColor: COLORS.resolved, color: 'white' }}
              />
            </Stack>
            <Typography variant="h4" sx={{ mt: 1 }}>
              {analytics.resolvedBugs}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Fixed bugs
            </Typography>
          </CardContent>
        </Card>
      </Stack>

      {/* Charts */}
      <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3}>
        {/* Status Distribution */}
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Bug Status Distribution
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Current status of all bugs in the system
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value, percent }: any) => 
                    `${name}: ${value} (${((percent as number) * 100).toFixed(0)}%)`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                  nameKey="status"
                >
                  {statusData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Priority Distribution */}
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Bug Priority Distribution
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Priority levels of all bugs
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={priorityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="priority" 
                  tickFormatter={(value) => value.charAt(0).toUpperCase() + value.slice(1)}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => `Priority: ${value.charAt(0).toUpperCase() + value.slice(1)}`}
                />
                <Bar dataKey="count" fill="#8884d8">
                  {priorityData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Stack>

      {/* Critical Issues Alert */}
      {analytics.criticalBugs > 0 && (
        <Box sx={{ mt: 3 }}>
          <Alert severity="error">
            <Typography variant="h6" component="div">
              ⚠️ Critical Issues Alert
            </Typography>
            <Typography variant="body2">
              There are {analytics.criticalBugs} critical bugs that need immediate attention.
            </Typography>
          </Alert>
        </Box>
      )}
    </Box>
  );
};