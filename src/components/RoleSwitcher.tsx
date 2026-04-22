"use client";

import { useEffect, useState } from "react";
import { getUserRole, setUserRole, UserRole } from "@/lib/auth";

export default function RoleSwitcher() {
  const [role, setRole] = useState<UserRole>("admin");

  useEffect(() => {
    setRole(getUserRole());
  }, []);

  function handleChange(newRole: UserRole) {
    setUserRole(newRole);
    setRole(newRole);
    window.location.reload();
  }

  return (
    <div style={container}>
      <span style={{ fontSize: 12, color: "#aaa" }}>Perfil:</span>

      <select
        value={role}
        onChange={(e) => handleChange(e.target.value as UserRole)}
        style={select}
      >
        <option value="admin">Admin</option>
        <option value="creative">Creative</option>
        <option value="client">Client</option>
      </select>
    </div>
  );
}

const container = {
  position: "fixed" as const,
  top: 20,
  right: 20,
  background: "#111",
  border: "1px solid #333",
  borderRadius: 8,
  padding: 10,
};

const select = {
  marginLeft: 8,
  background: "#1a1a1a",
  color: "#fff",
  border: "1px solid #333",
};