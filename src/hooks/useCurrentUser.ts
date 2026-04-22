"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "creative" | "client";
  client?: {
    id: string;
    name: string;
  } | null;
};

export function useCurrentUser(options?: { redirectToLogin?: boolean }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      try {
        const response = await fetch("/api/auth/me", {
          cache: "no-store",
        });

        if (!response.ok) {
          if (options?.redirectToLogin) {
            router.replace("/login");
          }

          if (mounted) {
            setUser(null);
            setLoading(false);
          }

          return;
        }

        const data = await response.json();

        if (mounted) {
          setUser(data);
          setLoading(false);
        }
      } catch (error) {
        console.error("Erro ao carregar usuário:", error);

        if (options?.redirectToLogin) {
          router.replace("/login");
        }

        if (mounted) {
          setUser(null);
          setLoading(false);
        }
      }
    }

    loadUser();

    return () => {
      mounted = false;
    };
  }, [options?.redirectToLogin, router]);

  return { user, loading };
}