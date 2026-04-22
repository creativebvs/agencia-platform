"use client";

import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import { useCurrentUser } from "@/hooks/useCurrentUser";

type Content = {
  id: string;
  title: string;
  type: string;
  status: string;
};

export default function ClientPage() {
  const { user, loading: userLoading } = useCurrentUser({ redirectToLogin: true });

  const [contents, setContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ [key: string]: string }>({});

  async function loadData() {
    try {
      const res = await fetch("/api/contents", { cache: "no-store" });
      const data = await res.json();
      setContents(Array.isArray(data) ? data : []);
    } catch {
      alert("Erro ao carregar conteúdos.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(id: string, action: "approve" | "reject") {
    try {
      if (action === "reject" && !feedback[id]) {
        alert("Digite o motivo do ajuste.");
        return;
      }

      setProcessingId(id);

      const res = await fetch(`/api/contents/${id}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          feedback: feedback[id] || "",
        }),
      });

      if (!res.ok) throw new Error();

      setFeedback((prev) => ({ ...prev, [id]: "" }));

      await loadData();
    } catch {
      alert("Erro ao atualizar conteúdo.");
    } finally {
      setProcessingId(null);
    }
  }

  useEffect(() => {
    if (!userLoading && user) loadData();
  }, [userLoading, user]);

  const pending = useMemo(
    () => contents.filter((c) => c.status === "waiting_client"),
    [contents]
  );

  if (userLoading || !user) return null;

  return (
    <AppShell
      title={`Olá, ${user.name}`}
      subtitle="Aprove ou solicite ajustes"
    >
      {loading ? (
        <div style={box}>Carregando...</div>
      ) : (
        <section>
          <h2 style={title}>Aprovações</h2>

          {pending.length === 0 ? (
            <p style={muted}>Tudo aprovado 👍</p>
          ) : (
            <div style={list}>
              {pending.map((c) => (
                <div key={c.id} style={card}>
                  <div style={{ flex: 1 }}>
                    <strong>{c.title}</strong>
                    <div style={meta}>{c.type}</div>

                    <textarea
                      placeholder="Descreva o ajuste"
                      value={feedback[c.id] || ""}
                      onChange={(e) =>
                        setFeedback((prev) => ({
                          ...prev,
                          [c.id]: e.target.value,
                        }))
                      }
                      style={textarea}
                    />
                  </div>

                  <div style={actions}>
                    <button
                      onClick={() => handleAction(c.id, "approve")}
                      disabled={processingId === c.id}
                      style={approveBtn}
                    >
                      Aprovar
                    </button>

                    <button
                      onClick={() => handleAction(c.id, "reject")}
                      disabled={processingId === c.id}
                      style={rejectBtn}
                    >
                      Ajustar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </AppShell>
  );
}

import type { CSSProperties } from "react";

const box: CSSProperties = {
  background: "#111",
  padding: 16,
  borderRadius: 12,
};

const title: CSSProperties = {
  marginBottom: 12,
};

const list: CSSProperties = {
  display: "grid",
  gap: 12,
};

const card: CSSProperties = {
  display: "flex",
  gap: 12,
  background: "#1a1a1a",
  padding: 12,
  borderRadius: 10,
};

const textarea: CSSProperties = {
  marginTop: 8,
  width: "100%",
  minHeight: 60,
  background: "#111",
  border: "1px solid #333",
  color: "#fff",
  borderRadius: 6,
  padding: 8,
};

const meta: CSSProperties = {
  fontSize: 12,
  color: "#aaa",
};

const actions: CSSProperties = {
  display: "flex",
  flexDirection: "column", // agora aceita
  gap: 8,
};

const approveBtn: CSSProperties = {
  background: "#2ecc71",
  border: "none",
  padding: "8px 12px",
  borderRadius: 6,
  cursor: "pointer",
};

const rejectBtn: CSSProperties = {
  background: "#e74c3c",
  border: "none",
  padding: "8px 12px",
  borderRadius: 6,
  cursor: "pointer",
};

const muted: CSSProperties = {
  color: "#888",
};