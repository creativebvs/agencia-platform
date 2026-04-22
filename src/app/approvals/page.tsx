"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { useCurrentUser } from "@/hooks/useCurrentUser";

type Content = {
  id: string;
  title: string;
  status: string;
  approvalNote?: string | null;
};

export default function ApprovalsPage() {
  const { user, loading: userLoading } = useCurrentUser({ redirectToLogin: true });

  const [items, setItems] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch("/api/contents", { cache: "no-store" });
    const data = await res.json();

    if (Array.isArray(data)) {
      setItems(data.filter((content) => content.status === "waiting_client"));
    } else {
      setItems([]);
    }

    setLoading(false);
  }

  useEffect(() => {
    if (!userLoading && user) {
      load();
    }
  }, [userLoading, user]);

  async function update(id: string, status: string) {
    const response = await fetch(`/api/contents/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data?.message || "Erro ao atualizar aprovação.");
      return;
    }

    load();
  }

  if (userLoading || !user) {
    return null;
  }

  return (
    <AppShell
      title="Aprovações"
      subtitle="Conteúdos aguardando retorno do cliente."
    >
      {loading ? (
        <div style={emptyBoxStyle}>Carregando aprovações...</div>
      ) : items.length === 0 ? (
        <div style={emptyBoxStyle}>Nenhum conteúdo aguardando aprovação.</div>
      ) : (
        <div style={listStyle}>
          {items.map((content) => (
            <div key={content.id} style={cardStyle}>
              <strong>{content.title}</strong>

              {user.role === "client" && (
                <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
                  <button
                    onClick={() => update(content.id, "approved")}
                    style={approveButtonStyle}
                  >
                    Aprovar
                  </button>

                  <button
                    onClick={() => update(content.id, "changes_requested")}
                    style={adjustButtonStyle}
                  >
                    Ajustar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}

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
  padding: 14,
  borderRadius: 10,
  border: "1px solid #2a2a2a",
};

const approveButtonStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 8,
  border: "none",
  background: "#27ae60",
  color: "#fff",
  fontWeight: "bold",
  cursor: "pointer",
};

const adjustButtonStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 8,
  border: "none",
  background: "#d35400",
  color: "#fff",
  fontWeight: "bold",
  cursor: "pointer",
};