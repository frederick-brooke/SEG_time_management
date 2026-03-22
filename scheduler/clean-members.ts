import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log("Starting master database cleanup...");

  // 1. Get all valid User IDs
  const allUsers = await prisma.user.findMany({ select: { id: true } });
  const validUserIds = new Set(allUsers.map(u => u.id));

  // ---------------------------------------------------------
  // 2. Clean up ModuleMembers
  // ---------------------------------------------------------
  const allModuleMembers = await prisma.moduleMember.findMany({
    select: { id: true, userId: true } // DO NOT use 'include' here!
  });

  const brokenModuleMembers = allModuleMembers
    .filter(member => !validUserIds.has(member.userId))
    .map(member => member.id);

  if (brokenModuleMembers.length > 0) {
    await prisma.moduleMember.deleteMany({
      where: { id: { in: brokenModuleMembers } }
    });
    console.log(`✅ Deleted ${brokenModuleMembers.length} orphaned Module Members!`);
  } else {
    console.log("✅ Module Members are clean.");
  }

  // ---------------------------------------------------------
  // 3. Clean up GroupMembers (Preventative)
  // ---------------------------------------------------------
  const allGroupMembers = await prisma.groupMember.findMany({
    select: { id: true, userId: true }
  });

  const brokenGroupMembers = allGroupMembers
    .filter(member => !validUserIds.has(member.userId))
    .map(member => member.id);

  if (brokenGroupMembers.length > 0) {
    await prisma.groupMember.deleteMany({
      where: { id: { in: brokenGroupMembers } }
    });
    console.log(`✅ Deleted ${brokenGroupMembers.length} orphaned Group Members!`);
  } else {
    console.log("✅ Group Members are clean.");
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });