const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function request(path: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(options.headers as Record<string, string>) };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  auth: {
    login: (email: string, password: string) => request('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
    register: (name: string, email: string, password: string) => request('/api/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) }),
    me: () => request('/api/auth/me'),
    users: () => request('/api/auth/users'),
  },
  leads: {
    submitPublic: (data: { firstName: string; lastName: string; email: string; phone?: string; company?: string }) =>
      request('/api/leads/public', { method: 'POST', body: JSON.stringify(data) }),
    list: (params?: { page?: number; limit?: number; status?: string; search?: string }) => {
      const q = new URLSearchParams();
      if (params?.page) q.set('page', String(params.page));
      if (params?.limit) q.set('limit', String(params.limit));
      if (params?.status) q.set('status', params.status);
      if (params?.search) q.set('search', params.search);
      return request(`/api/leads?${q.toString()}`);
    },
    get: (id: string) => request(`/api/leads/${id}`),
    create: (data: { firstName: string; lastName: string; email: string; phone?: string; company?: string }) =>
      request('/api/leads', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request(`/api/leads/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    addNote: (id: string, text: string) => request(`/api/leads/${id}/notes`, { method: 'POST', body: JSON.stringify({ text }) }),
    delete: (id: string) => request(`/api/leads/${id}`, { method: 'DELETE' }),
  },
};