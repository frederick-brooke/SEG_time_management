/**
 * Main function to normalize user roles in the database.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Fixing all BASIC roles...");

  // Finds all users where role === "BASIC" and updates them to BASIC again
  const result = await prisma.user.updateMany({
    where: { role: "BASIC" },
    data: { role: "BASIC" },
  });

  console.log("Updated users count:", result.count);
}

main()
  .catch((e) => {
    console.error("Error while fixing roles:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });