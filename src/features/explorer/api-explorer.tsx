"use client";

import { FormEvent, useEffect, useState } from "react";

import { analysisGateway, usesMockAnalysis } from "@/services/analysis-gateway";
import type { EndpointDetail, EndpointItem, EndpointQuery, PagedResult } from "@/types/api";

const emptyPage: PagedResult<EndpointItem> = { items: [], totalCount: 0, page: 1, pageSize: 20, totalPages: 0 };

export function ApiExplorer({ analysisId }: { analysisId: string }) {
  const [routeDraft, setRouteDraft] = useState("");
  const [methodDraft, setMethodDraft] = useState("");
  const [filters, setFilters] = useState<EndpointQuery>({ page: 1, pageSize: 20 });
  const [result, setResult] = useState(emptyPage);
  const [selected, setSelected] = useState<EndpointDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    analysisGateway.endpoints(analysisId, filters)
      .then((page) => { if (active) setResult(page); })
      .catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : "Unable to load endpoints."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [analysisId, filters]);

  const search = (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSelected(null);
    setFilters({ method: methodDraft, route: routeDraft.trim(), page: 1, pageSize: 20 });
  };

  const changePage = (page: number) => {
    setLoading(true);
    setError(null);
    setFilters((current) => ({ ...current, page }));
  };

  const inspectEndpoint = async (endpoint: EndpointItem) => {
    setDetailLoading(true);
    setError(null);
    try {
      setSelected(await analysisGateway.endpointDetail(analysisId, endpoint.id));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to load endpoint details.");
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <section className="explorer-section">
      <header className="explorer-heading">
        <div><p className="eyebrow">Repository explorer</p><h1>API endpoints</h1><p>Filter detected HTTP routes and inspect their source evidence.</p></div>
        <div className="explorer-count"><strong>{result.totalCount}</strong><span>endpoints</span>{usesMockAnalysis && <em>Demo data</em>}</div>
      </header>

      <form className="explorer-toolbar" onSubmit={search}>
        <label><span>Method</span><select value={methodDraft} onChange={(event) => setMethodDraft(event.target.value)}><option value="">All methods</option>{["GET", "POST", "PUT", "PATCH", "DELETE"].map((method) => <option key={method}>{method}</option>)}</select></label>
        <label className="grow"><span>Route contains</span><input value={routeDraft} onChange={(event) => setRouteDraft(event.target.value)} placeholder="/api/analyses" /></label>
        <button className="button primary" type="submit">Apply filters</button>
      </form>

      {error && <div className="explorer-error" role="alert">{error}</div>}
      <div className="explorer-layout">
        <div className="explorer-list">
          {loading ? <ExplorerLoading label="Loading endpoints" /> : result.items.length === 0 ? <ExplorerEmpty label="No endpoints match the selected filters." /> : result.items.map((endpoint) => (
            <button className="endpoint-row" key={endpoint.id} type="button" onClick={() => inspectEndpoint(endpoint)}>
              <span className={`method method-${endpoint.method.toLowerCase()}`}>{endpoint.method}</span>
              <span><strong>{endpoint.route}</strong><small>{endpoint.controller ?? "Unknown controller"}{endpoint.action ? ` · ${endpoint.action}` : ""}</small></span>
              <span className="row-project">{endpoint.project.name}</span>
            </button>
          ))}
          {!loading && result.totalPages > 1 && <Pagination page={result.page} totalPages={result.totalPages} onChange={changePage} />}
        </div>

        <aside className="explorer-detail">
          <p className="eyebrow">Endpoint details</p>
          {detailLoading ? <ExplorerLoading label="Loading details" /> : selected ? (
            <>
              <div className="detail-title"><span className={`method method-${selected.method.toLowerCase()}`}>{selected.method}</span><h2>{selected.route}</h2></div>
              <dl className="detail-list">
                <div><dt>Project</dt><dd>{selected.project}</dd></div>
                <div><dt>Controller</dt><dd>{selected.controller ?? "—"}</dd></div>
                <div><dt>Action</dt><dd>{selected.action ?? "—"}</dd></div>
                <div><dt>Source file</dt><dd>{selected.source.file}</dd></div>
                {selected.source.symbol && <div><dt>Symbol</dt><dd>{selected.source.symbol}</dd></div>}
              </dl>
              <EvidenceList evidence={selected.evidence} />
            </>
          ) : <p className="empty-copy">Select an endpoint to inspect its controller, action and source evidence.</p>}
        </aside>
      </div>
    </section>
  );
}

function EvidenceList({ evidence }: { evidence: EndpointDetail["evidence"] }) {
  return <div className="evidence-list"><h3>Evidence</h3>{evidence.length === 0 ? <p className="empty-copy">No evidence returned.</p> : evidence.map((item, index) => <article key={`${item.file}-${index}`}><strong>{item.file}</strong><span>Lines {item.startLine}–{item.endLine}</span><p>{item.reason}</p></article>)}</div>;
}

export function ExplorerLoading({ label }: { label: string }) {
  return <div className="explorer-inline-state" aria-live="polite"><span className="spinner" /><p>{label}</p></div>;
}

export function ExplorerEmpty({ label }: { label: string }) {
  return <div className="explorer-inline-state"><span className="state-symbol">0</span><p>{label}</p></div>;
}

export function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (page: number) => void }) {
  return <nav className="pagination" aria-label="Pagination"><button type="button" disabled={page <= 1} onClick={() => onChange(page - 1)}>Previous</button><span>Page {page} of {totalPages}</span><button type="button" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>Next</button></nav>;
}
