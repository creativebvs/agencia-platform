export const dynamic = "force-dynamic";

import bcrypt from "bcryptjs";

export async function hashPassword(password: string) {
  if (!password) {
    throw new Error("Senha inválida");
  }

  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
) {
  if (!password || !hashedPassword) {
    return false;
  }

  return bcrypt.compare(password, hashedPassword);
}