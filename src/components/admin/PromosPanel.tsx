'use client';

import { useState } from 'react';
import { ConfirmDialog, Field, TextInput, Toggle } from '@/components/admin/ui';
import { TagIcon, TrashIcon } from '@/components/Icons';
import { cx, formatAED, makePromoCode } from '@/lib/utils';
import { dubaiTodayISO } from '@/lib/booking';
import type { DiscountType, PromoCode } from '@/lib/types';

interface Draft {
  code: string;
  discountType: DiscountType;
  discountValue: string;
  expiresAt: string;
  maxUses: string;
  minAmount: string;
  active: boolean;
}

const EMPTY: Draft = {
  code: '',
  discountType: 'percent',
  discountValue: '',
  expiresAt: '',
  maxUses: '',
  minAmount: '',
  active: true
};

function statusOf(promo: PromoCode, today: string): { label: string; style: string } {
  if (!promo.active) return { label: 'Switched off', style: 'bg-charcoal/15 text-charcoal' };
  if (promo.expiresAt && promo.expiresAt < today) {
    return { label: 'Expired', style: 'bg-charcoal/15 text-charcoal' };
  }
  if (promo.maxUses !== null && promo.usesCount >= promo.maxUses) {
    return { label: 'All used up', style: 'bg-charcoal/15 text-charcoal' };
  }
  return { label: 'Working now', style: 'bg-palm text-white' };
}

export default function PromosPanel({
  promos,
  onChanged
}: {
  promos: PromoCode[];
  onChanged: () => void;
}) {
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState<PromoCode | null>(null);
  const today = dubaiTodayISO();

  async function create() {
    setCreating(true);
    setError('');

    try {
      const res = await fetch('/api/admin/promos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft)
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };

      if (!data.ok) {
        setError(data.error ?? 'The code could not be created.');
        return;
      }

      setDraft(EMPTY);
      onChanged();
    } catch {
      setError('The code could not be created. Please try again.');
    } finally {
      setCreating(false);
    }
  }

  async function setActive(promo: PromoCode, active: boolean) {
    await fetch('/api/admin/promos', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: promo.id, active })
    });
    onChanged();
  }

  async function remove(promo: PromoCode) {
    await fetch('/api/admin/promos', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: promo.id })
    });
    setDeleting(null);
    onChanged();
  }

  return (
    <div>
      <h1 className="a-h1">Discount codes</h1>
      <p className="mt-3 max-w-2xl text-[1.1rem] text-charcoal-soft">
        Give customers a code they can type when booking to get money off. You choose how much,
        how long it lasts, and how many people can use it.
      </p>

      {/* Create */}
      <section className="a-card mt-8">
        <h2 className="a-h2">Make a new code</h2>

        <div className="mt-6 space-y-6">
          <Field
            label="The code customers will type"
            hint="Use letters and numbers only, like SUMMER20. Or press the button to make a random one."
            htmlFor="promo-code-input"
          >
            <div className="flex flex-wrap gap-3">
              <TextInput
                id="promo-code-input"
                value={draft.code}
                onChange={(code) => setDraft({ ...draft, code: code.toUpperCase() })}
                placeholder="SUMMER20"
                dir="ltr"
                maxLength={32}
                style={{ flex: '1 1 16rem', textTransform: 'uppercase' }}
              />
              <button
                type="button"
                onClick={() => setDraft({ ...draft, code: makePromoCode(8) })}
                className="a-btn-secondary"
              >
                Make a random code
              </button>
            </div>
          </Field>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Field label="What kind of discount?">
              <div className="flex gap-3">
                {(
                  [
                    ['percent', 'Percentage off'],
                    ['fixed', 'Fixed amount off']
                  ] as Array<[DiscountType, string]>
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setDraft({ ...draft, discountType: key })}
                    aria-pressed={draft.discountType === key}
                    className={cx(
                      'flex-1 rounded-xl border-2 px-4 text-[1.05rem] font-bold transition-colors',
                      draft.discountType === key
                        ? 'border-palm bg-palm text-white'
                        : 'border-charcoal/25 bg-white text-charcoal hover:border-palm'
                    )}
                    style={{ minHeight: '3.25rem' }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </Field>

            <Field
              label={draft.discountType === 'percent' ? 'How many percent off?' : 'How many dirhams off?'}
              hint={
                draft.discountType === 'percent'
                  ? 'For example, 20 means the customer pays 20% less.'
                  : 'For example, 30 means AED 30 comes off the price.'
              }
              htmlFor="promo-value"
            >
              <TextInput
                id="promo-value"
                value={draft.discountValue}
                onChange={(discountValue) => setDraft({ ...draft, discountValue })}
                inputMode="decimal"
                dir="ltr"
                placeholder={draft.discountType === 'percent' ? '20' : '30'}
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Field
              label="Last day it works"
              hint="Leave empty if it should never expire."
              htmlFor="promo-expires"
            >
              <TextInput
                id="promo-expires"
                type="date"
                value={draft.expiresAt}
                onChange={(expiresAt) => setDraft({ ...draft, expiresAt })}
                dir="ltr"
              />
            </Field>

            <Field
              label="How many times can it be used?"
              hint="Leave empty for unlimited."
              htmlFor="promo-max"
            >
              <TextInput
                id="promo-max"
                value={draft.maxUses}
                onChange={(maxUses) => setDraft({ ...draft, maxUses })}
                inputMode="numeric"
                dir="ltr"
                placeholder="50"
              />
            </Field>

            <Field
              label="Smallest booking it works on"
              hint="Leave empty for any booking."
              htmlFor="promo-min"
            >
              <TextInput
                id="promo-min"
                value={draft.minAmount}
                onChange={(minAmount) => setDraft({ ...draft, minAmount })}
                inputMode="decimal"
                dir="ltr"
                placeholder="100"
              />
            </Field>
          </div>

          {error ? (
            <p className="rounded-xl bg-terracotta-mist px-5 py-4 text-[1.05rem] font-bold text-terracotta-dark">
              {error}
            </p>
          ) : null}

          <button type="button" onClick={create} disabled={creating} className="a-btn-primary">
            <TagIcon className="h-5 w-5" />
            {creating ? 'Creating…' : 'Create this code'}
          </button>
        </div>
      </section>

      {/* Existing */}
      <h2 className="a-h2 mt-12">Your codes</h2>

      {promos.length === 0 ? (
        <div className="a-card mt-6 text-center">
          <p className="text-[1.15rem] text-charcoal">
            You have not made any discount codes yet.
          </p>
        </div>
      ) : (
        <ul className="mt-6 space-y-5">
          {promos.map((promo) => {
            const status = statusOf(promo, today);
            const remaining = promo.maxUses === null ? null : Math.max(0, promo.maxUses - promo.usesCount);

            return (
              <li key={promo.id}>
                <article className="a-card">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p
                        dir="ltr"
                        className="font-display text-[2rem] leading-none tracking-wide2 text-charcoal"
                      >
                        {promo.code}
                      </p>
                      <p className="mt-2 text-[1.15rem] font-bold text-palm">
                        {promo.discountType === 'percent'
                          ? `${promo.discountValue}% off`
                          : `${formatAED(promo.discountValue)} off`}
                      </p>
                    </div>
                    <span className={cx('a-status', status.style)}>{status.label}</span>
                  </div>

                  <dl className="mt-6 grid grid-cols-1 gap-x-8 gap-y-4 border-t-2 border-dune pt-5 sm:grid-cols-3">
                    <div>
                      <dt className="text-[0.95rem] font-bold uppercase tracking-wide2 text-stone">
                        Used
                      </dt>
                      <dd className="mt-1 text-[1.15rem] text-charcoal">
                        {promo.usesCount} time{promo.usesCount === 1 ? '' : 's'}
                        {remaining !== null ? ` · ${remaining} left` : ' · unlimited'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[0.95rem] font-bold uppercase tracking-wide2 text-stone">
                        Expires
                      </dt>
                      <dd className="mt-1 text-[1.15rem] text-charcoal">
                        {promo.expiresAt ?? 'Never'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[0.95rem] font-bold uppercase tracking-wide2 text-stone">
                        Smallest booking
                      </dt>
                      <dd className="mt-1 text-[1.15rem] text-charcoal">
                        {promo.minAmount === null ? 'Any' : formatAED(promo.minAmount)}
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-6 flex flex-wrap items-center justify-between gap-5 border-t-2 border-dune pt-5">
                    <div className="min-w-[18rem] flex-1">
                      <Toggle
                        label={promo.active ? 'This code is switched on' : 'This code is switched off'}
                        checked={promo.active}
                        onChange={(active) => void setActive(promo, active)}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setDeleting(promo)}
                      className="a-btn-danger"
                    >
                      <TrashIcon className="h-5 w-5" />
                      Delete
                    </button>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmDialog
        open={deleting !== null}
        title={`Delete the code ${deleting?.code ?? ''}?`}
        body="Anyone trying to use it will be told it does not exist. Bookings that already used it are not affected."
        confirmLabel="Yes, delete it"
        onCancel={() => setDeleting(null)}
        onConfirm={() => deleting && void remove(deleting)}
      />
    </div>
  );
}
