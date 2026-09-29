import React, { useEffect, useState } from "react";
import { getArchifyArchitecture } from "../../lib/api/architecture";
import type { ArchifyDocument } from "../../types";
import { Card } from "../../components/ui/Card";
import { Loading } from "../../components/ui/Loading";
import { ErrorMessage } from "../../components/ui/ErrorMessage";
import { Button } from "../../components/ui/Button";

interface ArchifyViewProps {
  analysisId: string;
}

export function ArchifyView({ analysisId }: ArchifyViewProps) {
  const [doc, setDoc] = useState<ArchifyDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showJson, setShowJson] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    getArchifyArchitecture(analysisId)
      .then((data) => {
        if (isMounted) {
          setDoc(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to load Archify C4 specification");
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [analysisId]);

  if (loading) {
    return <Loading label="Loading Archify C4 architecture model..." style={{ padding: "60px 0" }} />;
  }

  if (error) {
    return <ErrorMessage message={error} style={{ margin: "20px 0" }} />;
  }

  if (!doc || !doc.system) {
    return (
      <Card style={{ padding: 40, textAlign: "center" }}>
        <p style={{ color: "var(--text-secondary)" }}>
          No Archify C4 model available for this analysis.
        </p>
      </Card>
    );
  }

  const { system } = doc;

  const copyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(doc, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* System Header */}
      <Card style={{ padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  backgroundColor: "rgba(139, 92, 246, 0.2)",
                  color: "#c4b5fd",
                  padding: "3px 8px",
                  borderRadius: 4,
                  border: "1px solid rgba(139, 92, 246, 0.4)",
                }}
              >
                C4 SYSTEM CONTEXT
              </span>
              <h3 style={{ fontSize: "1.3rem", fontWeight: 700 }}>{system.name || "Software System"}</h3>
            </div>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", maxWidth: 680 }}>
              {system.description || "Architectural C4 container model extracted from repository structure."}
            </p>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowJson(!showJson)}
            >
              {showJson ? "Hide JSON Schema" : "View C4 JSON"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={copyJson}
            >
              {copied ? "Copied!" : "Copy JSON"}
            </Button>
          </div>
        </div>

        {/* C4 Metric tags */}
        <div style={{ display: "flex", gap: 16, marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--border-subtle)" }}>
          <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
            Containers: <strong style={{ color: "#60a5fa" }}>{system.containers?.length || 0}</strong>
          </span>
          <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
            Relationships: <strong style={{ color: "#34d399" }}>{system.relationships?.length || 0}</strong>
          </span>
        </div>
      </Card>

      {/* Raw JSON Schema view if toggled */}
      {showJson && (
        <Card style={{ padding: 16, backgroundColor: "#070b14" }}>
          <pre
            style={{
              maxHeight: 360,
              overflow: "auto",
              fontSize: "0.8rem",
              color: "#a5b4fc",
            }}
          >
            {JSON.stringify(doc, null, 2)}
          </pre>
        </Card>
      )}

      {/* C4 Containers Grid */}
      <div>
        <h4 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 14 }}>
          C4 Containers ({system.containers?.length || 0})
        </h4>

        {(!system.containers || system.containers.length === 0) ? (
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>No containers discovered.</p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: 16,
            }}
          >
            {system.containers.map((container) => (
              <Card key={container.id} style={{ padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <h5 style={{ fontSize: "1rem", fontWeight: 700 }}>{container.name}</h5>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>ID: {container.id}</span>
                  </div>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      backgroundColor: "rgba(59, 130, 246, 0.15)",
                      color: "#93c5fd",
                      padding: "2px 8px",
                      borderRadius: 4,
                      fontWeight: 600,
                    }}
                  >
                    {container.technology || container.type || "Container"}
                  </span>
                </div>

                {/* Sub-components */}
                {container.components && container.components.length > 0 && (
                  <div>
                    <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>
                      COMPONENTS ({container.components.length})
                    </span>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {container.components.map((comp) => (
                        <span
                          key={comp.id}
                          style={{
                            fontSize: "0.75rem",
                            backgroundColor: "var(--bg-secondary)",
                            border: "1px solid var(--border-color)",
                            padding: "3px 8px",
                            borderRadius: 4,
                            color: "var(--text-primary)",
                          }}
                          title={`ID: ${comp.id}`}
                        >
                          {comp.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* C4 Relationships */}
      {system.relationships && system.relationships.length > 0 && (
        <Card style={{ padding: 20 }}>
          <h4 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 14 }}>
            C4 Relationships ({system.relationships.length})
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {system.relationships.map((rel, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 14px",
                  borderRadius: 6,
                  backgroundColor: "var(--bg-secondary)",
                  fontSize: "0.85rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <strong style={{ color: "#93c5fd" }}>{rel.sourceId}</strong>
                  <span style={{ color: "var(--text-muted)" }}>???</span>
                  <span
                    style={{
                      padding: "2px 8px",
                      borderRadius: 4,
                      backgroundColor: "rgba(59, 130, 246, 0.12)",
                      color: "#60a5fa",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                    }}
                  >
                    {rel.type}
                  </span>
                  <span style={{ color: "var(--text-muted)" }}>??</span>
                  <strong style={{ color: "#a7f3d0" }}>{rel.targetId}</strong>
                </div>

                {rel.confidence && (
                  <span
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                    }}
                  >
                    Confidence: {rel.confidence}
                  </span>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
