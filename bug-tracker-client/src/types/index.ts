export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'admin' | 'developer' | 'tester';
}

export interface Bug {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  assigneeId?: string;
  assignee?: User;
  reporterId: string;
  reporter: User;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
}

export interface Comment {
  id: string;
  content: string;
  bugId: string;
  authorId: string;
  author: User;
  createdAt: string;
  updatedAt: string;
}

export interface AuthUser {
  user: User;
  token: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
  role: 'developer' | 'tester';
}

export interface CreateBugData {
  title: string;
  description: string;
  priority: Bug['priority'];
  assigneeId?: string;
  tags?: string[];
}

export interface UpdateBugData {
  title?: string;
  description?: string;
  priority?: Bug['priority'];
  status?: Bug['status'];
  assigneeId?: string;
  tags?: string[];
}

export interface BugFilters {
  status?: Bug['status'];
  priority?: Bug['priority'];
  assigneeId?: string;
  search?: string;
}

export interface BugAnalytics {
  totalBugs: number;
  openBugs: number;
  inProgressBugs: number;
  resolvedBugs: number;
  closedBugs: number;
  criticalBugs: number;
  highPriorityBugs: number;
  statusDistribution: { status: string; count: number }[];
  priorityDistribution: { priority: string; count: number }[];
}