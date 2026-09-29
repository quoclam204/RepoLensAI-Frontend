"use client";

import { useEffect, useMemo, useState } from "react";

import { ExplorerEmpty, ExplorerLoading } from "@/features/explorer/api-explorer";
import { analysisGateway, usesMockAnalysis } from "@/services/analysis-gateway";
import type { DatabaseEntityDetail, DatabaseModel } from "@/types/api";

const emptyModel: DatabaseModel = { entities: [], relationships: [] };

export function DatabaseExplorer({ analysisId }: { analysisId: string }) {
  const [model, setModel] = useState(emptyModel);
  const [selected, setSelected] = useState<DatabaseEntityDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    analysisGateway.database(analysisId)
      .then((value) => { if (active) setModel(value); })
      .catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : "Unable to load database model."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [analysisId]);

  const entityNames = useMemo(() => new Map(model.entities.map((entity) => [entity.id, entity.name])), [model.entities]);
  const inspectEntity = async (entityId: string) => {
    setDetailLoading(true);
    setError(null);
    try {
      setSelected(await analysisGateway.databaseEntity(analysisId, entityId));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to load entity details.");
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <section className="explorer-section">
      <header className="explorer-heading">
        <div><p className="eyebrow">Repository explorer</p><h1>Database model</h1><p>Review detected entities, properties and evidence-backed relationships.</p></div>
        <div className="explorer-count"><strong>{model.entities.length}</strong><span>entities</span>{usesMockAnalysis && <em>Demo data</em>}</div>
      </header>
      {error && <div className="explorer-error" role="alert">{error}</div>}
      {loading ? <ExplorerLoading label="Loading database model" /> : model.entities.length === 0 ? <ExplorerEmpty label="No database entities were detected." /> : (
        <div className="database-layout">
          <div>
            <div className="entity-grid">
              {model.entities.map((entity) => <button type="button" key={entity.id} className="entity-card" onClick={() => inspectEntity(entity.id)}><span>{entity.type}</span><strong>{entity.name}</strong><small>{entity.properties.length} properties</small></button>)}
            </div>
            <div className="relationship-card">
              <div className="section-title"><p className="eyebrow">Model links</p><h2>Relationships</h2></div>
              {model.relationships.length === 0 ? <p className="empty-copy">No relationships returned.</p> : <div className="relationship-list">{model.relationships.map((relationship) => <div key={relationship.id}><strong>{entityNames.get(relationship.sourceEntityId) ?? relationship.sourceEntityId}</strong><span>→ {relationship.type} →</span><strong>{entityNames.get(relationship.targetEntityId) ?? relationship.targetEntityId}</strong><em>{relationship.confidence}</em></div>)}</div>}
            </div>
          </div>
          <aside className="explorer-detail database-detail">
            <p className="eyebrow">Entity details</p>
            {detailLoading ? <ExplorerLoading label="Loading entity" /> : selected ? <EntityDetail entity={selected} /> : <p className="empty-copy">Select an entity to inspect its fields, source and evidence.</p>}
          </aside>
        </div>
      )}
    </section>
  );
}

function EntityDetail({ entity }: { entity: DatabaseEntityDetail }) {
  return <><h2>{entity.name}</h2><span className="type-pill">{entity.type}</span>{entity.source && <dl className="detail-list"><div><dt>Source file</dt><dd>{entity.source.file}</dd></div><div><dt>Symbol</dt><dd>{entity.source.symbol}</dd></div></dl>}<h3>Properties</h3><div className="property-list">{entity.properties.map((property) => <div key={property.name}><strong>{property.name}</strong><code>{property.type}</code><span>{property.nullable ? "nullable" : "required"}</span></div>)}</div><div className="evidence-list"><h3>Evidence</h3>{entity.evidence.length === 0 ? <p className="empty-copy">No evidence returned.</p> : entity.evidence.map((item, index) => <article key={`${item.file}-${index}`}><strong>{item.file}</strong><span>Lines {item.startLine}–{item.endLine}</span><p>{item.reason}</p></article>)}</div></>;
}
