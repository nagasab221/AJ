import { t as pick, type Locale, type Service } from '@/lib/types';
import { formatAED } from '@/lib/utils';

/**
 * A slim marquee of services and prices directly under the hero. It gives the
 * page a second horizontal rhythm and puts prices in view before anyone has
 * scrolled. Duplicated once so the -50% loop is seamless.
 */
export default function Ticker({ services, locale }: { services: Service[]; locale: Locale }) {
  const items = services.slice(0, 8);
  if (!items.length) return null;

  const row = (keyPrefix: string) =>
    items.map((service) => (
      <span key={`${keyPrefix}-${service.id}`} className="flex items-center gap-4 whitespace-nowrap px-7">
        <span className="font-display text-lg text-linen">{pick(service.name, locale)}</span>
        <span className="text-[0.8rem] font-semibold text-dune">
          {service.startingFrom ? `${locale === 'ar' ? 'من' : 'from'} ` : ''}
          {formatAED(service.price, locale)}
        </span>
        <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-terracotta" />
      </span>
    ));

  return (
    <div className="overflow-hidden border-y border-palm-dark bg-palm py-3.5" aria-hidden>
      <div className="ticker-track">
        {row('a')}
        {row('b')}
      </div>
    </div>
  );
}
