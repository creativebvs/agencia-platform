"use client";

import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import { useCurrentUser } from "@/hooks/useCurrentUser";

type Client = {
  id: string;
  name: string;
};

type ContentItem = {
  id: string;
  title: string;
  type: string;
  status: string;
  scheduledDate?: string | null;
  client: Client;
};

type DayCell = {
  date: Date;
  isCurrentMonth: boolean;
};

export default function CalendarPage() {
  const { user, loading: userLoading } = useCurrentUser({ redirectToLogin: true });

  const [contents, setContents] = useState<ContentItem[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedClientId, setSelectedClientId] = useState("");

  async function loadData() {
    try {
      const contentsRes = await fetch("/api/contents", { cache: "no-store" });
      const contentsData = await contentsRes.json();

      const clientsRes = await fetch("/api/clients", { cache: "no-store" });
      const clientsData = await clientsRes.json();

      setContents(Array.isArray(contentsData) ? contentsData : []);
      setClients(Array.isArray(clientsData) ? clientsData : []);
    } catch (error) {
      console.error("Erro ao carregar calendário:", error);
      alert("Erro ao carregar calendário.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!userLoading && user) {
      loadData();
    }
  }, [userLoading, user]);

  const visibleContents = useMemo(() => {
    if (!user) return [];

    if (user.role === "client" && user.client?.id) {
      return contents.filter((item) => item.client?.id === user.client?.id);
    }

    return contents;
  }, [contents, user]);

  const filteredContents = useMemo(() => {
    return visibleContents.filter((item) => {
      if (!item.scheduledDate) return false;
      if (selectedClientId && item.client?.id !== selectedClientId) return false;
      return true;
    });
  }, [visibleContents, selectedClientId]);

  const monthLabel = useMemo(() => {
    return currentMonth.toLocaleDateString("pt-BR", {
      month: "long",
      year: "numeric",
    });
  }, [currentMonth]);

  const days = useMemo(() => {
    return buildMonthGrid(currentMonth);
  }, [currentMonth]);

  function goToPreviousMonth() {
    setCurrentMonth((current) => {
      return new Date(current.getFullYear(), current.getMonth() - 1, 1);
    });
  }

  function goToNextMonth() {
    setCurrentMonth((current) => {
      return new Date(current.getFullYear(), current.getMonth() + 1, 1);
    });
  }

  if (userLoading || !user) {
    return null;
  }

  return (
    <AppShell
      title="Calendário"
      subtitle="Calendário editorial dos conteúdos agendados."
    >
      <section style={toolbarStyle}>
        <div style={monthNavStyle}>
          <button type="button" onClick={goToPreviousMonth} style={navButtonStyle}>
            ←
          </button>

          <div style={monthLabelStyle}>{capitalize(monthLabel)}</div>

          <button type="button" onClick={goToNextMonth} style={navButtonStyle}>
            →
          </button>
        </div>

        {user.role !== "client" && (
          <div>
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              style={selectStyle}
            >
              <option value="">Todos os clientes</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </section>

      {loading ? (
        <div style={loadingBoxStyle}>Carregando calendário...</div>
      ) : (
        <>
          <div style={weekHeaderStyle}>
            {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => (
              <div key={day} style={weekHeaderCellStyle}>
                {day}
              </div>
            ))}
          </div>

          <div style={gridStyle}>
            {days.map((day) => {
              const items = getContentsForDay(filteredContents, day.date);
              const isToday = isSameDate(day.date, new Date());

              return (
                <div
                  key={day.date.toISOString()}
                  style={{
                    ...dayCellStyle,
                    opacity: day.isCurrentMonth ? 1 : 0.35,
                    borderColor: isToday ? "#ffffff" : "#2a2a2a",
                  }}
                >
                  <div style={dayHeaderStyle}>
                    <span style={dayNumberStyle}>{day.date.getDate()}</span>
                  </div>

                  <div style={eventsListStyle}>
                    {items.length === 0 ? (
                      <span style={emptyTextStyle}>—</span>
                    ) : (
                      items.map((item) => (
                        <div
                          key={item.id}
                          style={{
                            ...eventCardStyle,
                            borderLeft: `4px solid ${getStatusColor(item.status)}`,
                          }}
                        >
                          <div style={eventTitleStyle}>{item.title}</div>
                          <div style={eventMetaStyle}>
                            {item.client?.name} • {item.type}
                          </div>
                          <div style={eventMetaStyle}>
                            {getStatusLabel(item.status)}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <section style={legendSectionStyle}>
            <div style={legendTitleStyle}>Legenda de status</div>

            <div style={legendItemsStyle}>
              <Legend color="#7f8c8d" label="Rascunho" />
              <Legend color="#2980b9" label="Em revisão" />
              <Legend color="#f39c12" label="Aguardando cliente" />
              <Legend color="#27ae60" label="Aprovado" />
              <Legend color="#8e44ad" label="Publicado" />
              <Legend color="#d35400" label="Ajustes solicitados" />
            </div>
          </section>
        </>
      )}
    </AppShell>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div style={legendItemStyle}>
      <span
        style={{
          ...legendDotStyle,
          backgroundColor: color,
        }}
      />
      <span>{label}</span>
    </div>
  );
}

function buildMonthGrid(baseDate: Date): DayCell[] {
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const startDayOfWeek = firstDayOfMonth.getDay();

  const gridStart = new Date(year, month, 1 - startDayOfWeek);

  const result: DayCell[] = [];

  for (let i = 0; i < 42; i += 1) {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + i);

    result.push({
      date,
      isCurrentMonth: date.getMonth() === month,
    });
  }

  return result;
}

function getContentsForDay(contents: ContentItem[], targetDate: Date) {
  return contents.filter((item) => {
    if (!item.scheduledDate) return false;

    const date = new Date(item.scheduledDate);

    if (Number.isNaN(date.getTime())) return false;

    return (
      date.getDate() === targetDate.getDate() &&
      date.getMonth() === targetDate.getMonth() &&
      date.getFullYear() === targetDate.getFullYear()
    );
  });
}

function isSameDate(a: Date, b: Date) {
  return (
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear()
  );
}

function getStatusLabel(status: string) {
  if (status === "draft") return "Rascunho";
  if (status === "in_review") return "Em revisão";
  if (status === "approved") return "Aprovado";
  if (status === "published") return "Publicado";
  if (status === "waiting_client") return "Aguardando cliente";
  if (status === "changes_requested") return "Ajustes solicitados";
  return status;
}

function getStatusColor(status: string) {
  if (status === "draft") return "#7f8c8d";
  if (status === "in_review") return "#2980b9";
  if (status === "approved") return "#27ae60";
  if (status === "published") return "#8e44ad";
  if (status === "waiting_client") return "#f39c12";
  if (status === "changes_requested") return "#d35400";
  return "#95a5a6";
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

const toolbarStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
  marginBottom: 20,
};

const monthNavStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
};

const navButtonStyle: React.CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: 10,
  border: "1px solid #333",
  background: "#1a1a1a",
  color: "#fff",
  cursor: "pointer",
  fontSize: 18,
};

const monthLabelStyle: React.CSSProperties = {
  fontSize: 20,
  fontWeight: "bold",
  minWidth: 220,
};

const selectStyle: React.CSSProperties = {
  padding: 10,
  borderRadius: 8,
  border: "1px solid #333",
  background: "#1a1a1a",
  color: "#fff",
  minWidth: 220,
};

const loadingBoxStyle: React.CSSProperties = {
  padding: 20,
  borderRadius: 12,
  border: "1px solid #2a2a2a",
  background: "#111",
  color: "#aaa",
};

const weekHeaderStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(7, 1fr)",
  gap: 10,
  marginBottom: 10,
};

const weekHeaderCellStyle: React.CSSProperties = {
  background: "#111",
  border: "1px solid #2a2a2a",
  borderRadius: 10,
  padding: "10px 12px",
  textAlign: "center",
  fontWeight: "bold",
  color: "#d0d0d0",
};

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(7, 1fr)",
  gap: 10,
};

const dayCellStyle: React.CSSProperties = {
  minHeight: 160,
  background: "#111",
  border: "1px solid #2a2a2a",
  borderRadius: 12,
  padding: 10,
  display: "flex",
  flexDirection: "column",
};

const dayHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 8,
};

const dayNumberStyle: React.CSSProperties = {
  fontWeight: "bold",
  fontSize: 16,
};

const eventsListStyle: React.CSSProperties = {
  display: "grid",
  gap: 8,
};

const eventCardStyle: React.CSSProperties = {
  background: "#1a1a1a",
  border: "1px solid #2a2a2a",
  borderRadius: 8,
  padding: 8,
};

const eventTitleStyle: React.CSSProperties = {
  fontWeight: "bold",
  fontSize: 13,
  marginBottom: 4,
  lineHeight: 1.3,
};

const eventMetaStyle: React.CSSProperties = {
  fontSize: 11,
  color: "#bdbdbd",
  lineHeight: 1.3,
};

const emptyTextStyle: React.CSSProperties = {
  fontSize: 12,
  color: "#666",
};

const legendSectionStyle: React.CSSProperties = {
  marginTop: 24,
  background: "#111",
  border: "1px solid #2a2a2a",
  borderRadius: 12,
  padding: 16,
};

const legendTitleStyle: React.CSSProperties = {
  fontWeight: "bold",
  marginBottom: 12,
};

const legendItemsStyle: React.CSSProperties = {
  display: "flex",
  gap: 16,
  flexWrap: "wrap",
};

const legendItemStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  color: "#ddd",
  fontSize: 14,
};

const legendDotStyle: React.CSSProperties = {
  width: 12,
  height: 12,
  borderRadius: 999,
  display: "inline-block",
};