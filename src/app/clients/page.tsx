"use client";

import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import { useCurrentUser } from "@/hooks/useCurrentUser";

type Client = {
  id: string;
  name: string;
  officialContact?: string | null;
  phone?: string | null;
  instagram?: string | null;
  address?: string | null;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

type ClientForm = {
  name: string;
  officialContact: string;
  phone: string;
  instagram: string;
  address: string;
  notes: string;
};

const initialForm: ClientForm = {
  name: "",
  officialContact: "",
  phone: "",
  instagram: "",
  address: "",
  notes: "",
};

export default function ClientsPage() {
  const { user, loading: userLoading } = useCurrentUser({
    redirectToLogin: true,
  });

  const [clients, setClients] = useState<Client[]>([]);
  const [form, setForm] = useState<ClientForm>(initialForm);
  const [loading, setLoading] = useState(true);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingForm, setEditingForm] = useState<ClientForm>(initialForm);

  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  async function loadClients() {
    try {
      setLoading(true);

      const res = await fetch("/api/clients", {
        credentials: "include",
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Erro ao carregar clientes.");
      }

      setClients(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erro ao carregar clientes:", error);
      alert(
        error instanceof Error ? error.message : "Erro ao carregar clientes."
      );
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

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.name.trim()) {
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
        credentials: "include",
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Erro ao criar cliente.");
      }

      setForm(initialForm);
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
    setEditingForm({
      name: client.name || "",
      officialContact: client.officialContact || "",
      phone: client.phone || "",
      instagram: client.instagram || "",
      address: client.address || "",
      notes: client.notes || "",
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditingForm(initialForm);
  }

  async function handleSave(clientId: string) {
    if (!editingForm.name.trim()) {
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
        credentials: "include",
        body: JSON.stringify(editingForm),
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
      "Tem certeza que deseja excluir este cliente? Conteúdos, tarefas e relatórios relacionados podem ser afetados."
    );

    if (!confirmed) return;

    try {
      setDeletingId(clientId);

      const response = await fetch(`/api/clients/${clientId}`, {
        method: "DELETE",
        credentials: "include",
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

  function updateForm(field: keyof ClientForm, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateEditingForm(field: keyof ClientForm, value: string) {
    setEditingForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  if (userLoading || !user) {
    return null;
  }

  return (
    <AppShell
      title="Clientes"
      subtitle="Cadastro, dados de contato e informações comerciais dos clientes."
    >
      {user.role === "admin" && (
        <section style={sectionStyle}>
          <h2 style={sectionTitleStyle}>Novo cliente</h2>

          <form onSubmit={handleCreate} style={formStyle}>
            <input
              placeholder="Nome do cliente"
              value={form.name}
              onChange={(event) => updateForm("name", event.target.value)}
              style={inputStyle}
            />

            <input
              placeholder="Contato oficial"
              value={form.officialContact}
              onChange={(event) =>
                updateForm("officialContact", event.target.value)
              }
              style={inputStyle}
            />

            <input
              placeholder="WhatsApp / telefone"
              value={form.phone}
              onChange={(event) => updateForm("phone", event.target.value)}
              style={inputStyle}
            />

            <input
              placeholder="@ do Instagram"
              value={form.instagram}
              onChange={(event) =>
                updateForm("instagram", event.target.value)
              }
              style={inputStyle}
            />

            <input
              placeholder="Endereço"
              value={form.address}
              onChange={(event) => updateForm("address", event.target.value)}
              style={{ ...inputStyle, gridColumn: "1 / -1" }}
            />

            <textarea
              placeholder="Observações sobre o cliente"
              value={form.notes}
              onChange={(event) => updateForm("notes", event.target.value)}
              style={textareaStyle}
            />

            <div style={formActionsStyle}>
              <button type="submit" disabled={creating} style={buttonStyle}>
                {creating ? "Criando..." : "Criar cliente"}
              </button>
            </div>
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
                      <div style={editGridStyle}>
                        <input
                          placeholder="Nome do cliente"
                          value={editingForm.name}
                          onChange={(event) =>
                            updateEditingForm("name", event.target.value)
                          }
                          style={inputStyle}
                        />

                        <input
                          placeholder="Contato oficial"
                          value={editingForm.officialContact}
                          onChange={(event) =>
                            updateEditingForm(
                              "officialContact",
                              event.target.value
                            )
                          }
                          style={inputStyle}
                        />

                        <input
                          placeholder="WhatsApp / telefone"
                          value={editingForm.phone}
                          onChange={(event) =>
                            updateEditingForm("phone", event.target.value)
                          }
                          style={inputStyle}
                        />

                        <input
                          placeholder="@ do Instagram"
                          value={editingForm.instagram}
                          onChange={(event) =>
                            updateEditingForm("instagram", event.target.value)
                          }
                          style={inputStyle}
                        />

                        <input
                          placeholder="Endereço"
                          value={editingForm.address}
                          onChange={(event) =>
                            updateEditingForm("address", event.target.value)
                          }
                          style={{ ...inputStyle, gridColumn: "1 / -1" }}
                        />

                        <textarea
                          placeholder="Observações"
                          value={editingForm.notes}
                          onChange={(event) =>
                            updateEditingForm("notes", event.target.value)
                          }
                          style={textareaStyle}
                        />
                      </div>

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
                      <div style={cardHeaderStyle}>
                        <div>
                          <div style={clientNameStyle}>{client.name}</div>

                          <div style={metaStyle}>
                            Contato:{" "}
                            {client.officialContact?.trim() ||
                              "Não informado"}
                          </div>

                          <div style={metaStyle}>
                            WhatsApp/telefone:{" "}
                            {client.phone?.trim() || "Não informado"}
                          </div>

                          <div style={metaStyle}>
                            Instagram:{" "}
                            {client.instagram?.trim() || "Não informado"}
                          </div>

                          <div style={metaStyle}>
                            Endereço: {client.address?.trim() || "Não informado"}
                          </div>
                        </div>
                      </div>

                      {client.notes?.trim() ? (
                        <div style={notesBoxStyle}>{client.notes}</div>
                      ) : (
                        <div style={notesBoxStyle}>
                          Nenhuma observação cadastrada.
                        </div>
                      )}

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

const formStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 12,
};

const editGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 12,
};

const inputStyle: React.CSSProperties = {
  padding: 12,
  borderRadius: 8,
  border: "1px solid #333",
  background: "#1a1a1a",
  color: "#fff",
  width: "100%",
  boxSizing: "border-box",
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  gridColumn: "1 / -1",
  minHeight: 90,
  resize: "vertical",
};

const formActionsStyle: React.CSSProperties = {
  gridColumn: "1 / -1",
  display: "flex",
  justifyContent: "flex-end",
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
  padding: 16,
  borderRadius: 10,
  border: "1px solid #2a2a2a",
};

const cardHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  flexWrap: "wrap",
};

const clientNameStyle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: "bold",
  marginBottom: 10,
};

const metaStyle: React.CSSProperties = {
  color: "#bdbdbd",
  fontSize: 13,
  marginBottom: 6,
};

const notesBoxStyle: React.CSSProperties = {
  marginTop: 12,
  padding: 12,
  borderRadius: 8,
  background: "#111",
  border: "1px solid #2a2a2a",
  color: "#ddd",
  lineHeight: 1.5,
};

const actionsStyle: React.CSSProperties = {
  display: "flex",
  gap: 10,
  marginTop: 14,
  flexWrap: "wrap",
};