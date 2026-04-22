"use client";

import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import { useCurrentUser } from "@/hooks/useCurrentUser";

type Client = {
  id: string;
  name: string;
};

type ReportItem = {
  id: string;
  title: string;
  periodLabel: string;
  impressions: number;
  reach: number;
  engagement: number;
  clicks: number;
  followersGained: number;
  notes?: string | null;
  createdAt: string;
  client: Client;
};

type ReportForm = {
  title: string;
  periodLabel: string;
  clientId: string;
  impressions: string;
  reach: string;
  engagement: string;
  clicks: string;
  followersGained: string;
  notes: string;
};

const initialForm: ReportForm = {
  title: "",
  periodLabel: "",
  clientId: "",
  impressions: "0",
  reach: "0",
  engagement: "0",
  clicks: "0",
  followersGained: "0",
  notes: "",
};

export default function ReportsPage() {
  const { user, loading: userLoading } = useCurrentUser({ redirectToLogin: true });

  const [reports, setReports] = useState<ReportItem[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const [form, setForm] = useState<ReportForm>(initialForm);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingForm, setEditingForm] = useState<ReportForm>(initialForm);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function loadData() {
    try {
      const [reportsRes, clientsRes] = await Promise.all([
        fetch("/api/reports", { cache: "no-store" }),
        fetch("/api/clients", { cache: "no-store" }),
      ]);

      const [reportsData, clientsData] = await Promise.all([
        reportsRes.json(),
        clientsRes.json(),
      ]);

      setReports(Array.isArray(reportsData) ? reportsData : []);
      setClients(Array.isArray(clientsData) ? clientsData : []);
    } catch (error) {
      console.error("Erro ao carregar relatórios:", error);
      alert("Erro ao carregar relatórios.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!userLoading && user) {
      loadData();
    }
  }, [userLoading, user]);

  const visibleReports = useMemo(() => {
    if (!user) return [];

    if (user.role === "client" && user.client?.id) {
      return reports.filter((report) => report.client?.id === user.client?.id);
    }

    return reports;
  }, [reports, user]);

  const totals = useMemo(() => {
    return visibleReports.reduce(
      (acc, report) => {
        acc.impressions += report.impressions || 0;
        acc.reach += report.reach || 0;
        acc.engagement += report.engagement || 0;
        acc.clicks += report.clicks || 0;
        acc.followersGained += report.followersGained || 0;
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
  }, [visibleReports]);

  const averages = useMemo(() => {
    if (visibleReports.length === 0) {
      return {
        impressions: 0,
        reach: 0,
        engagement: 0,
        clicks: 0,
        followersGained: 0,
      };
    }

    return {
      impressions: Math.round(totals.impressions / visibleReports.length),
      reach: Math.round(totals.reach / visibleReports.length),
      engagement: Math.round(totals.engagement / visibleReports.length),
      clicks: Math.round(totals.clicks / visibleReports.length),
      followersGained: Math.round(totals.followersGained / visibleReports.length),
    };
  }, [totals, visibleReports]);

  const bestReportsByReach = useMemo(() => {
    return [...visibleReports]
      .sort((a, b) => b.reach - a.reach)
      .slice(0, 5);
  }, [visibleReports]);

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.title.trim() || !form.periodLabel.trim() || !form.clientId) {
      alert("Preencha título, período e cliente.");
      return;
    }

    try {
      setCreating(true);

      const response = await fetch("/api/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Erro ao criar relatório.");
      }

      setForm(initialForm);
      await loadData();
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Erro ao criar relatório.");
    } finally {
      setCreating(false);
    }
  }

  function startEdit(report: ReportItem) {
    setEditingId(report.id);
    setEditingForm({
      title: report.title,
      periodLabel: report.periodLabel,
      clientId: report.client.id,
      impressions: String(report.impressions),
      reach: String(report.reach),
      engagement: String(report.engagement),
      clicks: String(report.clicks),
      followersGained: String(report.followersGained),
      notes: report.notes || "",
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditingForm(initialForm);
  }

  async function handleSave(reportId: string) {
    if (!editingForm.title.trim() || !editingForm.periodLabel.trim()) {
      alert("Preencha título e período.");
      return;
    }

    try {
      setSavingId(reportId);

      const response = await fetch(`/api/reports/${reportId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editingForm),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Erro ao editar relatório.");
      }

      cancelEdit();
      await loadData();
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Erro ao editar relatório.");
    } finally {
      setSavingId(null);
    }
  }

  async function handleDelete(reportId: string) {
    const confirmed = window.confirm(
      "Tem certeza que deseja excluir este relatório?"
    );

    if (!confirmed) return;

    try {
      setDeletingId(reportId);

      const response = await fetch(`/api/reports/${reportId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Erro ao excluir relatório.");
      }

      await loadData();
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Erro ao excluir relatório.");
    } finally {
      setDeletingId(null);
    }
  }

  if (userLoading || !user) {
    return null;
  }

  return (
    <AppShell
      title="Relatórios"
      subtitle="KPIs e análise de desempenho por cliente."
    >
      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Resumo analítico</h2>

        <div style={topCardsGridStyle}>
          <BigStatCard title="Relatórios" value={visibleReports.length} subtitle="quantidade total" />
          <BigStatCard title="Impressões" value={formatNumber(totals.impressions)} subtitle={`média ${formatNumber(averages.impressions)}`} />
          <BigStatCard title="Alcance" value={formatNumber(totals.reach)} subtitle={`média ${formatNumber(averages.reach)}`} />
          <BigStatCard title="Engajamento" value={formatNumber(totals.engagement)} subtitle={`média ${formatNumber(averages.engagement)}`} />
        </div>
      </section>

      {user.role !== "client" && (
        <section style={sectionStyle}>
          <h2 style={sectionTitleStyle}>Novo relatório</h2>

          <form onSubmit={handleCreate} style={formStyle}>
            <input
              type="text"
              placeholder="Título"
              value={form.title}
              onChange={(e) =>
                setForm((current) => ({
                  ...current,
                  title: e.target.value,
                }))
              }
              style={inputStyle}
            />

            <input
              type="text"
              placeholder="Período (ex: Abril 2026)"
              value={form.periodLabel}
              onChange={(e) =>
                setForm((current) => ({
                  ...current,
                  periodLabel: e.target.value,
                }))
              }
              style={inputStyle}
            />

            <select
              value={form.clientId}
              onChange={(e) =>
                setForm((current) => ({
                  ...current,
                  clientId: e.target.value,
                }))
              }
              style={inputStyle}
            >
              <option value="">Selecione o cliente</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>

            <input
              type="number"
              placeholder="Impressões"
              value={form.impressions}
              onChange={(e) =>
                setForm((current) => ({
                  ...current,
                  impressions: e.target.value,
                }))
              }
              style={inputStyle}
            />

            <input
              type="number"
              placeholder="Alcance"
              value={form.reach}
              onChange={(e) =>
                setForm((current) => ({
                  ...current,
                  reach: e.target.value,
                }))
              }
              style={inputStyle}
            />

            <input
              type="number"
              placeholder="Engajamento"
              value={form.engagement}
              onChange={(e) =>
                setForm((current) => ({
                  ...current,
                  engagement: e.target.value,
                }))
              }
              style={inputStyle}
            />

            <input
              type="number"
              placeholder="Cliques"
              value={form.clicks}
              onChange={(e) =>
                setForm((current) => ({
                  ...current,
                  clicks: e.target.value,
                }))
              }
              style={inputStyle}
            />

            <input
              type="number"
              placeholder="Seguidores ganhos"
              value={form.followersGained}
              onChange={(e) =>
                setForm((current) => ({
                  ...current,
                  followersGained: e.target.value,
                }))
              }
              style={inputStyle}
            />

            <textarea
              placeholder="Observações"
              value={form.notes}
              onChange={(e) =>
                setForm((current) => ({
                  ...current,
                  notes: e.target.value,
                }))
              }
              style={textareaStyle}
            />

            <div style={formButtonRowStyle}>
              <button type="submit" disabled={creating} style={buttonStyle}>
                {creating ? "Criando..." : "Criar relatório"}
              </button>
            </div>
          </form>
        </section>
      )}

      <section style={twoColumnsStyle}>
        <div style={panelStyle}>
          <h2 style={sectionTitleStyle}>Melhores relatórios por alcance</h2>

          {bestReportsByReach.length === 0 ? (
            <p style={mutedTextStyle}>Sem dados suficientes.</p>
          ) : (
            <SimpleComparisonChart
              data={bestReportsByReach.map((report) => ({
                label: `${report.client.name} • ${report.periodLabel}`,
                value: report.reach,
                secondary: `${report.title} • Eng: ${formatNumber(report.engagement)}`,
              }))}
            />
          )}
        </div>

        <div style={panelStyle}>
          <h2 style={sectionTitleStyle}>Médias por relatório</h2>

          <div style={statsGridStyle}>
            <StatItem label="Impressões" value={averages.impressions} />
            <StatItem label="Alcance" value={averages.reach} />
            <StatItem label="Engajamento" value={averages.engagement} />
            <StatItem label="Cliques" value={averages.clicks} />
            <StatItem label="Seguidores ganhos" value={averages.followersGained} />
          </div>
        </div>
      </section>

      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Lista de relatórios</h2>

        {loading ? (
          <div style={emptyBoxStyle}>Carregando relatórios...</div>
        ) : visibleReports.length === 0 ? (
          <div style={emptyBoxStyle}>Nenhum relatório cadastrado.</div>
        ) : (
          <div style={listStyle}>
            {visibleReports.map((report) => {
              const isEditing = editingId === report.id;
              const isSaving = savingId === report.id;
              const isDeleting = deletingId === report.id;

              return (
                <div key={report.id} style={cardStyle}>
                  {isEditing ? (
                    <>
                      <div style={formStyle}>
                        <input
                          type="text"
                          value={editingForm.title}
                          onChange={(e) =>
                            setEditingForm((current) => ({
                              ...current,
                              title: e.target.value,
                            }))
                          }
                          style={inputStyle}
                        />

                        <input
                          type="text"
                          value={editingForm.periodLabel}
                          onChange={(e) =>
                            setEditingForm((current) => ({
                              ...current,
                              periodLabel: e.target.value,
                            }))
                          }
                          style={inputStyle}
                        />

                        <input
                          type="number"
                          value={editingForm.impressions}
                          onChange={(e) =>
                            setEditingForm((current) => ({
                              ...current,
                              impressions: e.target.value,
                            }))
                          }
                          style={inputStyle}
                        />

                        <input
                          type="number"
                          value={editingForm.reach}
                          onChange={(e) =>
                            setEditingForm((current) => ({
                              ...current,
                              reach: e.target.value,
                            }))
                          }
                          style={inputStyle}
                        />

                        <input
                          type="number"
                          value={editingForm.engagement}
                          onChange={(e) =>
                            setEditingForm((current) => ({
                              ...current,
                              engagement: e.target.value,
                            }))
                          }
                          style={inputStyle}
                        />

                        <input
                          type="number"
                          value={editingForm.clicks}
                          onChange={(e) =>
                            setEditingForm((current) => ({
                              ...current,
                              clicks: e.target.value,
                            }))
                          }
                          style={inputStyle}
                        />

                        <input
                          type="number"
                          value={editingForm.followersGained}
                          onChange={(e) =>
                            setEditingForm((current) => ({
                              ...current,
                              followersGained: e.target.value,
                            }))
                          }
                          style={inputStyle}
                        />

                        <textarea
                          value={editingForm.notes}
                          onChange={(e) =>
                            setEditingForm((current) => ({
                              ...current,
                              notes: e.target.value,
                            }))
                          }
                          style={textareaStyle}
                        />
                      </div>

                      <div style={actionsStyle}>
                        <button
                          type="button"
                          onClick={() => handleSave(report.id)}
                          disabled={isSaving}
                          style={buttonStyle}
                        >
                          {isSaving ? "Salvando..." : "Salvar"}
                        </button>

                        <button
                          type="button"
                          onClick={cancelEdit}
                          disabled={isSaving}
                          style={secondaryButtonStyle}
                        >
                          Cancelar
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={cardHeaderStyle}>
                        <div>
                          <div style={cardTitleStyle}>{report.title}</div>
                          <div style={metaStyle}>
                            Cliente: {report.client.name}
                          </div>
                          <div style={metaStyle}>
                            Período: {report.periodLabel}
                          </div>
                        </div>

                        <div style={badgeStyle}>Relatório</div>
                      </div>

                      <div style={statsGridStyle}>
                        <StatItem label="Impressões" value={report.impressions} />
                        <StatItem label="Alcance" value={report.reach} />
                        <StatItem label="Engajamento" value={report.engagement} />
                        <StatItem label="Cliques" value={report.clicks} />
                        <StatItem label="Seguidores ganhos" value={report.followersGained} />
                      </div>

                      <div style={notesStyle}>
                        {report.notes?.trim() || "Sem observações."}
                      </div>

                      <div style={metaStyle}>
                        Criado em: {new Date(report.createdAt).toLocaleDateString("pt-BR")}
                      </div>

                      {user.role !== "client" && (
                        <div style={actionsStyle}>
                          <button
                            type="button"
                            onClick={() => startEdit(report)}
                            style={buttonStyle}
                          >
                            Editar
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(report.id)}
                            disabled={isDeleting}
                            style={dangerButtonStyle}
                          >
                            {isDeleting ? "Excluindo..." : "Excluir"}
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </AppShell>
  );
}

function BigStatCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string | number;
  subtitle: string;
}) {
  return (
    <div style={bigStatCardStyle}>
      <div style={bigStatTitleStyle}>{title}</div>
      <div style={bigStatValueStyle}>{value}</div>
      <div style={bigStatSubtitleStyle}>{subtitle}</div>
    </div>
  );
}

function StatItem({ label, value }: { label: string; value: number }) {
  return (
    <div style={statCardStyle}>
      <div style={statLabelStyle}>{label}</div>
      <div style={statValueStyle}>{formatNumber(value)}</div>
    </div>
  );
}

function SimpleComparisonChart({
  data,
}: {
  data: Array<{ label: string; value: number; secondary?: string }>;
}) {
  const max = Math.max(...data.map((item) => item.value), 1);

  return (
    <div style={chartListStyle}>
      {data.map((item) => (
        <div key={item.label} style={comparisonItemStyle}>
          <div style={comparisonHeaderStyle}>
            <strong>{item.label}</strong>
            <span style={chartValueStyle}>{formatNumber(item.value)}</span>
          </div>

          <div style={chartTrackStyle}>
            <div
              style={{
                ...chartBarStyle,
                width: `${(item.value / max) * 100}%`,
              }}
            />
          </div>

          {item.secondary ? (
            <div style={comparisonSecondaryStyle}>{item.secondary}</div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function formatNumber(value: number) {
  return value.toLocaleString("pt-BR");
}

const sectionStyle: React.CSSProperties = {
  background: "#111",
  border: "1px solid #2a2a2a",
  borderRadius: 12,
  padding: 20,
  marginBottom: 24,
};

const sectionTitleStyle: React.CSSProperties = {
  marginTop: 0,
  marginBottom: 16,
  fontSize: 22,
};

const topCardsGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: 12,
};

const bigStatCardStyle: React.CSSProperties = {
  background: "#111",
  border: "1px solid #2a2a2a",
  borderRadius: 14,
  padding: 18,
};

const bigStatTitleStyle: React.CSSProperties = {
  color: "#aaaaaa",
  fontSize: 14,
  marginBottom: 8,
};

const bigStatValueStyle: React.CSSProperties = {
  fontSize: 30,
  fontWeight: "bold",
  marginBottom: 6,
};

const bigStatSubtitleStyle: React.CSSProperties = {
  color: "#8f8f8f",
  fontSize: 12,
};

const twoColumnsStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 16,
  marginBottom: 24,
};

const panelStyle: React.CSSProperties = {
  background: "#111",
  border: "1px solid #2a2a2a",
  borderRadius: 12,
  padding: 18,
};

const formStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: 12,
};

const formButtonRowStyle: React.CSSProperties = {
  gridColumn: "1 / -1",
  display: "flex",
  justifyContent: "flex-end",
};

const inputStyle: React.CSSProperties = {
  padding: 12,
  borderRadius: 8,
  border: "1px solid #333",
  background: "#1a1a1a",
  color: "#fff",
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  gridColumn: "1 / -1",
  minHeight: 90,
  resize: "vertical",
};

const buttonStyle: React.CSSProperties = {
  padding: "12px 14px",
  borderRadius: 8,
  border: "none",
  background: "#fff",
  color: "#111",
  fontWeight: "bold",
  cursor: "pointer",
};

const secondaryButtonStyle: React.CSSProperties = {
  padding: "12px 14px",
  borderRadius: 8,
  border: "1px solid #333",
  background: "transparent",
  color: "#fff",
  fontWeight: "bold",
  cursor: "pointer",
};

const dangerButtonStyle: React.CSSProperties = {
  padding: "12px 14px",
  borderRadius: 8,
  border: "none",
  background: "#c0392b",
  color: "#fff",
  fontWeight: "bold",
  cursor: "pointer",
};

const emptyBoxStyle: React.CSSProperties = {
  padding: 20,
  borderRadius: 12,
  background: "#111",
  border: "1px solid #2a2a2a",
  color: "#aaa",
};

const listStyle: React.CSSProperties = {
  display: "grid",
  gap: 12,
};

const cardStyle: React.CSSProperties = {
  background: "#1a1a1a",
  border: "1px solid #2a2a2a",
  borderRadius: 10,
  padding: 16,
};

const cardHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 12,
  marginBottom: 12,
};

const cardTitleStyle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: "bold",
  marginBottom: 4,
};

const badgeStyle: React.CSSProperties = {
  padding: "6px 10px",
  borderRadius: 999,
  background: "#2a2a2a",
  fontSize: 12,
  whiteSpace: "nowrap",
};

const metaStyle: React.CSSProperties = {
  color: "#bdbdbd",
  fontSize: 13,
  marginBottom: 6,
};

const statsGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
  gap: 10,
  marginBottom: 14,
};

const statCardStyle: React.CSSProperties = {
  background: "#111",
  border: "1px solid #2a2a2a",
  borderRadius: 10,
  padding: 12,
};

const statLabelStyle: React.CSSProperties = {
  fontSize: 12,
  color: "#aaa",
  marginBottom: 6,
};

const statValueStyle: React.CSSProperties = {
  fontSize: 20,
  fontWeight: "bold",
};

const notesStyle: React.CSSProperties = {
  marginBottom: 12,
  color: "#e0e0e0",
  lineHeight: 1.5,
};

const actionsStyle: React.CSSProperties = {
  display: "flex",
  gap: 10,
  marginTop: 14,
  flexWrap: "wrap",
};

const mutedTextStyle: React.CSSProperties = {
  color: "#aaaaaa",
};

const chartListStyle: React.CSSProperties = {
  display: "grid",
  gap: 12,
};

const comparisonItemStyle: React.CSSProperties = {
  display: "grid",
  gap: 8,
};

const comparisonHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  alignItems: "center",
};

const chartTrackStyle: React.CSSProperties = {
  width: "100%",
  height: 12,
  background: "#1f1f1f",
  borderRadius: 999,
  overflow: "hidden",
  border: "1px solid #2a2a2a",
};

const chartBarStyle: React.CSSProperties = {
  height: "100%",
  borderRadius: 999,
  background: "#ffffff",
};

const chartValueStyle: React.CSSProperties = {
  textAlign: "right",
  color: "#ffffff",
  fontWeight: "bold",
  fontSize: 13,
};

const comparisonSecondaryStyle: React.CSSProperties = {
  color: "#9d9d9d",
  fontSize: 12,
};