import { getTranslations } from 'next-intl/server';
import { FooterLanguageLinks } from './footer-language-links';

interface SiteFooterProps {
  locale: string;
  pathname: string;
}

/**
 * Site footer with copyright and language selector.
 * Language selector shows all 12 flags as pure HTML links (SEO-optimized).
 */
export async function SiteFooter({ locale, pathname }: SiteFooterProps) {
  const t = await getTranslations('home');

  // Remove locale prefix from pathname for the language links
  // e.g., /en/events/cooking-class -> /events/cooking-class
  const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}(\/|$)/, '/');

  return (
    <footer className="border-t py-8">
      <div className="container max-w-4xl mx-auto px-4 space-y-6">
        {/* Hero text - "Made with love" prominent */}
        <p className="text-center text-base md:text-lg text-muted-foreground">
          {t('footer')}
        </p>

        {/* Language selector - 6+6 grid on mobile, single row on desktop */}
        <FooterLanguageLinks
          currentLocale={locale}
          currentPath={pathWithoutLocale || '/'}
        />

        {/* Attribution - subtle, own line */}
        <p className="text-center">
          <a
            href="https://goldenfocus.io"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
          >
            goldenfocus.io
          </a>
        </p>
      </div>
    </footer>
  );
}
