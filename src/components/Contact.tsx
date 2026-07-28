'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import SectionHeading from '@/components/SectionHeading';
import {
  CheckIcon,
  InstagramIcon,
  MailIcon,
  PhoneIcon,
  TikTokIcon,
  WhatsAppIcon
} from '@/components/Icons';
import { cx, defaultWhatsappGreeting, whatsappLink } from '@/lib/utils';
import type { Locale, SiteSettings } from '@/lib/types';

export default function Contact({ site, locale }: { site: SiteSettings; locale: Locale }) {
  const t = useTranslations('contact');
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setState('sending');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.get('name'),
          email: data.get('email'),
          message: data.get('message'),
          locale,
          // Honeypot: real people never fill this in.
          company: data.get('company')
        })
      });
      if (!res.ok) throw new Error(String(res.status));
      form.reset();
      setState('sent');
    } catch {
      setState('error');
    }
  }

  const channels = [
    { href: `tel:${site.phone}`, label: t('call'), value: site.phone, Icon: PhoneIcon, external: false },
    {
      href: whatsappLink(site.whatsapp, defaultWhatsappGreeting(locale)),
      label: t('whatsapp'),
      value: site.whatsapp,
      Icon: WhatsAppIcon,
      external: true
    },
    { href: `mailto:${site.email}`, label: t('email'), value: site.email, Icon: MailIcon, external: false }
  ].filter((c) => c.value);

  return (
    <section id="contact" className="linen-weave bg-linen py-24 md:py-32">
      <div className="mx-auto max-w-content px-4 sm:px-6">
        <SectionHeading num="07" eyebrow={t('eyebrow')} title={t('title')} subtitle={t('subtitle')} />

        <div className="mt-14 grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-14">
          {/* Direct channels */}
          <div className="lg:col-span-5">
            <ul className="space-y-3">
              {channels.map(({ href, label, value, Icon, external }) => (
                <li key={label}>
                  <a
                    href={href}
                    {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    className="group flex items-center gap-4 rounded-2xl border border-dune bg-paper p-5 transition-colors duration-300 hover:border-palm"
                  >
                    <span className="arch-sm flex h-11 w-10 items-center justify-center border border-dune-dark text-palm transition-colors group-hover:border-palm group-hover:bg-palm-mist">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[0.72rem] font-semibold uppercase tracking-wide2 text-stone">
                        {label}
                      </span>
                      <span dir="ltr" className="block truncate text-[1rem] text-charcoal">
                        {value}
                      </span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>

            {(site.instagram || site.tiktok) && (
              <div className="mt-8 flex items-center gap-3">
                {site.instagram ? (
                  <a
                    href={site.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t('instagram')}
                    className="arch-sm flex h-12 w-11 items-center justify-center border border-dune-dark text-charcoal transition-colors hover:border-palm hover:bg-palm-mist hover:text-palm"
                  >
                    <InstagramIcon className="h-5 w-5" />
                  </a>
                ) : null}
                {site.tiktok ? (
                  <a
                    href={site.tiktok}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t('tiktok')}
                    className="arch-sm flex h-12 w-11 items-center justify-center border border-dune-dark text-charcoal transition-colors hover:border-palm hover:bg-palm-mist hover:text-palm"
                  >
                    <TikTokIcon className="h-5 w-5" />
                  </a>
                ) : null}
              </div>
            )}
          </div>

          {/* Message form */}
          <div className="lg:col-span-7">
            {state === 'sent' ? (
              <div className="flex h-full min-h-[18rem] flex-col items-center justify-center rounded-2xl border border-palm/30 bg-palm-mist p-10 text-center">
                <span className="arch-sm flex h-14 w-12 items-center justify-center border border-palm text-palm">
                  <CheckIcon className="h-6 w-6" />
                </span>
                <p className="mt-5 max-w-sm text-[1.05rem] text-charcoal">{t('sent')}</p>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="card p-7 md:p-8">
                {/* Honeypot */}
                <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
                  <label htmlFor="company">Company</label>
                  <input id="company" name="company" type="text" tabIndex={-1} autoComplete="off" />
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label className="label" htmlFor="contact-name">
                      {t('formName')}
                    </label>
                    <input id="contact-name" name="name" required maxLength={80} className="field" />
                  </div>
                  <div>
                    <label className="label" htmlFor="contact-email">
                      {t('formEmail')}
                    </label>
                    <input
                      id="contact-email"
                      name="email"
                      type="email"
                      required
                      dir="ltr"
                      maxLength={120}
                      className="field"
                    />
                  </div>
                </div>

                <div className="mt-5">
                  <label className="label" htmlFor="contact-message">
                    {t('formMessage')}
                  </label>
                  <textarea
                    id="contact-message"
                    name="message"
                    required
                    rows={5}
                    maxLength={1000}
                    placeholder={t('formMessagePlaceholder')}
                    className="field resize-y"
                  />
                </div>

                {state === 'error' ? (
                  <p className="mt-4 text-[0.92rem] font-semibold text-terracotta-dark">{t('error')}</p>
                ) : null}

                <button
                  type="submit"
                  disabled={state === 'sending'}
                  className={cx('btn-palm mt-6 w-full sm:w-auto')}
                >
                  {state === 'sending' ? t('sending') : t('send')}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
