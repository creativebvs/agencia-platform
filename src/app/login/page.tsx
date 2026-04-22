"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.email.trim() || !form.password) {
      alert("Preencha email e senha.");
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Erro ao fazer login.");
      }

      router.replace("/");
      router.refresh();
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Erro ao fazer login.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main style={mainStyle}>
      <div style={cardStyle}>
        <h1 style={titleStyle}>Entrar</h1>
        <p style={subtitleStyle}>
          Faça login para acessar a plataforma.
        </p>

        <form onSubmit={handleSubmit} style={formStyle}>
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

          <button type="submit" disabled={submitting} style={buttonStyle}>
            {submitting ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <a href="/register" style={linkStyle}>
          Criar usuário
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