"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("creativebvs@gmail.com");
  const [password, setPassword] = useState("123456");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        const data = await res.json();

        if (data && data.id) {
          window.location.replace("/dashboard");
          return;
        }
      } catch (error) {
        console.error("Erro ao verificar sessão:", error);
      } finally {
        setCheckingSession(false);
      }
    }

    checkSession();
  }, []);

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

      window.location.replace("/dashboard");
    } catch (error) {
      console.error("Erro ao fazer login:", error);
      alert("Erro ao fazer login.");
    } finally {
      setLoading(false);
    }
  }

  if (checkingSession) {
    return (
      <main style={pageStyle}>
        <div style={loadingBoxStyle}>Carregando...</div>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <section style={wrapperStyle}>
        <div style={brandStyle}>
          <div style={logoStyle}>C</div>
          <div>
            <h1 style={brandTitleStyle}>Creative Platform</h1>
            <p style={brandSubtitleStyle}>
              Gestão de conteúdos, aprovações e clientes.
            </p>
          </div>
        </div>

        <form onSubmit={handleLogin} style={cardStyle}>
          <h2 style={titleStyle}>Entrar</h2>

          <p style={subtitleStyle}>Faça login para acessar a plataforma.</p>

          <label style={labelStyle}>
            Email
            <input
              type="email"
              placeholder="seuemail@exemplo.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              style={inputStyle}
              autoComplete="email"
            />
          </label>

          <label style={labelStyle}>
            Senha
            <input
              type="password"
              placeholder="Digite sua senha"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              style={inputStyle}
              autoComplete="current-password"
            />
          </label>

          <button type="submit" disabled={loading} style={buttonStyle}>
            {loading ? "Entrando..." : "Entrar"}
          </button>

          <Link href="/register" style={linkStyle}>
            Criar usuário
          </Link>
        </form>
      </section>
    </main>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  minHeight: "100dvh",
  background:
    "radial-gradient(circle at top, rgba(255,255,255,0.08), transparent 32%), #0b0b0b",
  color: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 16,
  boxSizing: "border-box",
};

const wrapperStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: 460,
  display: "flex",
  flexDirection: "column",
  gap: 20,
};

const brandStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 14,
};

const logoStyle: React.CSSProperties = {
  width: 44,
  height: 44,
  borderRadius: 14,
  background: "#fff",
  color: "#111",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 900,
  fontSize: 22,
  flexShrink: 0,
};

const brandTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "clamp(22px, 6vw, 30px)",
  lineHeight: 1.1,
};

const brandSubtitleStyle: React.CSSProperties = {
  margin: "4px 0 0",
  color: "#aaa",
  fontSize: 14,
  lineHeight: 1.4,
};

const loadingBoxStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: 360,
  background: "#111",
  border: "1px solid #222",
  borderRadius: 16,
  padding: 24,
  textAlign: "center",
};

const cardStyle: React.CSSProperties = {
  width: "100%",
  background: "rgba(17,17,17,0.96)",
  border: "1px solid #262626",
  borderRadius: 18,
  padding: "clamp(18px, 5vw, 28px)",
  display: "flex",
  flexDirection: "column",
  gap: 14,
  boxSizing: "border-box",
  boxShadow: "0 24px 80px rgba(0,0,0,0.35)",
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "clamp(24px, 7vw, 32px)",
  lineHeight: 1.1,
};

const subtitleStyle: React.CSSProperties = {
  margin: "0 0 4px",
  color: "#aaa",
  fontSize: 15,
  lineHeight: 1.5,
};

const labelStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
  color: "#ddd",
  fontSize: 14,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "#1a1a1a",
  border: "1px solid #333",
  color: "#fff",
  padding: "14px 12px",
  borderRadius: 10,
  outline: "none",
  fontSize: 16,
  boxSizing: "border-box",
};

const buttonStyle: React.CSSProperties = {
  width: "100%",
  background: "#fff",
  color: "#111",
  border: "none",
  padding: "14px 12px",
  borderRadius: 10,
  fontWeight: "bold",
  cursor: "pointer",
  fontSize: 16,
  marginTop: 4,
};

const linkStyle: React.CSSProperties = {
  color: "#fff",
  fontSize: 14,
  marginTop: 4,
  textAlign: "center",
};