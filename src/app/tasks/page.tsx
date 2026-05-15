"use client";

import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import { useCurrentUser } from "@/hooks/useCurrentUser";

type Client = {
  id: string;
  name: string;
};

type Content = {
  id: string;
  title: string;
  type: string;
  status: string;
  clientId: string;
  client?: Client | null;
};

type Task = {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  priority?: string | null;
  dueDate?: string | null;
  assignee?: string | null;
  client?: Client | null;
  content?: Content | null;
  clientId?: string | null;
  contentId?: string | null;
};

type TaskForm = {
  title: string;
  clientId: string;
  contentId: string;
  description: string;
  priority: string;
  dueDate: string;
  assignee: string;
};

const columns = ["todo", "doing", "done"] as const;

const initialForm: TaskForm = {
  title: "",
  clientId: "",
  contentId: "",
  description: "",
  priority: "medium",
  dueDate: "",
  assignee: "",
};

export default function TasksPage() {
  const { user, loading: userLoading } = useCurrentUser({
    redirectToLogin: true,
  });

  const [tasks, setTasks] = useState<Task[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [contents, setContents] = useState<Content[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [movingTaskId, setMovingTaskId] = useState<string | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState<TaskForm>(initialForm);

  async function loadData() {
    try {
      setLoading(true);

      const [tasksRes, clientsRes, contentsRes] = await Promise.all([
        fetch("/api/tasks", {
          credentials: "include",
          cache: "no-store",
        }),
        fetch("/api/clients", {
          credentials: "include",
          cache: "no-store",
        }),
        fetch("/api/contents", {
          credentials: "include",
          cache: "no-store",
        }),
      ]);

      const [tasksData, clientsData, contentsData] = await Promise.all([
        tasksRes.json(),
        clientsRes.json(),
        contentsRes.json(),
      ]);

      if (!tasksRes.ok) {
        throw new Error(tasksData?.message || "Erro ao carregar tarefas.");
      }

      if (!clientsRes.ok) {
        throw new Error(clientsData?.message || "Erro ao carregar clientes.");
      }

      if (!contentsRes.ok) {
        throw new Error(
          contentsData?.message || "Erro ao carregar conteúdos."
        );
      }

      setTasks(Array.isArray(tasksData) ? tasksData : []);
      setClients(Array.isArray(clientsData) ? clientsData : []);
      setContents(Array.isArray(contentsData) ? contentsData : []);
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!userLoading && user) {
      loadData();
    }
  }, [userLoading, user]);

  const availableContents = useMemo(() => {
    if (!form.clientId) return [];

    return contents.filter((content) => {
      const contentClientId = content.clientId || content.client?.id;
      return contentClientId === form.clientId;
    });
  }, [contents, form.clientId]);

  const visibleTasks = useMemo(() => {
    if (!user) return [];

    if (user.role === "client" && user.client?.id) {
      return tasks.filter((task) => task.client?.id === user.client?.id);
    }

    return tasks;
  }, [tasks, user]);

  async function createTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

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
        credentials: "include",
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Erro ao criar tarefa.");
      }

      setForm(initialForm);
      await loadData();
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Erro ao criar tarefa.");
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
        credentials: "include",
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Erro ao mover tarefa.");
      }

      await loadData();
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Erro ao mover tarefa.");
    } finally {
      setMovingTaskId(null);
    }
  }

  async function deleteTask(taskId: string) {
    const confirmed = window.confirm(
      "Tem certeza que deseja excluir esta tarefa?"
    );

    if (!confirmed) return;

    try {
      setDeletingTaskId(taskId);

      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Erro ao excluir tarefa.");
      }

      await loadData();
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Erro ao excluir tarefa.");
    } finally {
      setDeletingTaskId(null);
    }
  }

  function updateForm(field: keyof TaskForm, value: string) {
    setForm((current) => {
      if (field === "clientId") {
        return {
          ...current,
          clientId: value,
          contentId: "",
        };
      }

      return {
        ...current,
        [field]: value,
      };
    });
  }

  if (userLoading || !user) {
    return null;
  }

  return (
    <AppShell
      title="Tarefas"
      subtitle="Kanban de tarefas por cliente e conteúdo vinculado."
    >
      {user.role !== "client" && (
        <form onSubmit={createTask} style={formStyle}>
          <input
            placeholder="Nova tarefa"
            value={form.title}
            onChange={(event) => updateForm("title", event.target.value)}
            style={inputStyle}
          />

          <select
            value={form.clientId}
            onChange={(event) => updateForm("clientId", event.target.value)}
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
            value={form.contentId}
            onChange={(event) => updateForm("contentId", event.target.value)}
            style={inputStyle}
            disabled={!form.clientId}
          >
            <option value="">
              {form.clientId
                ? "Sem conteúdo vinculado"
                : "Escolha um cliente primeiro"}
            </option>

            {availableContents.map((content) => (
              <option key={content.id} value={content.id}>
                {content.title} • {getContentStatusLabel(content.status)}
              </option>
            ))}
          </select>

          <select
            value={form.priority}
            onChange={(event) => updateForm("priority", event.target.value)}
            style={inputStyle}
          >
            <option value="low">Prioridade baixa</option>
            <option value="medium">Prioridade média</option>
            <option value="high">Prioridade alta</option>
          </select>

          <input
            placeholder="Responsável"
            value={form.assignee}
            onChange={(event) => updateForm("assignee", event.target.value)}
            style={inputStyle}
          />

          <input
            type="date"
            value={form.dueDate}
            onChange={(event) => updateForm("dueDate", event.target.value)}
            style={inputStyle}
          />

          <input
            placeholder="Descrição"
            value={form.description}
            onChange={(event) => updateForm("description", event.target.value)}
            style={{ ...inputStyle, gridColumn: "1 / -2" }}
          />

          <button type="submit" disabled={submitting} style={buttonStyle}>
            {submitting ? "Criando..." : "Criar"}
          </button>
        </form>
      )}

      {loading ? (
        <div style={loadingBoxStyle}>Carregando tarefas...</div>
      ) : (
        <div style={boardStyle}>
          {columns.map((column) => (
            <div key={column} style={columnStyle}>
              <h3 style={columnTitleStyle}>{getColumnLabel(column)}</h3>

              {visibleTasks.filter((task) => task.status === column).length ===
                0 && <div style={emptyColumnStyle}>Nenhuma tarefa.</div>}

              {visibleTasks
                .filter((task) => task.status === column)
                .map((task) => (
                  <div key={task.id} style={cardStyle}>
                    <strong style={{ display: "block", marginBottom: 8 }}>
                      {task.title}
                    </strong>

                    <div style={metaTextStyle}>
                      Cliente: {task.client?.name || "Sem cliente"}
                    </div>

                    <div style={metaTextStyle}>
                      Conteúdo: {task.content?.title || "Sem vínculo"}
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
                        {column !== "todo" && (
                          <button
                            type="button"
                            onClick={() => moveTask(task.id, "todo")}
                            disabled={movingTaskId === task.id}
                            style={smallButtonStyle}
                          >
                            ← TODO
                          </button>
                        )}

                        {column !== "doing" && (
                          <button
                            type="button"
                            onClick={() => moveTask(task.id, "doing")}
                            disabled={movingTaskId === task.id}
                            style={smallButtonStyle}
                          >
                            DOING
                          </button>
                        )}

                        {column !== "done" && (
                          <button
                            type="button"
                            onClick={() => moveTask(task.id, "done")}
                            disabled={movingTaskId === task.id}
                            style={smallButtonStyle}
                          >
                            DONE →
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => deleteTask(task.id)}
                          disabled={deletingTaskId === task.id}
                          style={dangerButtonStyle}
                        >
                          {deletingTaskId === task.id ? "..." : "Excluir"}
                        </button>
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
  if (status === "todo") return "A fazer";
  if (status === "doing") return "Em andamento";
  if (status === "done") return "Concluídas";
  return status.toUpperCase();
}

function getPriorityLabel(priority?: string | null) {
  if (priority === "low") return "Baixa";
  if (priority === "high") return "Alta";
  return "Média";
}

function getContentStatusLabel(status: string) {
  if (status === "draft") return "Rascunho";
  if (status === "in_review") return "Em revisão";
  if (status === "waiting_client") return "Aguardando cliente";
  if (status === "approved") return "Aprovado";
  if (status === "published") return "Publicado";
  if (status === "changes_requested") return "Ajustes solicitados";
  return status;
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
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 10,
  marginBottom: 24,
};

const inputStyle: React.CSSProperties = {
  padding: 10,
  borderRadius: 8,
  border: "1px solid #333",
  background: "#1a1a1a",
  color: "#fff",
  width: "100%",
  boxSizing: "border-box",
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
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: 16,
};

const columnStyle: React.CSSProperties = {
  background: "#111",
  padding: 12,
  borderRadius: 10,
  minHeight: 360,
  border: "1px solid #2a2a2a",
};

const columnTitleStyle: React.CSSProperties = {
  marginTop: 0,
  marginBottom: 12,
};

const emptyColumnStyle: React.CSSProperties = {
  padding: 12,
  borderRadius: 8,
  background: "#1a1a1a",
  color: "#777",
  border: "1px dashed #333",
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

const dangerButtonStyle: React.CSSProperties = {
  padding: "8px 10px",
  borderRadius: 8,
  border: "none",
  background: "#c0392b",
  color: "#fff",
  cursor: "pointer",
  fontWeight: "bold",
};