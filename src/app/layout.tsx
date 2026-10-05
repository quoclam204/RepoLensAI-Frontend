import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { RepoLensIcon } from "@/components/repolens-icon";

export const metadata: Metadata = {
  title: { default: "RepoLens AI", template: "%s | RepoLens AI" },
  description: "Evidence-grounded repository analysis frontend with full light and dark mode.",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("repolens_theme");if(!t){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}document.documentElement.setAttribute("data-theme",t);document.documentElement.classList.toggle("dark",t==="dark");}catch(e){}})();`,
          }}
        />
      </head>
      <body>
        <ThemeProvider>
          <header className="site-header">
            <div className="page-shell header-inner">
              <Link className="brand" href="/">
                <span className="brand-mark" aria-hidden="true">
                  <RepoLensIcon size={20} color="currentColor" />
                </span>
                <span>RepoLens <strong>AI</strong></span>
              </Link>
              <nav className="main-nav" aria-label="Main navigation">
                <Link href="/analyze">Analyze</Link>
                <Link href="/projects/demo-analysis/overview">Project workspace</Link>
                <Link href="/projects/demo-analysis/architecture">Architecture</Link>
              </nav>
              <div className="header-actions" style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "12px" }}>
                <ThemeToggle />
              </div>
            </div>
          </header>
          {children}
          <footer className="site-footer">
            <div className="page-shell footer-inner">
              <span>RepoLens AI frontend • Intelligent Software Architecture</span>
              <span>Light & Dark Mode Enabled</span>
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
