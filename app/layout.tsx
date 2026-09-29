import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "RepoLens AI - Visual Repository Intelligence",
  description: "Understand any GitHub repository visually. Evidence-grounded code architecture, dependencies, endpoints, database schemas, and AI Q&A.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <header
          style={{
            borderBottom: "1px solid var(--border-color)",
            backgroundColor: "rgba(17, 24, 39, 0.8)",
            backdropFilter: "blur(8px)",
            padding: "14px 28px",
            position: "sticky",
            top: 0,
            zIndex: 50,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Link
              href="/"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                textDecoration: "none",
                color: "var(--text-primary)",
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: 18,
                  color: "#fff",
                  boxShadow: "0 2px 8px rgba(59, 130, 246, 0.4)",
                }}
              >
                R
              </div>
              <span style={{ fontSize: "1.15rem", fontWeight: 700, letterSpacing: "-0.01em" }}>
                Repo<span style={{ color: "#60a5fa" }}>Lens</span> AI
              </span>
            </Link>
            <span
              style={{
                fontSize: "0.75rem",
                padding: "2px 8px",
                borderRadius: 12,
                backgroundColor: "rgba(59, 130, 246, 0.15)",
                color: "#93c5fd",
                fontWeight: 600,
                border: "1px solid rgba(59, 130, 246, 0.3)",
              }}
            >
              MVP
            </span>
          </div>

          <nav style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <Link
              href="/"
              style={{
                fontSize: "0.9rem",
                color: "var(--text-secondary)",
                textDecoration: "none",
              }}
            >
              New Analysis
            </Link>
            <a
              href="https://github.com/quoclam204/RepoLensAI-Backend"
              target="_blank"
              rel="noreferrer"
              style={{
                fontSize: "0.85rem",
                color: "var(--text-muted)",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              Backend Docs
            </a>
          </nav>
        </header>

        <main style={{ minHeight: "calc(100vh - 65px)" }}>{children}</main>
      </body>
    </html>
  );
}
