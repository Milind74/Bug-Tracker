import axios from 'axios';
import { BugFilters } from '../types';

const API_BASE_URL = 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false, // Set to false for CORS simplicity
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      localStorage.removeItem('authUser');
      // Redirect to login if needed
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: async (data: { email: string; password: string }) => {
    const response = await apiClient.post('/auth/login', data);
    const { user, token } = response.data.data;
    
    // Transform user data to match User interface
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.fullName || `${user.firstName} ${user.lastName}`,
        avatar: user.avatar,
        role: user.role,
      },
      token
    };
  },
  register: async (data: { name: string; email: string; password: string; role: 'developer' | 'tester' }) => {
    const response = await apiClient.post('/auth/register', {
      firstName: data.name.split(' ')[0],
      lastName: data.name.split(' ').slice(1).join(' ') || data.name.split(' ')[0],
      email: data.email,
      password: data.password,
      role: data.role,
    });
    return response.data;
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
};

// Users API  
export const usersApi = {
  getUsers: async () => {
    const response = await apiClient.get('/users');
    const users = response.data.data?.users || [];
    
    // Transform user data to match User interface
    return users.map((user: any) => ({
      id: user.id,
      email: user.email,
      name: user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown User',
      avatar: user.avatar,
      role: user.role,
    }));
  },
  getAll: async () => {
    return usersApi.getUsers();
  },
};

// Bugs API
export const bugsApi = {
  getBugs: async (filters?: BugFilters, page: number = 1, limit: number = 10) => {
    // Build query parameters from filters
    const params = new URLSearchParams();
    
    console.log('getBugs called with filters:', filters, 'page:', page, 'limit:', limit);
    
    // Add pagination parameters
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    
    if (filters?.search) {
      params.append('search', filters.search);
    }
    if (filters?.status) {
      params.append('status', filters.status);
    }
    if (filters?.priority) {
      params.append('priority', filters.priority);
    }
    if (filters?.assigneeId) {
      if (filters.assigneeId === 'unassigned') {
        // Don't send assignedTo parameter for unassigned, we'll handle this in backend
        params.append('unassigned', 'true');
      } else {
        params.append('assignedTo', filters.assigneeId);
      }
    }

    const queryString = params.toString();
    const url = `/bugs?${queryString}`;
    
    console.log('Making API call to:', url);
    
    const response = await apiClient.get(url);
    const bugs = response.data.data?.bugs || [];
    const pagination = response.data.data?.pagination || {};
    
    // Transform bug data to ensure all required fields exist
    const transformedBugs = bugs.map((bug: any) => ({
      ...bug,
      id: bug.id || bug._id || 'unknown',
      title: bug.title || 'Untitled',
      description: bug.description || '',
      status: bug.status || 'open',
      priority: bug.priority || 'medium',
      assignee: bug.assignedTo ? {
        ...bug.assignedTo,
        id: bug.assignedTo.id || bug.assignedTo._id,
        name: bug.assignedTo.fullName || `${bug.assignedTo.firstName || ''} ${bug.assignedTo.lastName || ''}`.trim() || 'Unknown User'
      } : null,
      reporter: bug.reporter ? {
        ...bug.reporter,
        id: bug.reporter.id || bug.reporter._id,
        name: bug.reporter.fullName || `${bug.reporter.firstName || ''} ${bug.reporter.lastName || ''}`.trim() || 'Unknown User'
      } : { id: 'unknown', name: 'Unknown User', email: '' },
      createdAt: bug.createdAt || new Date().toISOString(),
      updatedAt: bug.updatedAt || bug.createdAt || new Date().toISOString(),
    }));

    return { 
      data: transformedBugs, 
      pagination: {
        currentPage: pagination.currentPage || 1,
        totalPages: pagination.totalPages || 1,
        totalCount: pagination.totalCount || transformedBugs.length,
        hasNext: pagination.hasNext || false,
        hasPrev: pagination.hasPrev || false,
      },
    };
  },
  createBug: async (data: any) => {
    // Transform assigneeId to assignedTo for backend
    const transformedData = { ...data };
    if (transformedData.assigneeId) {
      transformedData.assignedTo = transformedData.assigneeId;
      delete transformedData.assigneeId;
    }
    
    const response = await apiClient.post('/bugs', transformedData);
    return response.data;
  },
  updateBug: async (id: string, data: any) => {
    // Transform assigneeId to assignedTo for backend
    const transformedData = { ...data };
    if (transformedData.assigneeId !== undefined) {
      transformedData.assignedTo = transformedData.assigneeId;
      delete transformedData.assigneeId;
    }
    
    const response = await apiClient.put(`/bugs/${id}`, transformedData);
    return response.data;
  },
  deleteBug: async (id: string) => {
    await apiClient.delete(`/bugs/${id}`);
  },
  exportBugs: async (filters: BugFilters) => {
    // Build query parameters for export
    const params = new URLSearchParams();
    
    if (filters?.search) params.append('search', filters.search);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.priority) params.append('priority', filters.priority);
    if (filters?.assigneeId) {
      if (filters.assigneeId === 'unassigned') {
        params.append('unassigned', 'true');
      } else {
        params.append('assignedTo', filters.assigneeId);
      }
    }

    const queryString = params.toString();
    const url = queryString ? `/bugs/export?${queryString}` : '/bugs/export';
    
    const response = await apiClient.get(url, {
      responseType: 'blob',
    });
    
    return new Blob([response.data], { type: 'text/csv' });
  },
  getBugAnalytics: async () => {
    const response = await apiClient.get('/bugs/analytics');
    return response.data.data || {};
  },
};

// Comments API
export const commentsApi = {
  getBugComments: async (bugId: string) => {
    const response = await apiClient.get(`/bugs/${bugId}/comments`);
    return { data: response.data.data?.comments || [] };
  },
  createComment: async (data: { content: string; bugId: string }) => {
    const response = await apiClient.post('/comments', data);
    return response.data;
  },
  updateComment: async (id: string, data: { content: string }) => {
    const response = await apiClient.put(`/comments/${id}`, data);
    return response.data;
  },
  deleteComment: async (id: string) => {
    await apiClient.delete(`/comments/${id}`);
  },
};