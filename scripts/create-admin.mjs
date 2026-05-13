import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const name = process.env.ADMIN_NAME || "Luiz";
const email = process.env.ADMIN_EMAIL || "creativebvs@gmail.com";
const password = process.env.ADMIN_PASSWORD || "123456";

async function main() {
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: {
      email,
    },
    update: {
      name,
      password: hashedPassword,
      role: "admin",
      clientId: null,
    },
    create: {
      name,
      email,
      password: hashedPassword,
      role: "admin",
      clientId: null,
    },
  });

  console.log("Admin criado/atualizado com sucesso:");
  console.log({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  });
}

main()
  .catch((error) => {
    console.error("Erro ao criar admin:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });