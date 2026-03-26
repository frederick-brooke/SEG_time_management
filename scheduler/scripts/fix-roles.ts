
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Main function to normalize user roles in the database.
 */
async function main() {
  console.log("Fixing all BASIC roles...");

  /**
   * updateMany:
   * - Finds all users where role === "BASIC"
   * - Updates them to "BASIC" again
   */
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
    /**
     * Ensure the Prisma client disconnects from the database
     * to prevent hanging processes or open connections.
     */
    await prisma.$disconnect();
  });