import React, { useEffect, useState } from "react";
import { getDatabaseModel } from "../../lib/api/database";
import type { DatabaseModelResponse } from "../../types";
import { Card } from "../../components/ui/Card";
import { Loading } from "../../components/ui/Loading";
import { ErrorMessage } from "../../components/ui/ErrorMessage";

interface DatabaseViewProps {
  analysisId: string;
}

export function DatabaseView({ analysisId }: DatabaseViewProps) {
  const [data, setData] = useState<DatabaseModelResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    getDatabaseModel(analysisId)
      .then((res) => {
        if (isMounted) {
          setData(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to load database schema");
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [analysisId]);

  if (loading) {
    return <Loading label="Loading database schema..." style={{ padding: "60px 0" }} />;
  }

  if (error) {
    return <ErrorMessage message={error} style={{ margin: "20px 0" }} />;
  }

  const entities = data?.entities || [];
  const relationships = data?.relationships || [];

  if (entities.length === 0) {
    return (
      <Card style={{ padding: 40, textAlign: "center" }}>
        <p style={{ color: "var(--text-secondary)" }}>
          No database entities detected in this repository.
        </p>
      </Card>
    );
  }

  const entityMap = new Map(entities.map((e) => [e.id, e.name]));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Overview bar */}
      <div style={{ display: "flex", gap: 16 }}>
        <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
          Entities: <strong style={{ color: "#60a5fa" }}>{entities.length}</strong>
        </span>
        <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
          Relationships: <strong style={{ color: "#34d399" }}>{relationships.length}</strong>
        </span>
      </div>

      {/* ER-style entities grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: 16,
        }}
      >
        {entities.map((entity) => {
          const entityRels = relationships.filter(
            (r) => r.sourceEntityId === entity.id || r.targetEntityId === entity.id
          );

          return (
            <Card
              key={entity.id}
              style={{
                padding: 0,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* Entity Header */}
              <div
                style={{
                  backgroundColor: "var(--bg-secondary)",
                  padding: "12px 16px",
                  borderBottom: "1px solid var(--border-color)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: "1rem" }}>???</span>
                  <strong style={{ fontSize: "0.95rem", color: "var(--text-primary)" }}>
                    {entity.name}
                  </strong>
                </div>
                <span
                  style={{
                    fontSize: "0.7rem",
                    backgroundColor: "rgba(59, 130, 246, 0.15)",
                    color: "#93c5fd",
                    padding: "2px 6px",
                    borderRadius: 4,
                    textTransform: "uppercase",
                    fontWeight: 700,
                  }}
                >
                  {entity.type || "Table"}
                </span>
              </div>

              {/* Properties / Columns */}
              <div style={{ padding: "12px 16px", flexGrow: 1 }}>
                <span
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--text-muted)",
                    display: "block",
                    marginBottom: 8,
                    fontWeight: 600,
                  }}
                >
                  PROPERTIES ({entity.properties?.length || 0})
                </span>

                {(!entity.properties || entity.properties.length === 0) ? (
                  <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>No properties found</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {entity.properties.map((prop, i) => (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: "0.8rem",
                          borderBottom: "1px dashed var(--border-subtle)",
                          paddingBottom: 4,
                        }}
                      >
                        <span style={{ fontWeight: 500, color: "var(--text-primary)" }}>{prop.name}</span>
                        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                          <code style={{ fontSize: "0.75rem", color: "#60a5fa" }}>{prop.type}</code>
                          {prop.nullable && (
                            <span style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>NULL</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Connected Relationships */}
              {entityRels.length > 0 && (
                <div
                  style={{
                    backgroundColor: "rgba(0,0,0,0.2)",
                    padding: "10px 16px",
                    borderTop: "1px solid var(--border-subtle)",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.7rem",
                      color: "var(--text-muted)",
                      display: "block",
                      marginBottom: 6,
                      fontWeight: 600,
                    }}
                  >
                    RELATIONSHIPS ({entityRels.length})
                  </span>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {entityRels.map((rel) => {
                      const isSource = rel.sourceEntityId === entity.id;
                      const otherId = isSource ? rel.targetEntityId : rel.sourceEntityId;
                      const otherName = entityMap.get(otherId) || otherId;

                      return (
                        <div
                          key={rel.id}
                          style={{
                            fontSize: "0.75rem",
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <span style={{ color: "var(--text-secondary)" }}>
                            {isSource ? "?" : "?"} {otherName}
                          </span>
                          <span style={{ color: "#34d399", fontWeight: 600 }}>{rel.type}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
