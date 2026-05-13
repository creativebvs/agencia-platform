"use client";

import { useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("creativebvs@gmail.com");
  const [password, setPassword] = useState("123456");
  const [loading, setLoading] = useState(false);

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setLoading(true);

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        cache: "no-store",
        body: JSON.stringify({
          email,
          password,
        }),
      });

      let data: any = null;

      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (!res.ok) {
        alert(data?.message || "Erro ao fazer login.");
        return;
      }

      // Importante:
      // usamos navegação real para garantir que o cookie de sessão
      // já seja enviado na próxima requisição do dashboard.
      window.location.href = "/dashboard";
    } catch (error) {
      console.error("Erro ao fazer login:", error);
      alert("Erro ao fazer login.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={pageStyle}>
      <form onSubmit={handleLogin} style={cardStyle}>
        <h1 style={titleStyle}>Entrar</h1>

        <p style={subtitleStyle}>Faça login para acessar a plataforma.</p>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          style={inputStyle}
        />

        <input
          type="password"
          placeholder="Senha"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          style={inputStyle}
        />

        <button type="submit" disabled={loading} style={buttonStyle}>
          {loading ? "Entrando..." : "Entrar"}
        </button>

        <Link href="/register" style={linkStyle}>
          Criar usuário
        </Link>
      </form>
    </main>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#0b0b0b",
  color: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const cardStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: 420,
  background: "#111",
  border: "1px solid #222",
  borderRadius: 14,
  padding: 24,
  display: "flex",
  flexDirection: "column",
  gap: 12,
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 26,
};

const subtitleStyle: React.CSSProperties = {
  marginTop: 0,
  color: "#aaa",
};

const inputStyle: React.CSSProperties = {
  background: "#1a1a1a",
  border: "1px solid #333",
  color: "#fff",
  padding: 12,
  borderRadius: 8,
  outline: "none",
};

const buttonStyle: React.CSSProperties = {
  background: "#fff",
  color: "#111",
  border: "none",
  padding: 12,
  borderRadius: 8,
  fontWeight: "bold",
  cursor: "pointer",
};

const linkStyle: React.CSSProperties = {
  color: "#fff",
  fontSize: 14,
  marginTop: 4,
};