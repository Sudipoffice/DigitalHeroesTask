'use client';

import { useState, useEffect, FormEvent } from 'react';
import { api } from '@/lib/api';

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800',
  contacted: 'bg-yellow-100 text-yellow-800',
  qualified: 'bg-purple-100 text-purple-800',
  proposal: 'bg-indigo-100 text-indigo-800',
  closed_won: 'bg-green-100 text-green-800',
  closed_lost: 'bg-red-100 text-red-800',
};

export default function HomePage() {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', company: '' });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (stored && token) setUser(JSON.parse(stored));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await api.leads.submitPublic(form);
      setSubmitted(true);
      setForm({ firstName: '', lastName: '', email: '', phone: '', company: '' });
    } catch (err: any) {
      setError(err.message || 'Submission failed');
    }
  };

  return (
    <div>
      {/* Navbar */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="text-xl font-bold text-gray-900">DigitalHeroes</span>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <div className="relative">
                <button onClick={() => setShowUserMenu(!showUserMenu)} className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-all">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-md">
                    <span className="text-sm font-bold text-white">{user.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-slate-900 leading-tight">{user.name}</p>
                    <p className="text-[11px] text-slate-400 font-mono uppercase tracking-wider">{user.role}</p>
                  </div>
                </button>
                {showUserMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
                    <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white border border-slate-200 shadow-xl py-1.5 z-20">
                      <div className="px-4 py-2.5 border-b border-slate-100">
                        <p className="text-sm font-medium text-slate-900">{user.email}</p>
                      </div>
                      <a href="/dashboard" className="block w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        Dashboard
                      </a>
                      <button onClick={handleLogout} className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <>
                <a href="/login" className="text-gray-600 hover:text-gray-900 font-medium transition">Sign In</a>
                <a href="/register" className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 font-medium transition shadow-sm">
                  Get Started
                </a>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Close More Deals.<br />
              <span className="text-blue-200">Manage Leads Smarter.</span>
            </h1>
            <p className="text-lg md:text-xl text-blue-100 mb-8 max-w-2xl">
              The lead management platform built for small sales teams. Capture, track, and convert leads — all in one place.
            </p>
            <div className="flex flex-wrap gap-4">
              <a href="/register" className="bg-white text-blue-700 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition shadow-lg">
                Start Free Trial
              </a>
              <a href="#capture-form" className="border-2 border-white/30 text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/10 transition">
                Submit a Lead
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Everything Your Sales Team Needs</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Lead Capture</h3>
              <p className="text-gray-500 text-sm">Public form for instant lead capture. No login required for prospects.</p>
            </div>
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Pipeline Management</h3>
              <p className="text-gray-500 text-sm">Track leads through your sales pipeline with custom statuses and assignment.</p>
            </div>
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Activity Tracking</h3>
              <p className="text-gray-500 text-sm">Full activity trail with notes and timestamps. Know every interaction.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Public Lead Capture Form */}
      <section id="capture-form" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-lg mx-auto">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-2">Get in Touch</h2>
            <p className="text-gray-500 text-center mb-8">Fill out the form below and we&apos;ll reach out to you shortly.</p>

            {submitted ? (
              <div className="bg-white p-8 rounded-xl shadow-sm border text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Thank You!</h3>
                <p className="text-gray-500 mb-6">Your information has been submitted successfully. We will be in touch soon.</p>
                <button onClick={() => setSubmitted(false)} className="text-blue-600 hover:underline font-medium">
                  Submit another lead
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-sm border space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">First Name *</label>
                    <input
                      type="text"
                      required
                      value={form.firstName}
                      onChange={e => setForm({ ...form, firstName: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Last Name *</label>
                    <input
                      type="text"
                      required
                      value={form.lastName}
                      onChange={e => setForm({ ...form, lastName: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      placeholder="Doe"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email *</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    placeholder="john@company.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Company</label>
                  <input
                    type="text"
                    value={form.company}
                    onChange={e => setForm({ ...form, company: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    placeholder="ACME Inc."
                  />
                </div>
                {error && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{error}</p>}
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 font-medium transition shadow-sm"
                >
                  Submit
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Manage Your Leads?</h2>
          <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
            Join thousands of sales teams using DigitalHeroes to close more deals.
          </p>
          <a href="/register" className="inline-block bg-white text-blue-700 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition shadow-lg">
            Create Your Free Account
          </a>
        </div>
      </section>
    </div>
  );
}