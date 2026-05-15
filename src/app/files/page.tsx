"use client";

import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import { useCurrentUser } from "@/hooks/useCurrentUser";

type Client = {
  id: string;
  name: string;
};

type Content = {
  id: string;
  title: string;
  client?: Client | null;
};

type FileItem = {
  id: string;
  name: string;
  url: string;
  createdAt?: string;
  content?: Content | null;
};

export default function FilesPage() {
  const { user, loading: userLoading } = useCurrentUser({
    redirectToLogin: true,
  });

  const [files, setFiles] = useState<FileItem[]>([]);
  const [contents, setContents] = useState<Content[]>([]);
  const [contentId, setContentId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function load() {
    try {
      setLoading(true);

      const [filesResponse, contentsResponse] = await Promise.all([
        fetch("/api/files", {
          credentials: "include",
          cache: "no-store",
        }),
        fetch("/api/contents", {
          credentials: "include",
          cache: "no-store",
        }),
      ]);

      const [filesData, contentsData] = await Promise.all([
        filesResponse.json(),
        contentsResponse.json(),
      ]);

      if (!filesResponse.ok) {
        throw new Error(filesData?.message || "Erro ao carregar arquivos.");
      }

      if (!contentsResponse.ok) {
        throw new Error(
          contentsData?.message || "Erro ao carregar conteúdos."
        );
      }

      setFiles(Array.isArray(filesData) ? filesData : []);
      setContents(Array.isArray(contentsData) ? contentsData : []);
    } catch (error) {
      console.error("Erro ao carregar arquivos:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Erro ao carregar arquivos."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!userLoading && user) {
      load();
    }
  }, [userLoading, user]);

  const visibleFiles = useMemo(() => {
    if (!user) return [];

    if (user.role === "client" && user.client?.id) {
      return files.filter(
        (item) => item.content?.client?.id === user.client?.id
      );
    }

    return files;
  }, [files, user]);

  async function upload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!file || !contentId) {
      alert("Selecione um conteúdo e um arquivo.");
      return;
    }

    try {
      setUploading(true);

      const form = new FormData();
      form.append("file", file);
      form.append("contentId", contentId);

      const response = await fetch("/api/files", {
        method: "POST",
        credentials: "include",
        body: form,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Erro ao enviar arquivo.");
      }

      setFile(null);
      setContentId("");

      const input = document.getElementById("file-input") as HTMLInputElement;
      if (input) input.value = "";

      await load();
    } catch (error) {
      console.error("Erro ao enviar arquivo:", error);
      alert(error instanceof Error ? error.message : "Erro ao enviar arquivo.");
    } finally {
      setUploading(false);
    }
  }

  async function deleteFile(fileId: string) {
    const confirmed = window.confirm(
      "Tem certeza que deseja excluir este arquivo?"
    );

    if (!confirmed) return;

    try {
      setDeletingId(fileId);

      const response = await fetch(`/api/content-files/${fileId}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Erro ao excluir arquivo.");
      }

      await load();
    } catch (error) {
      console.error("Erro ao excluir arquivo:", error);
      alert(error instanceof Error ? error.message : "Erro ao excluir arquivo.");
    } finally {
      setDeletingId(null);
    }
  }

  if (userLoading || !user) {
    return null;
  }

  return (
    <AppShell title="Arquivos" subtitle="Central de arquivos por conteúdo.">
      {user.role !== "client" && (
        <form onSubmit={upload} style={formStyle}>
          <select
            value={contentId}
            onChange={(event) => setContentId(event.target.value)}
            style={inputStyle}
          >
            <option value="">Selecione o conteúdo</option>
            {contents.map((content) => (
              <option key={content.id} value={content.id}>
                {content.title}
                {content.client?.name ? ` • ${content.client.name}` : ""}
              </option>
            ))}
          </select>

          <input
            id="file-input"
            type="file"
            onChange={(event) => setFile(event.target.files?.[0] || null)}
            style={inputStyle}
          />

          <button type="submit" disabled={uploading} style={buttonStyle}>
            {uploading ? "Enviando..." : "Enviar"}
          </button>
        </form>
      )}

      {loading ? (
        <div style={emptyBoxStyle}>Carregando arquivos...</div>
      ) : visibleFiles.length === 0 ? (
        <div style={emptyBoxStyle}>Nenhum arquivo encontrado.</div>
      ) : (
        <div style={listStyle}>
          {visibleFiles.map((item) => {
            const viewUrl = `/api/files/${item.id}/view`;
            const isImage = isImageFile(item.name);

            return (
              <div key={item.id} style={cardStyle}>
                {isImage && (
                  <a
                    href={viewUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={previewLinkStyle}
                  >
                    <img
                      src={viewUrl}
                      alt={item.name}
                      style={previewImageStyle}
                    />
                  </a>
                )}

                <strong>{item.name}</strong>

                <div style={metaStyle}>
                  Conteúdo: {item.content?.title || "Sem conteúdo"}
                </div>

                <div style={metaStyle}>
                  Cliente: {item.content?.client?.name || "Sem cliente"}
                </div>

                <div style={metaStyle}>
                  Enviado em: {formatDate(item.createdAt)}
                </div>

                <div style={actionsStyle}>
                  <a
                    href={viewUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={linkStyle}
                  >
                    {isImage ? "Abrir imagem" : "Abrir arquivo"}
                  </a>

                  {user.role !== "client" && (
                    <button
                      type="button"
                      onClick={() => deleteFile(item.id)}
                      disabled={deletingId === item.id}
                      style={dangerButtonStyle}
                    >
                      {deletingId === item.id ? "Excluindo..." : "Excluir"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}

function isImageFile(fileName: string) {
  const lower = fileName.toLowerCase();

  return (
    lower.endsWith(".jpg") ||
    lower.endsWith(".jpeg") ||
    lower.endsWith(".png") ||
    lower.endsWith(".webp") ||
    lower.endsWith(".gif")
  );
}

function formatDate(date?: string) {
  if (!date) return "Sem data";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "Sem data";
  }

  return parsed.toLocaleDateString("pt-BR");
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
  minWidth: 220,
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
  gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
  gap: 12,
};

const cardStyle: React.CSSProperties = {
  background: "#1a1a1a",
  padding: 14,
  borderRadius: 10,
  border: "1px solid #2a2a2a",
};

const previewLinkStyle: React.CSSProperties = {
  display: "block",
  marginBottom: 12,
};

const previewImageStyle: React.CSSProperties = {
  width: "100%",
  height: 180,
  objectFit: "cover",
  borderRadius: 8,
  border: "1px solid #333",
  background: "#0b0b0b",
};

const metaStyle: React.CSSProperties = {
  color: "#aaa",
  marginTop: 6,
  fontSize: 13,
};

const actionsStyle: React.CSSProperties = {
  display: "flex",
  gap: 10,
  marginTop: 12,
  flexWrap: "wrap",
};

const linkStyle: React.CSSProperties = {
  color: "#fff",
  textDecoration: "underline",
};

const dangerButtonStyle: React.CSSProperties = {
  padding: "8px 10px",
  borderRadius: 8,
  border: "none",
  background: "#c0392b",
  color: "#fff",
  fontWeight: "bold",
  cursor: "pointer",
};