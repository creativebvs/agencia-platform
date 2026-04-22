"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Client = {
  id: string;
  name: string;
};

export default function RegisterPage() {
  const router = useRouter();

  const [clients, setClients] = useState<Client[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "creative",
    clientId: "",
  });

  useEffect(() => {
    async function loadClients() {
      try {
        const response = await fetch("/api/clients", {
          cache: "no-store",
        });

        const data = await response.json();
        setClients(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Erro ao carregar clientes:", error);
      }
    }

    loadClients();
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.name.trim() || !form.email.trim() || !form.password) {
      alert("Preencha nome, email e senha.");
      return;
    }

    if (form.role === "client" && !form.clientId) {
      alert("Selecione um cliente para o usuário client.");
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch("/api/auth/register", {
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

      alert("Usuário criado com sucesso.");
      router.replace("/login");
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Erro ao criar usuário.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main style={mainStyle}>
      <div style={cardStyle}>
        <h1 style={titleStyle}>Criar usuário</h1>
        <p style={subtitleStyle}>
          Cadastre um admin, creative ou client.
        </p>

        <form onSubmit={handleSubmit} style={formStyle}>
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

          <button type="submit" disabled={submitting} style={buttonStyle}>
            {submitting ? "Criando..." : "Criar usuário"}
          </button>
        </form>

        <a href="/login" style={linkStyle}>
          Voltar para login
        </a>
      </div>
    </main>
  );
}

const mainStyle: React.CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#0b0b0b",
  padding: 24,
};

const cardStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: 420,
  background: "#111",
  border: "1px solid #2a2a2a",
  borderRadius: 12,
  padding: 24,
  color: "#fff",
};

const titleStyle: React.CSSProperties = {
  fontSize: 28,
  marginBottom: 8,
};

const subtitleStyle: React.CSSProperties = {
  color: "#aaa",
  marginBottom: 20,
};

const formStyle: React.CSSProperties = {
  display: "grid",
  gap: 12,
};

const inputStyle: React.CSSProperties = {
  padding: 12,
  borderRadius: 8,
  border: "1px solid #333",
  background: "#1a1a1a",
  color: "#fff",
};

const buttonStyle: React.CSSProperties = {
  padding: "12px 16px",
  borderRadius: 8,
  border: "none",
  background: "#fff",
  color: "#111",
  fontWeight: "bold",
  cursor: "pointer",
};

const linkStyle: React.CSSProperties = {
  display: "inline-block",
  marginTop: 16,
  color: "#fff",
  textDecoration: "underline",
};