"use client";

import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import { useCurrentUser } from "@/hooks/useCurrentUser";

type Client = {
  id: string;
  name: string;
};

type Task = {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  priority?: string | null;
  dueDate?: string | null;
  assignee?: string | null;
  client: Client;
};

const columns = ["todo", "doing", "done"] as const;

export default function TasksPage() {
  const { user, loading: userLoading } = useCurrentUser({ redirectToLogin: true });

  const [tasks, setTasks] = useState<Task[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [movingTaskId, setMovingTaskId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    title: "",
    clientId: "",
    description: "",
    priority: "medium",
    dueDate: "",
    assignee: "",
  });

  async function loadData() {
    try {
      const tasksRes = await fetch("/api/tasks", { cache: "no-store" });
      const tasksData = await tasksRes.json();

      const clientsRes = await fetch("/api/clients", { cache: "no-store" });
      const clientsData = await clientsRes.json();

      setTasks(Array.isArray(tasksData) ? tasksData : []);
      setClients(Array.isArray(clientsData) ? clientsData : []);
    } catch (error) {
      console.error(error);
      alert("Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!userLoading && user) {
      loadData();
    }
  }, [userLoading, user]);

  async function createTask(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!form.title.trim() || !form.clientId) {
      alert("Preencha o título e selecione um cliente.");
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Erro ao criar tarefa.");
      }

      setForm({
        title: "",
        clientId: "",
        description: "",
        priority: "medium",
        dueDate: "",
        assignee: "",
      });

      await loadData();
    } catch (error) {
      console.error(error);
      alert("Erro ao criar tarefa.");
    } finally {
      setSubmitting(false);
    }
  }

  async function moveTask(id: string, newStatus: string) {
    try {
      setMovingTaskId(id);

      const response = await fetch(`/api/tasks/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Erro ao mover tarefa.");
      }

      await loadData();
    } catch (error) {
      console.error(error);
      alert("Erro ao mover tarefa.");
    } finally {
      setMovingTaskId(null);
    }
  }

  const visibleTasks = useMemo(() => {
    if (!user) return [];

    if (user.role === "client" && user.client?.id) {
      return tasks.filter((task) => task.client?.id === user.client?.id);
    }

    return tasks;
  }, [tasks, user]);

  if (userLoading || !user) {
    return null;
  }

  return (
    <AppShell
      title="Tarefas"
      subtitle="Kanban de tarefas por cliente."
    >
      {user.role !== "client" && (
        <form onSubmit={createTask} style={formStyle}>
          <input
            placeholder="Nova tarefa"
            value={form.title}
            onChange={(e) =>
              setForm({ ...form, title: e.target.value })
            }
            style={inputStyle}
          />

          <select
            value={form.clientId}
            onChange={(e) =>
              setForm({ ...form, clientId: e.target.value })
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

          <select
            value={form.priority}
            onChange={(e) =>
              setForm({ ...form, priority: e.target.value })
            }
            style={inputStyle}
          >
            <option value="low">Prioridade baixa</option>
            <option value="medium">Prioridade média</option>
            <option value="high">Prioridade alta</option>
          </select>

          <input
            placeholder="Responsável"
            value={form.assignee}
            onChange={(e) =>
              setForm({ ...form, assignee: e.target.value })
            }
            style={inputStyle}
          />

          <input
            type="date"
            value={form.dueDate}
            onChange={(e) =>
              setForm({ ...form, dueDate: e.target.value })
            }
            style={inputStyle}
          />

          <input
            placeholder="Descrição"
            value={form.description}
            onChange={(e) =>
              setForm({ ...form, description: e.target.value })
            }
            style={{ ...inputStyle, gridColumn: "1 / -2" }}
          />

          <button
            type="submit"
            disabled={submitting}
            style={buttonStyle}
          >
            {submitting ? "Criando..." : "Criar"}
          </button>
        </form>
      )}

      {loading ? (
        <div style={loadingBoxStyle}>Carregando tarefas...</div>
      ) : (
        <div style={boardStyle}>
          {columns.map((col) => (
            <div key={col} style={columnStyle}>
              <h3 style={columnTitleStyle}>{getColumnLabel(col)}</h3>

              {visibleTasks
                .filter((task) => task.status === col)
                .map((task) => (
                  <div key={task.id} style={cardStyle}>
                    <strong style={{ display: "block", marginBottom: 8 }}>
                      {task.title}
                    </strong>

                    <div style={metaTextStyle}>
                      Cliente: {task.client?.name}
                    </div>

                    <div style={metaTextStyle}>
                      Prioridade: {getPriorityLabel(task.priority)}
                    </div>

                    <div style={metaTextStyle}>
                      Responsável: {task.assignee?.trim() || "Não definido"}
                    </div>

                    <div style={metaTextStyle}>
                      Prazo: {formatDate(task.dueDate)}
                    </div>

                    {task.description?.trim() ? (
                      <div style={descriptionStyle}>{task.description}</div>
                    ) : null}

                    {user.role !== "client" && (
                      <div style={actionsStyle}>
                        {col !== "todo" && (
                          <button
                            type="button"
                            onClick={() => moveTask(task.id, "todo")}
                            disabled={movingTaskId === task.id}
                            style={smallButtonStyle}
                          >
                            ← Todo
                          </button>
                        )}

                        {col !== "doing" && (
                          <button
                            type="button"
                            onClick={() => moveTask(task.id, "doing")}
                            disabled={movingTaskId === task.id}
                            style={smallButtonStyle}
                          >
                            Doing
                          </button>
                        )}

                        {col !== "done" && (
                          <button
                            type="button"
                            onClick={() => moveTask(task.id, "done")}
                            disabled={movingTaskId === task.id}
                            style={smallButtonStyle}
                          >
                            Done →
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}

function getColumnLabel(status: string) {
  if (status === "todo") return "TODO";
  if (status === "doing") return "DOING";
  if (status === "done") return "DONE";
  return status.toUpperCase();
}

function getPriorityLabel(priority?: string | null) {
  if (priority === "low") return "Baixa";
  if (priority === "high") return "Alta";
  return "Média";
}

function formatDate(date?: string | null) {
  if (!date) return "Sem prazo";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "Sem prazo";
  }

  return parsed.toLocaleDateString("pt-BR");
}

const formStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
  gap: 10,
  marginBottom: 24,
};

const inputStyle: React.CSSProperties = {
  padding: 10,
  borderRadius: 8,
  border: "1px solid #333",
  background: "#1a1a1a",
  color: "#fff",
};

const buttonStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 8,
  border: "none",
  background: "#fff",
  color: "#000",
  fontWeight: "bold",
  cursor: "pointer",
};

const loadingBoxStyle: React.CSSProperties = {
  padding: 20,
  borderRadius: 12,
  border: "1px solid #2a2a2a",
  background: "#111",
  color: "#aaa",
};

const boardStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: 16,
};

const columnStyle: React.CSSProperties = {
  background: "#111",
  padding: 12,
  borderRadius: 10,
  minHeight: 500,
  border: "1px solid #2a2a2a",
};

const columnTitleStyle: React.CSSProperties = {
  marginTop: 0,
  marginBottom: 12,
};

const cardStyle: React.CSSProperties = {
  background: "#1a1a1a",
  padding: 12,
  borderRadius: 8,
  marginTop: 10,
  border: "1px solid #2a2a2a",
};

const metaTextStyle: React.CSSProperties = {
  fontSize: 12,
  color: "#aaa",
  marginBottom: 4,
};

const descriptionStyle: React.CSSProperties = {
  marginTop: 10,
  fontSize: 13,
  color: "#d6d6d6",
  lineHeight: 1.4,
};

const actionsStyle: React.CSSProperties = {
  marginTop: 12,
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
};

const smallButtonStyle: React.CSSProperties = {
  padding: "8px 10px",
  borderRadius: 8,
  border: "1px solid #333",
  background: "#222",
  color: "#fff",
  cursor: "pointer",
};