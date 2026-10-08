"use client";

import { FormEvent, useEffect, useState } from "react";

import { ExplorerEmpty, ExplorerLoading, Pagination } from "@/features/explorer/api-explorer";
import { analysisGateway, usesMockAnalysis } from "@/services/analysis-gateway";
import type { FileContent, FileDetail, FileItem, FileQuery, PagedResult, SymbolDetail } from "@/types/api";

const emptyPage: PagedResult<FileItem> = { items: [], totalCount: 0, page: 1, pageSize: 20, totalPages: 0 };

export function FileExplorer({ analysisId }: { analysisId: string }) {
  const [searchDraft, setSearchDraft] = useState("");
  const [languageDraft, setLanguageDraft] = useState("");
  const [filters, setFilters] = useState<FileQuery>({ page: 1, pageSize: 20 });
  const [result, setResult] = useState(emptyPage);
  const [detail, setDetail] = useState<FileDetail | null>(null);
  const [content, setContent] = useState<FileContent | null>(null);
  const [symbol, setSymbol] = useState<SymbolDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    analysisGateway.files(analysisId, filters)
      .then((page) => { if (active) setResult(page); })
      .catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : "Unable to load repository files."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [analysisId, filters]);

  const search = (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setDetail(null);
    setContent(null);
    setSymbol(null);
    setFilters({ search: searchDraft.trim(), language: languageDraft, page: 1, pageSize: 20 });
  };

  const changePage = (page: number) => {
    setLoading(true);
    setError(null);
    setFilters((current) => ({ ...current, page }));
  };

  const inspectFile = async (fileId: string) => {
    setDetailLoading(true);
    setError(null);
    setSymbol(null);
    try {
      const [fileDetail, fileContent] = await Promise.all([
        analysisGateway.fileDetail(analysisId, fileId),
        analysisGateway.fileContent(analysisId, fileId),
      ]);
      setDetail(fileDetail);
      setContent(fileContent);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to load file details.");
    } finally {
      setDetailLoading(false);
    }
  };

  const inspectSymbol = async (symbolId: string) => {
    setDetailLoading(true);
    setError(null);
    try {
      setSymbol(await analysisGateway.symbolDetail(analysisId, symbolId));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to load symbol details.");
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <section className="explorer-section">
      <header className="explorer-heading">
        <div><p className="eyebrow">Repository explorer</p><h1>Files and symbols</h1><p>Search the repository index, inspect symbols and review source content.</p></div>
        <div className="explorer-count"><strong>{result.totalCount}</strong><span>files</span>{usesMockAnalysis && <em>Demo data</em>}</div>
      </header>

      <form className="explorer-toolbar" onSubmit={search}>
        <label className="grow"><span>Search path</span><input value={searchDraft} onChange={(event) => setSearchDraft(event.target.value)} placeholder="Controllers or .cs" /></label>
        <label><span>Language</span><select value={languageDraft} onChange={(event) => setLanguageDraft(event.target.value)}><option value="">All languages</option><option>C#</option><option>TypeScript</option><option>JavaScript</option><option>SQL</option></select></label>
        <button className="button primary" type="submit">Search files</button>
      </form>

      {error && <div className="explorer-error" role="alert">{error}</div>}
      <div className="file-layout">
        <div className="explorer-list file-list">
          {loading ? (
            <ExplorerLoading label="Loading files" />
          ) : result.items.length === 0 ? (
            <ExplorerEmpty label="No files match the selected filters." />
          ) : (
            result.items.map((file) => (
              <button
                type="button"
                className={`file-row ${detail?.id === file.id ? "active" : ""}`}
                key={file.id}
                onClick={() => inspectFile(file.id)}
              >
                <span className="file-icon" title={file.language}>
                  {file.path.split(".").at(-1)?.slice(0, 4).toUpperCase() || "FILE"}
                </span>
                <div className="file-info">
                  <strong className="file-name" title={file.path.split("/").at(-1)}>
                    {file.path.split("/").at(-1)}
                  </strong>
                  <small className="file-path" title={file.path}>
                    {file.path}
                  </small>
                </div>
                <div className="file-meta">
                  <span className="file-lang-badge">{file.language}</span>
                  <small>{formatBytes(file.size)}</small>
                </div>
              </button>
            ))
          )}
          {!loading && result.totalPages > 1 && <Pagination page={result.page} totalPages={result.totalPages} onChange={changePage} />}
        </div>

        <div className="file-inspector">
          {detailLoading ? <ExplorerLoading label="Loading repository details" /> : detail && content ? (
            <>
              <div className="file-inspector-head"><div><p className="eyebrow">Source preview</p><h2>{detail.path.split("/").at(-1)}</h2><span>{detail.path} · {content.lineCount} lines</span></div><span className="type-pill">{detail.language}</span></div>
              {detail.symbols.length > 0 && <div className="symbol-strip"><strong>Symbols</strong>{detail.symbols.map((item) => <button type="button" key={item.id} onClick={() => inspectSymbol(item.id)}>{item.type} · {item.name}<small>L{item.startLine}–{item.endLine}</small></button>)}</div>}
              {symbol && <div className="symbol-detail"><button type="button" onClick={() => setSymbol(null)}>Close</button><p className="eyebrow">Symbol detail</p><h3>{symbol.name}</h3><dl className="detail-list"><div><dt>Full name</dt><dd>{symbol.fullName}</dd></div><div><dt>Type</dt><dd>{symbol.type}</dd></div><div><dt>Lines</dt><dd>{symbol.startLine}–{symbol.endLine}</dd></div><div><dt>Relationships</dt><dd>{symbol.relationships.length}</dd></div></dl></div>}
              <pre className="source-code" tabIndex={0}><code>{content.content}</code></pre>
            </>
          ) : <ExplorerEmpty label="Select a file to inspect its symbols and source content." />}
        </div>
      </div>
    </section>
  );
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}
