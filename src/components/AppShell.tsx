"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useEffect, useState } from "react";

type AppShellProps = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
};

type NavItem = {
  href: string;
  label: string;
  roles: Array<"admin" | "creative" | "client">;
};

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", roles: ["admin", "creative"] },
  { href: "/client", label: "Início", roles: ["client"] },

  { href: "/contents", label: "Conteúdos", roles: ["admin", "creative"] },
  { href: "/approvals", label: "Aprovações", roles: ["admin", "creative"] },
  { href: "/calendar", label: "Calendário", roles: ["admin", "creative"] },
  { href: "/files", label: "Arquivos", roles: ["admin", "creative"] },
  { href: "/reports", label: "Relatórios", roles: ["admin", "creative"] },

  { href: "/clients", label: "Clientes", roles: ["admin"] },
  { href: "/users", label: "Usuários", roles: ["admin"] },
  { href: "/tasks", label: "Tarefas", roles: ["admin", "creative"] },
];

export default function AppShell({
  title,
  subtitle,
  children,
}: AppShellProps) {
  const { user, loading } = useCurrentUser({ redirectToLogin: true });
  const router = useRouter();
  const pathname = usePathname();
  const [notif, setNotif] = useState(0);

  async function handleLogout() {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });

    router.replace("/login");
    router.refresh();
  }

  useEffect(() => {
    let active = true;

    async function loadNotifications() {
      try {
        const res = await fetch("/api/notifications", {
          credentials: "include",
          cache: "no-store",
        });

        if (!res.ok) return;

        const data = await res.json();

        if (active) {
          setNotif(typeof data.count === "number" ? data.count : 0);
        }
      } catch (error) {
        console.error("Erro ao buscar notificações:", error);
      }
    }

    if (!loading && user && user.role !== "client") {
      loadNotifications();

      const interval = setInterval(loadNotifications, 5000);

      return () => {
        active = false;
        clearInterval(interval);
      };
    }

    return () => {
      active = false;
    };
  }, [loading, user]);

  if (loading) {
    return (
      <main style={loadingMainStyle}>
        <div style={loadingBoxStyle}>Carregando...</div>
      </main>
    );
  }

  if (!user) return null;

  const visibleItems = navItems.filter((item) =>
    item.roles.includes(user.role)
  );

  return (
    <div style={shellStyle}>
      <aside style={sidebarStyle}>
        <div style={brandBoxStyle}>
          <div style={brandTitleStyle}>Creative Platform</div>
          <div style={brandSubtitleStyle}>Gestão da agência</div>
        </div>

        <nav style={navStyle}>
          {visibleItems.map((item) => {
            const active = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  ...navLinkStyle,
                  ...(active ? navLinkActiveStyle : {}),
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div style={contentAreaStyle}>
        <header style={headerStyle}>
          <div>
            <h1 style={pageTitleStyle}>{title}</h1>
            {subtitle && <p style={pageSubtitleStyle}>{subtitle}</p>}
          </div>

          <div style={headerRightStyle}>
            {user.role !== "client" && (
              <button
                type="button"
                onClick={() => router.push("/approvals")}
                style={notificationButtonStyle}
                title="Notificações"
              >
                <span style={notificationIconStyle}>🔔</span>

                {notif > 0 && (
                  <span style={notificationBadgeStyle}>{notif}</span>
                )}
              </button>
            )}

            <div style={userBoxStyle}>
              <div style={userMetaStyle}>
                <div style={userNameStyle}>{user.name}</div>
                <div style={userRoleStyle}>
                  {user.role}
                  {user.client?.name ? ` • ${user.client.name}` : ""}
                </div>
              </div>

              <button onClick={handleLogout} style={logoutButtonStyle}>
                Sair
              </button>
            </div>
          </div>
        </header>

        <main style={mainContentStyle}>{children}</main>
      </div>
    </div>
  );
}

const shellStyle: React.CSSProperties = {
  minHeight: "100vh",
  display: "grid",
  gridTemplateColumns: "260px 1fr",
  background: "#0b0b0b",
  color: "#fff",
};

const sidebarStyle: React.CSSProperties = {
  borderRight: "1px solid #1f1f1f",
  padding: 20,
};

const navStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
};

const navLinkStyle: React.CSSProperties = {
  padding: 10,
  borderRadius: 8,
  textDecoration: "none",
  color: "#ccc",
};

const navLinkActiveStyle: React.CSSProperties = {
  background: "#fff",
  color: "#111",
};

const contentAreaStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
};

const headerStyle: React.CSSProperties = {
  padding: 20,
  borderBottom: "1px solid #1f1f1f",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 16,
};

const headerRightStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 14,
};

const pageTitleStyle: React.CSSProperties = {
  fontSize: 26,
  margin: 0,
};

const pageSubtitleStyle: React.CSSProperties = {
  color: "#aaa",
  marginTop: 6,
  marginBottom: 0,
};

const userBoxStyle: React.CSSProperties = {
  display: "flex",
  gap: 10,
  alignItems: "center",
};

const logoutButtonStyle: React.CSSProperties = {
  background: "#c0392b",
  color: "#fff",
  border: "none",
  padding: "8px 12px",
  borderRadius: 8,
  cursor: "pointer",
};

const mainContentStyle: React.CSSProperties = {
  padding: 20,
};

const brandBoxStyle: React.CSSProperties = {
  marginBottom: 20,
};

const brandTitleStyle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: "bold",
};

const brandSubtitleStyle: React.CSSProperties = {
  fontSize: 12,
  color: "#888",
};

const userMetaStyle: React.CSSProperties = {
  textAlign: "right",
};

const userNameStyle: React.CSSProperties = {
  fontWeight: "bold",
};

const userRoleStyle: React.CSSProperties = {
  fontSize: 12,
  color: "#aaa",
};

const loadingMainStyle: React.CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#0b0b0b",
  color: "#fff",
};

const loadingBoxStyle: React.CSSProperties = {
  padding: 20,
  borderRadius: 10,
  background: "#111",
};

const notificationButtonStyle: React.CSSProperties = {
  position: "relative",
  background: "#111",
  border: "1px solid #1f1f1f",
  color: "#fff",
  width: 42,
  height: 42,
  borderRadius: 10,
  cursor: "pointer",
};

const notificationIconStyle: React.CSSProperties = {
  fontSize: 18,
  lineHeight: 1,
};

const notificationBadgeStyle: React.CSSProperties = {
  position: "absolute",
  top: -6,
  right: -6,
  minWidth: 18,
  height: 18,
  padding: "0 5px",
  borderRadius: 999,
  background: "#e74c3c",
  color: "#fff",
  fontSize: 11,
  fontWeight: "bold",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};