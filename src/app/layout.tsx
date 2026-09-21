import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "RepoLens AI", template: "%s | RepoLens AI" },
  description: "Evidence-grounded repository analysis frontend.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <div className="page-shell header-inner">
            <Link className="brand" href="/">
              <span className="brand-mark" aria-hidden="true">RL</span>
              <span>RepoLens <strong>AI</strong></span>
            </Link>
            <nav className="main-nav" aria-label="Main navigation">
              <Link href="/analyze">Analyze</Link>
              <Link href="/projects/demo-analysis/overview">Project workspace</Link>
            </nav>
          </div>
        </header>
        {children}
        <footer className="site-footer">
          <div className="page-shell footer-inner">
            <span>RepoLens AI frontend</span>
            <span>Independent from the .NET backend repository</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
