"use client";

import { usePathname } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { FooterLanguageLinks } from "./footer-language-links";

/**
 * Global footer with language selector.
 * Uses client-side pathname detection to work from the layout.
 * Renders 12 flag links for SEO crawlability.
 */
export function GlobalFooter() {
  const t = useTranslations("home");
  const locale = useLocale();
  const pathname = usePathname();

  // Remove locale prefix from pathname for the language links
  // e.g., /en/events/cooking-class -> /events/cooking-class
  const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}(\/|$)/, "/") || "/";

  return (
    <footer className="border-t py-8 mt-auto">
      <div className="container max-w-4xl mx-auto px-4 space-y-6">
        {/* Hero text - "Made with love" prominent */}
        <p className="text-center text-base md:text-lg text-muted-foreground">
          {t("footer")}
        </p>

        {/* Language selector - 6+6 grid on mobile, single row on desktop */}
        <FooterLanguageLinks
          currentLocale={locale}
          currentPath={pathWithoutLocale}
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
