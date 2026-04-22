export type UserRole = "admin" | "creative" | "client";

export function getUserRole(): UserRole {
  if (typeof window === "undefined") return "admin";

  const role = localStorage.getItem("role");

  if (role === "admin" || role === "creative" || role === "client") {
    return role;
  }

  return "admin";
}

export function setUserRole(role: UserRole) {
  localStorage.setItem("role", role);
}