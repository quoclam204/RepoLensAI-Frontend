import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "RepoLens AI",
  description: "Evidence-grounded repository analysis and Q&A.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0 }}>
        <header
          style={{
            borderBottom: "1px solid #e5e5e5",
            padding: "12px 24px",
          }}
        >
          <strong>RepoLens AI</strong>
        </header>
        <main style={{ padding: "24px" }}>{children}</main>
      </body>
    </html>
  );
}
