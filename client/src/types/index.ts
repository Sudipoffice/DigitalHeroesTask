export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'member';
}

export interface Lead {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  status: LeadStatus;
  assignedTo?: { _id: string; name: string; email: string };
  notes: Note[];
  activity: Activity[];
  source: 'public' | 'manual';
  createdAt: string;
  updatedAt: string;
}

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'proposal' | 'closed_won' | 'closed_lost';

export interface Note {
  _id?: string;
  text: string;
  author: { _id: string; name: string; email: string };
  createdAt: string;
}

export interface Activity {
  _id?: string;
  action: string;
  performedBy: { _id: string; name: string; email: string };
  details: string;
  createdAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}