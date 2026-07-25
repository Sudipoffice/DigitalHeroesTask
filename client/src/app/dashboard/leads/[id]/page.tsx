'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import type { Lead, User } from '@/types';

const STATUS_OPTIONS = ['new', 'contacted', 'qualified', 'proposal', 'closed_won', 'closed_lost'] as const;

const STATUS_META: Record<string, { label: string; badge: string; dot: string }> = {
  new: { label: 'New', badge: 'bg-blue-50 text-blue-700 ring-blue-200', dot: 'bg-blue-500' },
  contacted: { label: 'Contacted', badge: 'bg-amber-50 text-amber-700 ring-amber-200', dot: 'bg-amber-500' },
  qualified: { label: 'Qualified', badge: 'bg-purple-50 text-purple-700 ring-purple-200', dot: 'bg-purple-500' },
  proposal: { label: 'Proposal', badge: 'bg-indigo-50 text-indigo-700 ring-indigo-200', dot: 'bg-indigo-500' },
  closed_won: { label: 'Closed Won', badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200', dot: 'bg-emerald-500' },
  closed_lost: { label: 'Closed Lost', badge: 'bg-red-50 text-red-700 ring-red-200', dot: 'bg-red-500' },
};

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [lead, setLead] = useState<Lead | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [noteText, setNoteText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (!stored || !token) { router.push('/login'); return; }
    setUser(JSON.parse(stored));
  }, [router]);

  useEffect(() => {
    if (!user || !params.id) return;
    fetchLead();
    if (user.role === 'admin') { api.auth.users().then(res => setUsers(res.users)).catch(() => {}); }
  }, [user, params.id]);

  const fetchLead = async () => {
    setLoading(true);
    setError('');
    try { const res = await api.leads.get(params.id as string); setLead(res.lead); }
    catch (err: any) { setError(err.message || 'Failed to load lead'); }
    finally { setLoading(false); }
  };

  const handleStatusChange = async (status: string) => {
    try { const res = await api.leads.update(params.id as string, { status }); setLead(res.lead); }
    catch (err: any) { alert(err.message); }
  };

  const handleAssign = async (assignedTo: string) => {
    try { const res = await api.leads.update(params.id as string, { assignedTo }); setLead(res.lead); }
    catch (err: any) { alert(err.message); }
  };

  const handleAddNote = async (e: FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    try { const res = await api.leads.addNote(params.id as string, noteText); setLead(res.lead); setNoteText(''); }
    catch (err: any) { alert(err.message); }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl border-2 border-blue-200 border-t-blue-600 animate-spin" />
          <p className="text-sm text-slate-500 font-mono">Loading lead...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Failed to Load Lead</h2>
          <p className="text-slate-500 mb-6">{error}. Make sure the server is running.</p>
          <button onClick={() => router.push('/dashboard')} className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium hover:from-blue-500 hover:to-indigo-500 transition-all shadow-md">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!lead || !user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="fixed inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM0YzZmZjUiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />

      <nav className="relative z-40 bg-white/80 backdrop-blur-xl border-b border-blue-100/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 gap-6">
            <a href="/" className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors font-medium group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="font-semibold group-hover:text-blue-600 transition-colors">DigitalHeroes</span>
            </a>
            <span className="text-slate-300">/</span>
            <button onClick={() => router.push('/dashboard')} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Leads
            </button>
            <span className="text-slate-300">/</span>
            <span className="text-sm text-slate-400 truncate">{lead?.firstName} {lead?.lastName}</span>
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-8 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-blue-500/20">
                {lead.firstName.charAt(0)}{lead.lastName.charAt(0)}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{lead.firstName} {lead.lastName}</h1>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                  <span className="text-sm text-slate-500">{lead.email}</span>
                  {lead.phone && <><span className="text-slate-300">|</span><span className="text-sm text-slate-500">{lead.phone}</span></>}
                  {lead.company && <><span className="text-slate-300">|</span><span className="text-sm text-slate-500">{lead.company}</span></>}
                </div>
              </div>
            </div>
            <span className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold ring-1 shadow-sm ${STATUS_META[lead.status].badge}`}>
              <span className={`w-2 h-2 rounded-full ${STATUS_META[lead.status].dot}`} />
              {STATUS_META[lead.status].label}
            </span>
          </div>

          <div className="flex flex-wrap gap-3 text-sm">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Source</span>
              <span className="text-slate-700 font-medium capitalize">{lead.source}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Created</span>
              <span className="text-slate-700">{new Date(lead.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            </div>
            {lead.assignedTo && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Assigned</span>
                <span className="text-slate-700">{lead.assignedTo.name}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 pt-8 border-t border-slate-100">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Status</label>
              <select
                value={lead.status}
                onChange={e => handleStatusChange(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all appearance-none cursor-pointer"
              >
                {STATUS_OPTIONS.map(s => (
                  <option key={s} value={s}>{s.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
            {user.role === 'admin' && (
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Assign To</label>
                <select
                  value={lead.assignedTo?._id || ''}
                  onChange={e => handleAssign(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all appearance-none cursor-pointer"
                >
                  <option value="">Unassigned</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-900">Notes</h2>
              <span className="px-2.5 py-1 rounded-md bg-slate-100 text-xs text-slate-500 font-semibold">{lead.notes.length}</span>
            </div>
            <form onSubmit={handleAddNote} className="mb-6">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type a note..."
                  value={noteText}
                  onChange={e => setNoteText(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                />
                <button type="submit" className="px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium hover:from-blue-500 hover:to-indigo-500 transition-all shadow-md shadow-blue-500/20">Add</button>
              </div>
            </form>
            {lead.notes.length === 0 ? (
              <div className="text-center py-10">
                <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <p className="text-slate-400 text-sm">No notes yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {lead.notes.map((note, i) => (
                  <div key={i} className="group rounded-xl bg-slate-50 border border-slate-100 p-4 hover:border-blue-100 hover:bg-blue-50/30 transition-all">
                    <p className="text-sm text-slate-700 leading-relaxed">{note.text}</p>
                    <div className="flex items-center gap-2 mt-3 text-xs text-slate-400">
                      <span className="font-medium text-slate-500">{note.author?.name}</span>
                      <span>·</span>
                      <span>{new Date(note.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-900">Activity Timeline</h2>
              <span className="px-2.5 py-1 rounded-md bg-slate-100 text-xs text-slate-500 font-semibold">{lead.activity.length}</span>
            </div>
            {lead.activity.length === 0 ? (
              <div className="text-center py-10">
                <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-slate-400 text-sm">No activity yet</p>
              </div>
            ) : (
              <div className="relative">
                <div className="absolute left-[15px] top-3 bottom-3 w-0.5 bg-gradient-to-b from-blue-200 via-indigo-200 to-transparent" />
                <div className="space-y-6">
                  {lead.activity.map((act, i) => (
                    <div key={i} className="relative flex gap-4 animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
                      <div className="relative z-10 flex-shrink-0 w-8 h-8 rounded-full bg-white border-2 border-blue-200 flex items-center justify-center shadow-sm">
                        <div className={`w-3 h-3 rounded-full ${act.action === 'created' ? 'bg-blue-500' : act.action === 'status_change' ? 'bg-amber-500' : act.action === 'assigned' ? 'bg-purple-500' : 'bg-indigo-500'}`} />
                      </div>
                      <div className="flex-1 min-w-0 pt-0.5">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-slate-900 capitalize">{act.action.replace(/_/g, ' ')}</span>
                          <span className="text-xs text-slate-400">{new Date(act.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-sm text-slate-500">{act.details}</p>
                        <p className="text-xs text-slate-400 mt-0.5">by {act.performedBy?.name || 'Unknown'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}