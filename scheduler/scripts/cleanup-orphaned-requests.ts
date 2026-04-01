// scripts/cleanup-orphaned-requests.ts
import { prisma } from "../src/lib/prisma";

async function main() {
  // Get all valid user IDs
  const users = await prisma.user.findMany({ select: { id: true } });
  const validIds = users.map((u) => u.id);

  const deleted = await prisma.friendRequest.deleteMany({
    where: {
      OR: [
        { senderId: { notIn: validIds } },
        { receiverId: { notIn: validIds } },
      ],
    },
  });

  console.log(`Deleted ${deleted.count} orphaned friend requests`);
}

main().then(() => prisma.$disconnect());