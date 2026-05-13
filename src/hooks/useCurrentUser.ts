"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Role = "admin" | "creative" | "client";

type Client = {
  id: string;
  name: string;
};

type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  clientId?: string | null;
  client?: Client | null;
};

type UseCurrentUserOptions = {
  redirectToLogin?: boolean;
};

export function useCurrentUser(options: UseCurrentUserOptions = {}) {
  const { redirectToLogin = false } = options;

  const router = useRouter();

  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadUser() {
      try {
        const res = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        const data = await res.json();

        if (!active) return;

        if (data && data.id) {
          setUser(data);
        } else {
          setUser(null);

          if (redirectToLogin) {
            router.replace("/login");
          }
        }
      } catch (error) {
        console.error("Erro ao carregar usuário atual:", error);

        if (!active) return;

        setUser(null);

        if (redirectToLogin) {
          router.replace("/login");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadUser();

    return () => {
      active = false;
    };
  }, [redirectToLogin, router]);

  return {
    user,
    loading,
  };
}