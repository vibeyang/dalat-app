import { Link } from '@/lib/i18n/routing';
import { cn } from '@/lib/utils';
import { CONTENT_LOCALES, LOCALE_FLAGS, type ContentLocale } from '@/lib/types';

interface FooterLanguageLinksProps {
  currentLocale: string;
  currentPath: string;
}

/**
 * SEO-optimized language selector with pure HTML links.
 * All 12 flags are visible and crawlable by bots.
 * Current locale is subtly highlighted.
 */
export function FooterLanguageLinks({
  currentLocale,
  currentPath,
}: FooterLanguageLinksProps) {
  return (
    <nav
      aria-label="Language selection"
      className="grid grid-cols-6 md:grid-cols-12 gap-1.5 md:gap-2 max-w-[280px] md:max-w-lg mx-auto"
    >
      {CONTENT_LOCALES.map((locale) => (
        <Link
          key={locale}
          href={currentPath}
          locale={locale}
          className={cn(
            'text-2xl p-2 rounded-lg transition-all duration-200 flex items-center justify-center',
            locale === currentLocale
              ? 'opacity-100 ring-2 ring-primary/40 bg-primary/10 scale-105'
              : 'opacity-60 hover:opacity-100 hover:bg-muted/50 active:scale-95 active:opacity-100'
          )}
          aria-current={locale === currentLocale ? 'page' : undefined}
          title={getLocaleLabel(locale)}
        >
          {LOCALE_FLAGS[locale]}
        </Link>
      ))}
    </nav>
  );
}

function getLocaleLabel(locale: ContentLocale): string {
  const labels: Record<ContentLocale, string> = {
    en: 'English',
    vi: 'Tiếng Việt',
    ko: '한국어',
    zh: '中文',
    ru: 'Русский',
    fr: 'Français',
    ja: '日本語',
    ms: 'Bahasa Melayu',
    th: 'ไทย',
    de: 'Deutsch',
    es: 'Español',
    id: 'Indonesia',
  };
  return labels[locale];
}
