import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageProvider } from "@/i18n/language-context";
import { LanguageToggle } from "@/components/language-toggle";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { RepoLensIcon } from "@/components/repolens-icon";

export const metadata: Metadata = {
  title: { default: "RepoLens AI", template: "%s | RepoLens AI" },
  description: "Evidence-grounded repository analysis frontend with full light and dark mode, bilingual VI / EN.",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ThemeProvider>
          <LanguageProvider>
            <header className="site-header">
              <div className="page-shell header-inner">
                <Link className="brand" href="/">
                  <span className="brand-mark" aria-hidden="true">
                    <RepoLensIcon size={22} variant="gradient" />
                  </span>
                  <span>RepoLens <strong>AI</strong></span>
                </Link>
                <SiteNav />
                <div className="header-actions" style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "10px" }}>
                  <LanguageToggle />
                  <ThemeToggle />
                </div>
              </div>
            </header>
            {children}
            <SiteFooter />
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
