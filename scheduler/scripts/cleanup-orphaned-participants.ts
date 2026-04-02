import { prisma } from "../src/lib/prisma";

async function main() {
  const users = await prisma.user.findMany({ select: { id: true } });
  const validIds = users.map((u) => u.id);

  // Remove participants pointing to deleted users
  const deletedParticipants = await prisma.conversationParticipant.deleteMany({
    where: { userId: { notIn: validIds } },
  });

  // Clean up any conversations that now have no participants
  const emptyConversations = await prisma.conversation.findMany({
    where: { participants: { none: {} } },
    select: { id: true },
  });

  const deletedConversations = await prisma.conversation.deleteMany({
    where: { id: { in: emptyConversations.map((c) => c.id) } },
  });

  console.log(`Deleted ${deletedParticipants.count} orphaned participants`);
  console.log(`Deleted ${deletedConversations.count} empty conversations`);
}

main().then(() => prisma.$disconnect());