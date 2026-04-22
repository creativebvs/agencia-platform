"use client";

import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";

type Content = {
  id: string;
  title: string;
  status: string;
  type?: string | null;
};

type Report = {
  id: string;
  title: string;
  periodLabel: string;
  impressions: number;
  reach: number;
  engagement: number;
  clicks: number;
  followersGained: number;
  client?: {
    id: string;
    name: string;
  } | null;
};

export default function DashboardPage() {
  const [contents, setContents] = useState<Content[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [contentsRes, reportsRes] = await Promise.all([
          fetch("/api/contents", {
            credentials: "include",
            cache: "no-store",
          }),
          fetch("/api/reports", {
            credentials: "include",
            cache: "no-store",
          }),
        ]);

        const contentsData = contentsRes.ok ? await contentsRes.json() : [];
        const reportsData = reportsRes.ok ? await reportsRes.json() : [];

        setContents(Array.isArray(contentsData) ? contentsData : []);
        setReports(Array.isArray(reportsData) ? reportsData : []);
      } catch (error) {
        console.error("Erro ao carregar dashboard:", error);
        setContents([]);
        setReports([]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const pending = useMemo(() => {
    return contents.filter(
      (c) => c.status === "waiting_client" || c.status === "in_review"
    );
  }, [contents]);

  const approved = useMemo(() => {
    return contents.filter((c) => c.status === "approved");
  }, [contents]);

  const published = useMemo(() => {
    return contents.filter((c) => c.status === "published");
  }, [contents]);

  const totals = useMemo(() => {
    return reports.reduce(
      (acc, report) => {
        acc.impressions += Number(report.impressions || 0);
        acc.reach += Number(report.reach || 0);
        acc.engagement += Number(report.engagement || 0);
        acc.clicks += Number(report.clicks || 0);
        acc.followersGained += Number(report.followersGained || 0);
        return acc;
      },
      {
        impressions: 0,
        reach: 0,
        engagement: 0,
        clicks: 0,
        followersGained: 0,
      }
    );
  }, [reports]);

  const topReports = useMemo(() => {
    return [...reports]
      .sort((a, b) => Number(b.reach || 0) - Number(a.reach || 0))
      .slice(0, 5);
  }, [reports]);

  const averageReach =
    reports.length > 0 ? Math.round(totals.reach / reports.length) : 0;

  const averageEngagement =
    reports.length > 0 ? Math.round(totals.engagement / reports.length) : 0;

  return (
    <AppShell
      title="Dashboard"
      subtitle="Visão geral da operação e dos resultados"
    >
      {loading ? (
        <div style={loadingStyle}>Carregando...</div>
      ) : (
        <div style={containerStyle}>
          <section style={sectionStyle}>
            <h2 style={sectionTitleStyle}>Resumo de conteúdos</h2>

            <div style={statsGridStyle}>
              <StatCard
                label="Pendentes"
                value={pending.length}
                color="#f39c12"
                subtitle="aguardando cliente ou revisão"
              />
              <StatCard
                label="Aprovados"
                value={approved.length}
                color="#27ae60"
                subtitle="prontos para avançar"
              />
              <StatCard
                label="Publicados"
                value={published.length}
                color="#3498db"
                subtitle="já finalizados"
              />
              <StatCard
                label="Total"
                value={contents.length}
                color="#9b59b6"
                subtitle="todos os conteúdos"
              />
            </div>
          </section>

          <section style={sectionStyle}>
            <h2 style={sectionTitleStyle}>Resumo de relatórios</h2>

            <div style={statsGridStyle}>
              <StatCard
                label="Relatórios"
                value={reports.length}
                color="#7f8c8d"
                subtitle="quantidade total"
              />
              <StatCard
                label="Impressões"
                value={formatNumber(totals.impressions)}
                color="#2980b9"
                subtitle="soma geral"
              />
              <StatCard
                label="Alcance"
                value={formatNumber(totals.reach)}
                color="#16a085"
                subtitle={`média ${formatNumber(averageReach)}`}
              />
              <StatCard
                label="Engajamento"
                value={formatNumber(totals.engagement)}
                color="#8e44ad"
                subtitle={`média ${formatNumber(averageEngagement)}`}
              />
            </div>
          </section>

          <section style={gridTwoColumnsStyle}>
            <div style={cardStyle}>
              <h2 style={sectionTitleStyle}>Conteúdos pendentes</h2>

              {pending.length === 0 ? (
                <p style={emptyTextStyle}>Nenhum conteúdo pendente</p>
              ) : (
                <div style={listStyle}>
                  {pending.map((content) => (
                    <div key={content.id} style={itemStyle}>
                      <div>
                        <div style={itemTitleStyle}>{content.title}</div>
                        <div style={itemMetaStyle}>
                          {content.type || "Sem tipo"}
                        </div>
                      </div>

                      <StatusBadge status={content.status} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={cardStyle}>
              <h2 style={sectionTitleStyle}>Conteúdos aprovados</h2>

              {approved.length === 0 ? (
                <p style={emptyTextStyle}>Nenhum conteúdo aprovado</p>
              ) : (
                <div style={listStyle}>
                  {approved.map((content) => (
                    <div key={content.id} style={itemStyle}>
                      <div>
                        <div style={itemTitleStyle}>{content.title}</div>
                        <div style={itemMetaStyle}>
                          {content.type || "Sem tipo"}
                        </div>
                      </div>

                      <StatusBadge status={content.status} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section style={gridTwoColumnsStyle}>
            <div style={cardStyle}>
              <h2 style={sectionTitleStyle}>KPIs consolidados</h2>

              <div style={kpiGridStyle}>
                <MiniStatCard
                  label="Cliques"
                  value={formatNumber(totals.clicks)}
                />
                <MiniStatCard
                  label="Seguidores ganhos"
                  value={formatNumber(totals.followersGained)}
                />
                <MiniStatCard
                  label="Alcance"
                  value={formatNumber(totals.reach)}
                />
                <MiniStatCard
                  label="Engajamento"
                  value={formatNumber(totals.engagement)}
                />
              </div>
            </div>

            <div style={cardStyle}>
              <h2 style={sectionTitleStyle}>Melhores relatórios por alcance</h2>

              {topReports.length === 0 ? (
                <p style={emptyTextStyle}>Sem relatórios ainda</p>
              ) : (
                <div style={listStyle}>
                  {topReports.map((report) => (
                    <div key={report.id} style={itemStyle}>
                      <div>
                        <div style={itemTitleStyle}>{report.title}</div>
                        <div style={itemMetaStyle}>
                          {report.periodLabel}
                          {report.client?.name
                            ? ` • ${report.client.name}`
                            : ""}
                        </div>
                      </div>

                      <div style={reachBoxStyle}>
                        {formatNumber(report.reach)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </AppShell>
  );
}

function StatCard({
  label,
  value,
  color,
  subtitle,
}: {
  label: string;
  value: string | number;
  color: string;
  subtitle: string;
}) {
  return (
    <div style={{ ...statCardStyle, borderLeft: `4px solid ${color}` }}>
      <span style={statLabelStyle}>{label}</span>
      <strong style={statValueStyle}>{value}</strong>
      <span style={statSubtitleStyle}>{subtitle}</span>
    </div>
  );
}

function MiniStatCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div style={miniStatCardStyle}>
      <div style={miniStatLabelStyle}>{label}</div>
      <div style={miniStatValueStyle}>{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const configMap: Record<string, { label: string; color: string }> = {
    draft: { label: "Rascunho", color: "#7f8c8d" },
    in_review: { label: "Em revisão", color: "#f39c12" },
    waiting_client: { label: "Aguardando cliente", color: "#9b59b6" },
    approved: { label: "Aprovado", color: "#27ae60" },
    published: { label: "Publicado", color: "#3498db" },
    changes_requested: { label: "Alterações", color: "#e74c3c" },
  };

  const config = configMap[status] || {
    label: status,
    color: "#555",
  };

  return (
    <span
      style={{
        background: config.color,
        padding: "5px 10px",
        borderRadius: 8,
        fontSize: 12,
        color: "#fff",
        whiteSpace: "nowrap",
      }}
    >
      {config.label}
    </span>
  );
}

function formatNumber(value: number) {
  return value.toLocaleString("pt-BR");
}

const containerStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 20,
};

const sectionStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 14,
};

const sectionTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 20,
};

const statsGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: 16,
};

const statCardStyle: React.CSSProperties = {
  background: "#111",
  padding: 20,
  borderRadius: 12,
  border: "1px solid #1f1f1f",
  display: "flex",
  flexDirection: "column",
  gap: 8,
};

const statLabelStyle: React.CSSProperties = {
  color: "#aaa",
  fontSize: 13,
};

const statValueStyle: React.CSSProperties = {
  fontSize: 28,
  lineHeight: 1,
};

const statSubtitleStyle: React.CSSProperties = {
  color: "#666",
  fontSize: 12,
};

const gridTwoColumnsStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 20,
};

const cardStyle: React.CSSProperties = {
  background: "#111",
  padding: 20,
  borderRadius: 12,
  border: "1px solid #1f1f1f",
};

const listStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
};

const itemStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  padding: "14px 0",
  borderBottom: "1px solid #1f1f1f",
};

const itemTitleStyle: React.CSSProperties = {
  fontWeight: 600,
  marginBottom: 4,
};

const itemMetaStyle: React.CSSProperties = {
  fontSize: 12,
  color: "#888",
};

const emptyTextStyle: React.CSSProperties = {
  color: "#777",
  margin: 0,
};

const loadingStyle: React.CSSProperties = {
  padding: 20,
};

const kpiGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 14,
};

const miniStatCardStyle: React.CSSProperties = {
  background: "#0b0b0b",
  border: "1px solid #1f1f1f",
  borderRadius: 10,
  padding: 16,
};

const miniStatLabelStyle: React.CSSProperties = {
  color: "#888",
  fontSize: 12,
  marginBottom: 8,
};

const miniStatValueStyle: React.CSSProperties = {
  fontSize: 24,
  fontWeight: "bold",
};

const reachBoxStyle: React.CSSProperties = {
  minWidth: 80,
  textAlign: "right",
  fontWeight: "bold",
  color: "#fff",
};