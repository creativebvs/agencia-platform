"use client";

import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import { useCurrentUser } from "@/hooks/useCurrentUser";

type Client = {
  id: string;
  name: string;
};

type FileItem = {
  id: string;
  originalName: string;
  path: string;
  client: Client;
};

export default function FilesPage() {
  const { user, loading: userLoading } = useCurrentUser({ redirectToLogin: true });

  const [files, setFiles] = useState<FileItem[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [clientId, setClientId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    const [filesResponse, clientsResponse] = await Promise.all([
      fetch("/api/files", { cache: "no-store" }),
      fetch("/api/clients", { cache: "no-store" }),
    ]);

    const [filesData, clientsData] = await Promise.all([
      filesResponse.json(),
      clientsResponse.json(),
    ]);

    setFiles(Array.isArray(filesData) ? filesData : []);
    setClients(Array.isArray(clientsData) ? clientsData : []);
    setLoading(false);
  }

  useEffect(() => {
    if (!userLoading && user) {
      load();
    }
  }, [userLoading, user]);

  const visibleFiles = useMemo(() => {
    if (!user) return [];

    if (user.role === "client" && user.client?.id) {
      return files.filter((item) => item.client?.id === user.client?.id);
    }

    return files;
  }, [files, user]);

  async function upload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!file || !clientId) {
      alert("Preencha tudo.");
      return;
    }

    const form = new FormData();
    form.append("file", file);
    form.append("clientId", clientId);

    const response = await fetch("/api/files", {
      method: "POST",
      body: form,
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data?.message || "Erro ao enviar arquivo.");
      return;
    }

    setFile(null);
    setClientId("");
    load();
  }

  if (userLoading || !user) {
    return null;
  }

  return (
    <AppShell
      title="Arquivos"
      subtitle="Central de arquivos por cliente."
    >
      {user.role !== "client" && (
        <form onSubmit={upload} style={formStyle}>
          <select
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            style={inputStyle}
          >
            <option value="">Cliente</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>

          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            style={inputStyle}
          />

          <button type="submit" style={buttonStyle}>
            Enviar
          </button>
        </form>
      )}

      {loading ? (
        <div style={emptyBoxStyle}>Carregando arquivos...</div>
      ) : visibleFiles.length === 0 ? (
        <div style={emptyBoxStyle}>Nenhum arquivo encontrado.</div>
      ) : (
        <div style={listStyle}>
          {visibleFiles.map((item) => (
            <div key={item.id} style={cardStyle}>
              <strong>{item.originalName}</strong>
              <div style={metaStyle}>{item.client?.name}</div>

              <a href={item.path} target="_blank" rel="noreferrer" style={linkStyle}>
                Abrir
              </a>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}

const formStyle: React.CSSProperties = {
  display: "flex",
  gap: 10,
  marginBottom: 20,
  flexWrap: "wrap",
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
  padding: 14,
  borderRadius: 10,
  border: "1px solid #2a2a2a",
};

const metaStyle: React.CSSProperties = {
  color: "#aaa",
  marginTop: 6,
};

const linkStyle: React.CSSProperties = {
  display: "inline-block",
  marginTop: 10,
  color: "#fff",
  textDecoration: "underline",
};