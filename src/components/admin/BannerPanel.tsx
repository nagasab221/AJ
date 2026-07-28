'use client';

import { useState } from 'react';
import { BilingualField, Field, SaveBar, TextInput, Toggle } from '@/components/admin/ui';
import { cx } from '@/lib/utils';
import { BANNER_STYLES, type BannerSettings, type BannerStyle } from '@/lib/types';

const STYLE_LABEL: Record<BannerStyle, string> = {
  palm: 'Green',
  terracotta: 'Orange',
  charcoal: 'Black'
};

const STYLE_SWATCH: Record<BannerStyle, string> = {
  palm: 'bg-palm text-linen',
  terracotta: 'bg-terracotta text-white',
  charcoal: 'bg-charcoal text-linen'
};

export default function BannerPanel({
  banner,
  onChanged
}: {
  banner: BannerSettings;
  onChanged: () => void;
}) {
  const [draft, setDraft] = useState<BannerSettings>(banner);
  const [showAgain, setShowAgain] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ kind: 'idle' | 'saved' | 'error'; message?: string }>({
    kind: 'idle'
  });

  async function save() {
    setSaving(true);
    setStatus({ kind: 'idle' });

    try {
      const res = await fetch('/api/admin/banner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...draft, bumpVersion: showAgain })
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; banner?: BannerSettings };

      if (!data.ok) {
        setStatus({ kind: 'error', message: data.error ?? 'Could not save the banner.' });
        return;
      }

      if (data.banner) setDraft(data.banner);
      setShowAgain(false);
      setStatus({ kind: 'saved' });
      onChanged();
    } catch {
      setStatus({ kind: 'error', message: 'Could not save the banner.' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h1 className="a-h1">Top banner</h1>
      <p className="mt-3 max-w-2xl text-[1.1rem] text-charcoal-soft">
        A coloured strip across the very top of your website. Use it for offers, discount codes or
        holiday hours. When it is switched off, visitors see nothing at all — no empty space.
      </p>

      {/* Live preview */}
      <div className="mt-8">
        <span className="a-label">What visitors will see</span>
        {draft.enabled ? (
          <div className={cx('rounded-xl px-5 py-3.5 text-center', STYLE_SWATCH[draft.style])}>
            <span className="text-[1.05rem] font-medium">
              {draft.text.en || 'Your message goes here'}
            </span>
            {draft.link && draft.linkLabel.en ? (
              <span className="ms-2 font-bold underline underline-offset-4">
                {draft.linkLabel.en}
              </span>
            ) : null}
          </div>
        ) : (
          <div className="rounded-xl border-2 border-dashed border-dune-dark bg-white px-5 py-3.5 text-center text-[1.05rem] text-stone">
            Nothing — the banner is switched off
          </div>
        )}
      </div>

      <section className="a-card mt-8 space-y-8">
        <Toggle
          label="Show the banner on the website"
          hint="Turn this on when you have something to announce, and off when you do not."
          checked={draft.enabled}
          onChange={(enabled) => setDraft({ ...draft, enabled })}
          onLabel="Showing"
          offLabel="Hidden"
        />

        <div className="border-t-2 border-dune pt-8">
          <BilingualField
            id="banner-text"
            label="The message"
            hint="Keep it short — one line reads best on a phone."
            value={draft.text}
            onChange={(text) => setDraft({ ...draft, text })}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Field
            label="Where the banner takes people (optional)"
            hint="Type #booking to send them to the booking form, or paste a full web address."
            htmlFor="banner-link"
          >
            <TextInput
              id="banner-link"
              value={draft.link}
              onChange={(link) => setDraft({ ...draft, link })}
              placeholder="#booking"
              dir="ltr"
            />
          </Field>

          <div>
            <BilingualField
              id="banner-link-label"
              label="Wording of the link"
              value={draft.linkLabel}
              onChange={(linkLabel) => setDraft({ ...draft, linkLabel })}
            />
          </div>
        </div>

        <Field label="Colour">
          <div className="flex flex-wrap gap-3">
            {BANNER_STYLES.map((style) => (
              <button
                key={style}
                type="button"
                onClick={() => setDraft({ ...draft, style })}
                aria-pressed={draft.style === style}
                className={cx(
                  'flex items-center gap-3 rounded-xl border-2 px-5 text-[1.05rem] font-bold transition-all',
                  draft.style === style
                    ? 'border-charcoal'
                    : 'border-charcoal/20 hover:border-charcoal/50'
                )}
                style={{ minHeight: '3.25rem' }}
              >
                <span className={cx('h-7 w-7 rounded-full', STYLE_SWATCH[style])} />
                {STYLE_LABEL[style]}
              </button>
            ))}
          </div>
        </Field>

        <div className="border-t-2 border-dune pt-8">
          <Toggle
            label="Show it again to people who closed it"
            hint="Visitors can close the banner. Turn this on when you change the message so everyone sees the new one."
            checked={showAgain}
            onChange={setShowAgain}
            onLabel="Yes"
            offLabel="No"
          />
        </div>
      </section>

      <SaveBar onSave={save} saving={saving} status={status} label="Save the banner" />
    </div>
  );
}
