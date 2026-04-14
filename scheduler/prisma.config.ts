import { defineConfig } from "@prisma/config";
import { config } from "dotenv";

config();

export default defineConfig({
  earlyAccess: true,
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
});