// scripts/fix-roles.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Fixing all BASIC roles...");

  // This will update all BASIC users to "BASIC" again, triggering proper DB normalization
  const result = await prisma.user.updateMany({
    where: { role: "BASIC" },
    data: { role: "BASIC" },
  });

  console.log("Updated users count:", result.count);
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });