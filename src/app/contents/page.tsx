"use client";

import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import { useCurrentUser } from "@/hooks/useCurrentUser";

type Client = {
  id: string;
  name: string;
};

type ContentFile = {
  id: string;
  name: string;
  url: string;
  createdAt?: string;
};

type ContentItem = {
  id: string;
  title: string;
  type: string;
  caption?: string | null;
  description?: string | null;
  status: string;
  approvalNote?: string | null;
  scheduledDate?: string | null;
  client: Client;
  files: ContentFile[];
};

type ContentForm = {
  title: string;
  type: string;
  caption: string;
  description: string;
  status: string;
  scheduledDate: string;
  clientId: string;
};

const initialForm: ContentForm = {
  title: "",
  type: "post",
  caption: "",
  description: "",
  status: "draft",
  scheduledDate: "",
  clientId: "",
};

export default function ContentsPage() {
  const { user, loading: userLoading } = useCurrentUser({
    redirectToLogin: true,
  });

  const [contents, setContents] = useState<ContentItem[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState<ContentForm>(initialForm);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingForm, setEditingForm] = useState<ContentForm>(initialForm);
  const [savingEditId, setSavingEditId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [sendingApprovalId, setSendingApprovalId] = useState<string | null>(
    null
  );
  const [uploadingForContentId, setUploadingForContentId] = useState<
    string | null
  >(null);
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);

  async function loadData() {
    try {
      setLoading(true);

      const contentsRes = await fetch("/api/contents", {
        credentials: "include",
        cache: "no-store",
      });

      const contentsData = await contentsRes.json();

      if (!contentsRes.ok) {
        throw new Error(contentsData?.message || "Erro ao carregar conteúdos.");
      }

      const clientsRes = await fetch("/api/clients", {
        credentials: "include",
        cache: "no-store",
      });

      const clientsData = await clientsRes.json();

      if (!clientsRes.ok) {
        throw new Error(clientsData?.message || "Erro ao carregar clientes.");
      }

      setContents(Array.isArray(contentsData) ? contentsData : []);
      setClients(Array.isArray(clientsData) ? clientsData : []);
    } catch (error) {
      console.error("Erro ao carregar conteúdos:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Erro ao carregar dados da página."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!userLoading && user) {
      loadData();
    }
  }, [userLoading, user]);

  const visibleContents = useMemo(() => {
    if (!user) return [];

    if (user.role === "client" && user.client?.id) {
      return contents.filter(
        (content) => content.client?.id === user.client?.id
      );
    }

    return contents;
  }, [contents, user]);

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.title.trim() || !form.type || !form.clientId) {
      alert("Preencha título, tipo e cliente.");
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch("/api/contents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Erro ao criar conteúdo.");
      }

      setForm(initialForm);
      await loadData();
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Erro ao criar conteúdo.");
    } finally {
      setSubmitting(false);
    }
  }

  function startEdit(content: ContentItem) {
    setEditingId(content.id);
    setEditingForm({
      title: content.title || "",
      type: content.type || "post",
      caption: content.caption || "",
      description: content.description || "",
      status: content.status || "draft",
      scheduledDate: content.scheduledDate
        ? formatDateForInput(content.scheduledDate)
        : "",
      clientId: content.client?.id || "",
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditingForm(initialForm);
  }

  async function handleSaveEdit(contentId: string) {
    if (!editingForm.title.trim() || !editingForm.type || !editingForm.clientId) {
      alert("Preencha título, tipo e cliente.");
      return;
    }

    try {
      setSavingEditId(contentId);

      const response = await fetch(`/api/contents/${contentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(editingForm),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Erro ao editar conteúdo.");
      }

      cancelEdit();
      await loadData();
    } catch (error) {
      console.error(error);
      alert(
        error instanceof Error ? error.message : "Erro ao editar conteúdo."
      );
    } finally {
      setSavingEditId(null);
    }
  }

  async function handleDelete(contentId: string) {
    const confirmed = window.confirm(
      "Tem certeza que deseja excluir este conteúdo?"
    );

    if (!confirmed) return;

    try {
      setDeletingId(contentId);

      const response = await fetch(`/api/contents/${contentId}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Erro ao excluir conteúdo.");
      }

      if (editingId === contentId) {
        cancelEdit();
      }

      await loadData();
    } catch (error) {
      console.error(error);
      alert(
        error instanceof Error ? error.message : "Erro ao excluir conteúdo."
      );
    } finally {
      setDeletingId(null);
    }
  }

  async function handleSendToApproval(contentId: string) {
    try {
      setSendingApprovalId(contentId);

      const response = await fetch(`/api/contents/${contentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          status: "waiting_client",
          approvalNote: "",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Erro ao enviar para aprovação.");
      }

      await loadData();
    } catch (error) {
      console.error(error);
      alert(
        error instanceof Error
          ? error.message
          : "Erro ao enviar para aprovação."
      );
    } finally {
      setSendingApprovalId(null);
    }
  }

  async function handleUploadFile(contentId: string, file: File | null) {
    if (!file) {
      alert("Selecione um arquivo.");
      return;
    }

    try {
      setUploadingForContentId(contentId);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("contentId", contentId);

      const response = await fetch("/api/files", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Erro ao anexar arquivo.");
      }

      await loadData();
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Erro ao anexar arquivo.");
    } finally {
      setUploadingForContentId(null);
    }
  }

  async function handleDeleteFile(fileId: string) {
    const confirmed = window.confirm(
      "Tem certeza que deseja excluir este arquivo?"
    );

    if (!confirmed) return;

    try {
      setDeletingFileId(fileId);

      const response = await fetch(`/api/content-files/${fileId}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Erro ao excluir arquivo.");
      }

      await loadData();
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Erro ao excluir arquivo.");
    } finally {
      setDeletingFileId(null);
    }
  }

  if (userLoading || !user) {
    return null;
  }

  return (
    <AppShell
      title="Conteúdos"
      subtitle="Cadastro, gestão e anexos dos conteúdos da agência."
    >
      {user.role !== "client" && (
        <section style={sectionStyle}>
          <h2 style={sectionTitleStyle}>Novo conteúdo</h2>

          <form onSubmit={handleCreate} style={formStyle}>
            <input
              type="text"
              placeholder="Título do conteúdo"
              value={form.title}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
              style={inputStyle}
            />

            <select
              value={form.type}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  type: event.target.value,
                }))
              }
              style={inputStyle}
            >
              <option value="post">Post</option>
              <option value="reel">Reel</option>
              <option value="story">Story</option>
              <option value="campanha">Campanha</option>
              <option value="video">Vídeo</option>
            </select>

            <select
              value={form.status}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  status: event.target.value,
                }))
              }
              style={inputStyle}
            >
              <option value="draft">Rascunho</option>
              <option value="in_review">Em revisão</option>
              <option value="waiting_client">Aguardando cliente</option>
              <option value="approved">Aprovado</option>
              <option value="published">Publicado</option>
              <option value="changes_requested">Ajustes solicitados</option>
            </select>

            <select
              value={form.clientId}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  clientId: event.target.value,
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

            <input
              type="date"
              value={form.scheduledDate}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  scheduledDate: event.target.value,
                }))
              }
              style={inputStyle}
            />

            <input
              type="text"
              placeholder="Legenda"
              value={form.caption}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  caption: event.target.value,
                }))
              }
              style={{ ...inputStyle, gridColumn: "1 / -1" }}
            />

            <textarea
              placeholder="Descrição / observações"
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              style={textareaStyle}
            />

            <div style={formButtonRowStyle}>
              <button
                type="submit"
                disabled={submitting}
                style={primaryButtonStyle}
              >
                {submitting ? "Salvando..." : "Criar conteúdo"}
              </button>
            </div>
          </form>
        </section>
      )}

      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Lista de conteúdos</h2>

        {loading ? (
          <p style={mutedTextStyle}>Carregando conteúdos...</p>
        ) : visibleContents.length === 0 ? (
          <p style={mutedTextStyle}>Nenhum conteúdo cadastrado ainda.</p>
        ) : (
          <div style={listStyle}>
            {visibleContents.map((content) => {
              const isEditing = editingId === content.id;
              const isSaving = savingEditId === content.id;
              const isDeleting = deletingId === content.id;
              const isSending = sendingApprovalId === content.id;
              const isUploading = uploadingForContentId === content.id;

              return (
                <div key={content.id} style={cardStyle}>
                  {isEditing ? (
                    <>
                      <div style={editGridStyle}>
                        <input
                          type="text"
                          placeholder="Título"
                          value={editingForm.title}
                          onChange={(event) =>
                            setEditingForm((current) => ({
                              ...current,
                              title: event.target.value,
                            }))
                          }
                          style={inputStyle}
                        />

                        <select
                          value={editingForm.type}
                          onChange={(event) =>
                            setEditingForm((current) => ({
                              ...current,
                              type: event.target.value,
                            }))
                          }
                          style={inputStyle}
                        >
                          <option value="post">Post</option>
                          <option value="reel">Reel</option>
                          <option value="story">Story</option>
                          <option value="campanha">Campanha</option>
                          <option value="video">Vídeo</option>
                        </select>

                        <select
                          value={editingForm.status}
                          onChange={(event) =>
                            setEditingForm((current) => ({
                              ...current,
                              status: event.target.value,
                            }))
                          }
                          style={inputStyle}
                        >
                          <option value="draft">Rascunho</option>
                          <option value="in_review">Em revisão</option>
                          <option value="waiting_client">
                            Aguardando cliente
                          </option>
                          <option value="approved">Aprovado</option>
                          <option value="published">Publicado</option>
                          <option value="changes_requested">
                            Ajustes solicitados
                          </option>
                        </select>

                        <select
                          value={editingForm.clientId}
                          onChange={(event) =>
                            setEditingForm((current) => ({
                              ...current,
                              clientId: event.target.value,
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

                        <input
                          type="date"
                          value={editingForm.scheduledDate}
                          onChange={(event) =>
                            setEditingForm((current) => ({
                              ...current,
                              scheduledDate: event.target.value,
                            }))
                          }
                          style={inputStyle}
                        />

                        <input
                          type="text"
                          placeholder="Legenda"
                          value={editingForm.caption}
                          onChange={(event) =>
                            setEditingForm((current) => ({
                              ...current,
                              caption: event.target.value,
                            }))
                          }
                          style={{ ...inputStyle, gridColumn: "1 / -1" }}
                        />

                        <textarea
                          placeholder="Descrição"
                          value={editingForm.description}
                          onChange={(event) =>
                            setEditingForm((current) => ({
                              ...current,
                              description: event.target.value,
                            }))
                          }
                          style={textareaStyle}
                        />
                      </div>

                      <div style={actionsStyle}>
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(content.id)}
                          disabled={isSaving}
                          style={primaryButtonStyle}
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
                          <div style={cardTitleStyle}>{content.title}</div>
                          <div style={metaStyle}>
                            Cliente: {content.client?.name || "Sem cliente"}
                          </div>
                        </div>

                        <div style={badgeStyle}>
                          {getStatusLabel(content.status)}
                        </div>
                      </div>

                      <div style={metaStyle}>Tipo: {content.type}</div>

                      <div style={metaStyle}>
                        Data: {formatDate(content.scheduledDate)}
                      </div>

                      <div style={metaStyle}>
                        Legenda: {content.caption?.trim() || "Sem legenda"}
                      </div>

                      <div style={descriptionStyle}>
                        {content.description?.trim() || "Sem descrição"}
                      </div>

                      {content.approvalNote?.trim() ? (
                        <div style={approvalBoxStyle}>
                          <strong>Comentário de aprovação:</strong>
                          <div style={{ marginTop: 6 }}>
                            {content.approvalNote}
                          </div>
                        </div>
                      ) : null}

                      <div style={filesSectionStyle}>
                        <div style={filesTitleStyle}>Arquivos anexados</div>

                        {content.files.length === 0 ? (
                          <div style={mutedTextStyle}>
                            Nenhum arquivo anexado.
                          </div>
                        ) : (
                          <div style={filesListStyle}>
                            {content.files.map((file) => (
                              <div key={file.id} style={fileItemStyle}>
                                <a
                                  href={`/api/files/${file.id}/view`}
                                  target="_blank"
                                  rel="noreferrer"
                                  style={fileLinkStyle}
                                >
                                  {file.name}
                                </a>

                                {user.role !== "client" && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteFile(file.id)}
                                    disabled={deletingFileId === file.id}
                                    style={smallDangerButtonStyle}
                                  >
                                    {deletingFileId === file.id
                                      ? "..."
                                      : "Excluir"}
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {user.role !== "client" && (
                          <div style={{ marginTop: 12 }}>
                            <input
                              type="file"
                              onChange={(event) =>
                                handleUploadFile(
                                  content.id,
                                  event.target.files?.[0] || null
                                )
                              }
                              style={inputStyle}
                            />

                            {isUploading && (
                              <div style={{ ...mutedTextStyle, marginTop: 8 }}>
                                Enviando arquivo...
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {user.role !== "client" && (
                        <div style={actionsStyle}>
                          <button
                            type="button"
                            onClick={() => startEdit(content)}
                            style={primaryButtonStyle}
                          >
                            Editar
                          </button>

                          {content.status !== "waiting_client" && (
                            <button
                              type="button"
                              onClick={() =>
                                handleSendToApproval(content.id)
                              }
                              disabled={isSending}
                              style={secondaryButtonStyle}
                            >
                              {isSending
                                ? "Enviando..."
                                : "Enviar para aprovação"}
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleDelete(content.id)}
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

function getStatusLabel(status: string) {
  if (status === "draft") return "Rascunho";
  if (status === "in_review") return "Em revisão";
  if (status === "waiting_client") return "Aguardando cliente";
  if (status === "approved") return "Aprovado";
  if (status === "published") return "Publicado";
  if (status === "changes_requested") return "Ajustes solicitados";
  return status;
}

function formatDate(date?: string | null) {
  if (!date) return "Sem data";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "Sem data";
  }

  return parsed.toLocaleDateString("pt-BR");
}

function formatDateForInput(date: string) {
  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
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
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 12,
};

const editGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 12,
  marginBottom: 16,
};

const inputStyle: React.CSSProperties = {
  padding: 10,
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

const formButtonRowStyle: React.CSSProperties = {
  gridColumn: "1 / -1",
  display: "flex",
  justifyContent: "flex-end",
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
  flexWrap: "wrap",
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

const mutedTextStyle: React.CSSProperties = {
  color: "#aaaaaa",
};

const descriptionStyle: React.CSSProperties = {
  marginTop: 10,
  color: "#e0e0e0",
  lineHeight: 1.4,
};

const approvalBoxStyle: React.CSSProperties = {
  marginTop: 14,
  padding: 12,
  borderRadius: 8,
  background: "#222",
  border: "1px solid #333",
  color: "#f2f2f2",
};

const actionsStyle: React.CSSProperties = {
  display: "flex",
  gap: 10,
  marginTop: 16,
  flexWrap: "wrap",
};

const primaryButtonStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 8,
  border: "none",
  background: "#fff",
  color: "#000",
  fontWeight: "bold",
  cursor: "pointer",
};

const secondaryButtonStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 8,
  border: "1px solid #333",
  background: "transparent",
  color: "#fff",
  fontWeight: "bold",
  cursor: "pointer",
};

const dangerButtonStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 8,
  border: "none",
  background: "#c0392b",
  color: "#fff",
  fontWeight: "bold",
  cursor: "pointer",
};

const filesSectionStyle: React.CSSProperties = {
  marginTop: 16,
  paddingTop: 14,
  borderTop: "1px solid #2a2a2a",
};

const filesTitleStyle: React.CSSProperties = {
  fontWeight: "bold",
  marginBottom: 10,
};

const filesListStyle: React.CSSProperties = {
  display: "grid",
  gap: 8,
};

const fileItemStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 10,
  padding: 10,
  background: "#111",
  border: "1px solid #2a2a2a",
  borderRadius: 8,
  flexWrap: "wrap",
};

const fileLinkStyle: React.CSSProperties = {
  color: "#fff",
  textDecoration: "underline",
  wordBreak: "break-word",
};

const smallDangerButtonStyle: React.CSSProperties = {
  padding: "8px 10px",
  borderRadius: 8,
  border: "none",
  background: "#c0392b",
  color: "#fff",
  fontWeight: "bold",
  cursor: "pointer",
};