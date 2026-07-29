'use client';

import { useEffect, useRef } from 'react';
import { AlertIcon, CheckIcon, CloseIcon } from '@/components/Icons';
import { cx } from '@/lib/utils';
import type { L } from '@/lib/types';

/**
 * Shared admin controls.
 *
 * The whole panel is tuned for someone who is not comfortable with software:
 * 18px base type, 52px tap targets, real labels on everything, and a plain
 * sentence of help under any field whose purpose isn't obvious.
 */

export function Field({
  label,
  hint,
  htmlFor,
  children
}: {
  label: string;
  hint?: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="a-label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {hint ? <p className="a-hint">{hint}</p> : null}
    </div>
  );
}

export function TextInput({
  value,
  onChange,
  ...rest
}: {
  value: string;
  onChange: (value: string) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>) {
  return (
    <input {...rest} className="a-input" value={value} onChange={(e) => onChange(e.target.value)} />
  );
}

export function TextArea({
  value,
  onChange,
  rows = 4,
  ...rest
}: {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
} & Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'value' | 'onChange' | 'rows'>) {
  return (
    <textarea
      {...rest}
      rows={rows}
      className="a-input"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

/** English + Arabic side by side, so nothing gets translated by accident. */
export function BilingualField({
  label,
  hint,
  value,
  onChange,
  multiline = false,
  id
}: {
  label: string;
  hint?: string;
  value: L;
  onChange: (value: L) => void;
  multiline?: boolean;
  id: string;
}) {
  const Input = multiline ? TextArea : TextInput;

  return (
    <div>
      <span className="a-label">{label}</span>
      {hint ? <p className="mb-3 text-[0.95rem] text-stone">{hint}</p> : null}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div>
          <label
            className="mb-1.5 block text-[0.9rem] font-bold uppercase tracking-wide2 text-stone"
            htmlFor={`${id}-en`}
          >
            English
          </label>
          <Input
            id={`${id}-en`}
            value={value?.en ?? ''}
            onChange={(next: string) => onChange({ ...value, en: next })}
          />
        </div>
        <div>
          <label
            className="mb-1.5 block text-[0.9rem] font-bold uppercase tracking-wide2 text-stone"
            htmlFor={`${id}-ar`}
          >
            Arabic, العربية
          </label>
          <Input
            id={`${id}-ar`}
            dir="rtl"
            value={value?.ar ?? ''}
            onChange={(next: string) => onChange({ ...value, ar: next })}
          />
        </div>
      </div>
    </div>
  );
}

/** A switch that says what it is, in words, not just a coloured pill. */
export function Toggle({
  label,
  hint,
  checked,
  onChange,
  onLabel = 'On',
  offLabel = 'Off'
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  onLabel?: string;
  offLabel?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-6">
      <div className="min-w-0 flex-1">
        <p className="text-[1.05rem] font-bold text-charcoal">{label}</p>
        {hint ? <p className="a-hint">{hint}</p> : null}
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cx(
          'flex shrink-0 items-center gap-3 rounded-full border-2 px-4 py-2.5 text-[1rem] font-bold transition-colors',
          checked
            ? 'border-palm bg-palm text-white'
            : 'border-charcoal/30 bg-white text-charcoal'
        )}
        style={{ minHeight: '3.25rem', minWidth: '7.5rem' }}
      >
        <span
          className={cx(
            'flex h-6 w-6 items-center justify-center rounded-full',
            checked ? 'bg-white text-palm' : 'bg-dune text-charcoal'
          )}
        >
          {checked ? <CheckIcon className="h-4 w-4" /> : <CloseIcon className="h-3.5 w-3.5" />}
        </span>
        {checked ? onLabel : offLabel}
      </button>
    </div>
  );
}

/**
 * Every destructive action goes through this. It names the thing being removed
 * and puts the safe choice first.
 */
export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  cancelLabel = 'No, keep it',
  onConfirm,
  onCancel
}: {
  open: boolean;
  title: string;
  body?: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const cancelRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-charcoal/50" onClick={onCancel} />
      <div className="relative w-full max-w-lg rounded-2xl border-2 border-dune-dark bg-white p-7 shadow-lift">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-terracotta-mist text-terracotta-dark">
            <AlertIcon className="h-6 w-6" />
          </span>
          <div className="min-w-0">
            <h2 className="text-[1.4rem] font-bold leading-snug text-charcoal">{title}</h2>
            {body ? <p className="mt-2 text-[1.05rem] text-charcoal-soft">{body}</p> : null}
          </div>
        </div>

        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button ref={cancelRef} type="button" onClick={onCancel} className="a-btn-secondary">
            {cancelLabel}
          </button>
          <button type="button" onClick={onConfirm} className="a-btn-danger">
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Sticky save bar so the button is always reachable on a long page. */
export function SaveBar({
  onSave,
  saving,
  status,
  label = 'Save changes'
}: {
  onSave: () => void;
  saving: boolean;
  status: { kind: 'idle' | 'saved' | 'error'; message?: string };
  label?: string;
}) {
  return (
    <div className="sticky bottom-0 z-20 -mx-4 mt-10 border-t-2 border-dune-dark bg-linen/95 px-4 py-4 backdrop-blur sm:-mx-6 sm:px-6">
      <div className="flex flex-wrap items-center gap-4">
        <button type="button" onClick={onSave} disabled={saving} className="a-btn-primary">
          {saving ? 'Saving…' : label}
        </button>

        {status.kind === 'saved' ? (
          <p className="flex items-center gap-2 text-[1.05rem] font-bold text-palm">
            <CheckIcon className="h-5 w-5" />
            Saved. Your website is updated.
          </p>
        ) : null}

        {status.kind === 'error' ? (
          <p className="flex items-center gap-2 text-[1.05rem] font-bold text-terracotta-dark">
            <AlertIcon className="h-5 w-5" />
            {status.message ?? 'Could not save.'}
          </p>
        ) : null}
      </div>
    </div>
  );
}

/** Picture chooser: upload a file or paste a link, with a live preview. */
export function ImagePicker({
  value,
  onChange,
  label = 'Picture'
}: {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  async function upload(file: File) {
    const form = new FormData();
    form.append('file', file);
    const res = await fetch('/api/admin/upload', { method: 'POST', body: form });
    const data = (await res.json()) as { ok?: boolean; url?: string; error?: string };
    if (data.ok && data.url) onChange(data.url);
    else alert(data.error ?? 'The picture could not be uploaded.');
  }

  return (
    <div>
      <span className="a-label">{label}</span>
      <div className="flex flex-wrap items-center gap-4">
        <div className="arch-sm h-28 w-24 overflow-hidden border-2 border-dune-dark bg-linen">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-[0.9rem] text-stone">
              None
            </span>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="a-btn-secondary"
          >
            Choose a photo
          </button>
          {value ? (
            <button type="button" onClick={() => onChange('')} className="a-btn-secondary">
              Remove photo
            </button>
          ) : null}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void upload(file);
            e.target.value = '';
          }}
        />
      </div>
    </div>
  );
}
