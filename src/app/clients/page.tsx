"use client";

import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import { useCurrentUser } from "@/hooks/useCurrentUser";

type Client = {
  id: string;
  name: string;
};

export default function ClientsPage() {
  const { user, loading: userLoading } = useCurrentUser({ redirectToLogin: true });

  const [clients, setClients] = useState<Client[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  async function loadClients() {
    try {
      const res = await fetch("/api/clients", { cache: "no-store" });
      const data = await res.json();
      setClients(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erro ao carregar clientes:", error);
      alert("Erro ao carregar clientes.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!userLoading && user) {
      loadClients();
    }
  }, [userLoading, user]);

  const visibleClients = useMemo(() => {
    if (!user) return [];

    if (user.role === "client" && user.client?.id) {
      return clients.filter((client) => client.id === user.client?.id);
    }

    return clients;
  }, [clients, user]);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!name.trim()) {
      alert("Digite o nome do cliente.");
      return;
    }

    try {
      setCreating(true);

      const response = await fetch("/api/clients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Erro ao criar cliente.");
      }

      setName("");
      await loadClients();
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Erro ao criar cliente.");
    } finally {
      setCreating(false);
    }
  }

  function startEdit(client: Client) {
    setEditingId(client.id);
    setEditingName(client.name);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditingName("");
  }

  async function handleSave(clientId: string) {
    if (!editingName.trim()) {
      alert("Digite o nome do cliente.");
      return;
    }

    try {
      setSavingId(clientId);

      const response = await fetch(`/api/clients/${clientId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: editingName }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Erro ao editar cliente.");
      }

      cancelEdit();
      await loadClients();
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Erro ao editar cliente.");
    } finally {
      setSavingId(null);
    }
  }

  async function handleDelete(clientId: string) {
    const confirmed = window.confirm(
      "Tem certeza que deseja excluir este cliente?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(clientId);

      const response = await fetch(`/api/clients/${clientId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Erro ao excluir cliente.");
      }

      if (editingId === clientId) {
        cancelEdit();
      }

      await loadClients();
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Erro ao excluir cliente.");
    } finally {
      setDeletingId(null);
    }
  }

  if (userLoading || !user) {
    return null;
  }

  return (
    <AppShell
      title="Clientes"
      subtitle="Cadastro, edição e exclusão de clientes."
    >
      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Usuário atual</h2>

        <div style={debugBoxStyle}>
          <div>
            <strong>Nome:</strong> {user.name}
          </div>
          <div>
            <strong>Email:</strong> {user.email}
          </div>
          <div>
            <strong>Role:</strong> {user.role}
          </div>
          <div>
            <strong>É admin?</strong> {user.role === "admin" ? "SIM" : "NÃO"}
          </div>
        </div>
      </section>

      {user.role === "admin" && (
        <section style={sectionStyle}>
          <h2 style={sectionTitleStyle}>Novo cliente</h2>

          <form onSubmit={handleCreate} style={formStyle}>
            <input
              placeholder="Nome do cliente"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={inputStyle}
            />

            <button type="submit" disabled={creating} style={buttonStyle}>
              {creating ? "Criando..." : "Criar"}
            </button>
          </form>
        </section>
      )}

      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Lista de clientes</h2>

        {loading ? (
          <div style={emptyBoxStyle}>Carregando clientes...</div>
        ) : visibleClients.length === 0 ? (
          <div style={emptyBoxStyle}>Nenhum cliente encontrado.</div>
        ) : (
          <div style={listStyle}>
            {visibleClients.map((client) => {
              const isEditing = editingId === client.id;
              const isSaving = savingId === client.id;
              const isDeleting = deletingId === client.id;

              return (
                <div key={client.id} style={cardStyle}>
                  {isEditing ? (
                    <>
                      <input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        style={inputStyle}
                      />

                      <div style={actionsStyle}>
                        <button
                          type="button"
                          onClick={() => handleSave(client.id)}
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
                      <div style={clientNameStyle}>{client.name}</div>

                      {user.role === "admin" && (
                        <div style={actionsStyle}>
                          <button
                            type="button"
                            onClick={() => startEdit(client)}
                            style={buttonStyle}
                          >
                            Editar
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(client.id)}
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

const debugBoxStyle: React.CSSProperties = {
  background: "#1a1a1a",
  border: "1px solid #2a2a2a",
  borderRadius: 10,
  padding: 14,
  lineHeight: 1.8,
};

const formStyle: React.CSSProperties = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
};

const inputStyle: React.CSSProperties = {
  padding: 12,
  borderRadius: 8,
  border: "1px solid #333",
  background: "#1a1a1a",
  color: "#fff",
  minWidth: 260,
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
  gap: 10,
};

const cardStyle: React.CSSProperties = {
  background: "#1a1a1a",
  padding: 14,
  borderRadius: 10,
  border: "1px solid #2a2a2a",
};

const clientNameStyle: React.CSSProperties = {
  fontSize: 16,
  fontWeight: "bold",
};

const actionsStyle: React.CSSProperties = {
  display: "flex",
  gap: 10,
  marginTop: 14,
  flexWrap: "wrap",
};