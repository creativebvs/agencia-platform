"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { useCurrentUser } from "@/hooks/useCurrentUser";

type Client = {
  id: string;
  name: string;
};

type UserItem = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "creative" | "client";
  client?: Client | null;
  createdAt: string;
};

export default function UsersPage() {
  const { user, loading: userLoading } = useCurrentUser({ redirectToLogin: true });

  const [users, setUsers] = useState<UserItem[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "creative",
    clientId: "",
  });

  async function loadData() {
    try {
      const [usersRes, clientsRes] = await Promise.all([
        fetch("/api/users", { cache: "no-store" }),
        fetch("/api/clients", { cache: "no-store" }),
      ]);

      const [usersData, clientsData] = await Promise.all([
        usersRes.json(),
        clientsRes.json(),
      ]);

      setUsers(Array.isArray(usersData) ? usersData : []);
      setClients(Array.isArray(clientsData) ? clientsData : []);
    } catch (error) {
      console.error("Erro ao carregar usuários:", error);
      alert("Erro ao carregar usuários.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!userLoading && user) {
      loadData();
    }
  }, [userLoading, user]);

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      alert("Preencha nome, email e senha.");
      return;
    }

    if (form.role === "client" && !form.clientId) {
      alert("Selecione um cliente para o usuário client.");
      return;
    }

    try {
      setCreating(true);

      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Erro ao criar usuário.");
      }

      setForm({
        name: "",
        email: "",
        password: "",
        role: "creative",
        clientId: "",
      });

      await loadData();
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Erro ao criar usuário.");
    } finally {
      setCreating(false);
    }
  }

  if (userLoading || !user) {
    return null;
  }

  if (user.role !== "admin") {
    return (
      <AppShell
        title="Usuários"
        subtitle="Gerenciamento interno de usuários."
      >
        <div style={emptyBoxStyle}>Você não tem permissão para acessar esta área.</div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Usuários"
      subtitle="Cadastro e visualização de usuários da plataforma."
    >
      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Novo usuário</h2>

        <form onSubmit={handleCreate} style={formStyle}>
          <input
            type="text"
            placeholder="Nome"
            value={form.name}
            onChange={(e) =>
              setForm((current) => ({
                ...current,
                name: e.target.value,
              }))
            }
            style={inputStyle}
          />

          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) =>
              setForm((current) => ({
                ...current,
                email: e.target.value,
              }))
            }
            style={inputStyle}
          />

          <input
            type="password"
            placeholder="Senha"
            value={form.password}
            onChange={(e) =>
              setForm((current) => ({
                ...current,
                password: e.target.value,
              }))
            }
            style={inputStyle}
          />

          <select
            value={form.role}
            onChange={(e) =>
              setForm((current) => ({
                ...current,
                role: e.target.value,
                clientId: e.target.value === "client" ? current.clientId : "",
              }))
            }
            style={inputStyle}
          >
            <option value="admin">Admin</option>
            <option value="creative">Creative</option>
            <option value="client">Client</option>
          </select>

          {form.role === "client" && (
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
          )}

          <div style={formButtonRowStyle}>
            <button type="submit" disabled={creating} style={buttonStyle}>
              {creating ? "Criando..." : "Criar usuário"}
            </button>
          </div>
        </form>
      </section>

      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Lista de usuários</h2>

        {loading ? (
          <div style={emptyBoxStyle}>Carregando usuários...</div>
        ) : users.length === 0 ? (
          <div style={emptyBoxStyle}>Nenhum usuário cadastrado.</div>
        ) : (
          <div style={listStyle}>
            {users.map((item) => (
              <div key={item.id} style={cardStyle}>
                <div style={cardHeaderStyle}>
                  <div>
                    <div style={cardTitleStyle}>{item.name}</div>
                    <div style={metaStyle}>{item.email}</div>
                  </div>

                  <div style={badgeStyle}>{item.role}</div>
                </div>

                <div style={metaStyle}>
                  Cliente: {item.client?.name || "Não vinculado"}
                </div>

                <div style={metaStyle}>
                  Criado em: {new Date(item.createdAt).toLocaleDateString("pt-BR")}
                </div>
              </div>
            ))}
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

const buttonStyle: React.CSSProperties = {
  padding: "12px 14px",
  borderRadius: 8,
  border: "none",
  background: "#fff",
  color: "#111",
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
  marginBottom: 10,
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