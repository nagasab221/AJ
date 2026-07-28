'use client';

import { useState } from 'react';
import { Wordmark } from '@/components/Monogram';
import { AlertIcon } from '@/components/Icons';

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;

    setBusy(true);
    setError('');

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      if (res.ok) {
        window.location.reload();
        return;
      }

      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(
        data?.error === 'not_configured'
          ? 'The website is missing its admin password setting. Please contact your developer.'
          : 'That password is not right. Please try again.'
      );
    } catch {
      setError('Could not sign in. Please check your internet connection.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="flex justify-center">
          <Wordmark subtitle="Owner area" />
        </div>

        <form onSubmit={submit} className="a-card mt-10">
          <h1 className="text-[1.8rem] font-bold text-charcoal">Sign in</h1>
          <p className="mt-2 text-[1.05rem] text-charcoal-soft">
            Enter your password to manage your website.
          </p>

          <div className="mt-7">
            <label className="a-label" htmlFor="admin-password">
              Password
            </label>
            <input
              id="admin-password"
              type="password"
              className="a-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              autoFocus
            />
          </div>

          {error ? (
            <p className="mt-5 flex items-start gap-3 rounded-xl bg-terracotta-mist px-5 py-4 text-[1.05rem] font-bold text-terracotta-dark">
              <AlertIcon className="mt-0.5 h-5 w-5 shrink-0" />
              {error}
            </p>
          ) : null}

          <button type="submit" disabled={busy} className="a-btn-primary mt-7 w-full">
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
