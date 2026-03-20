import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log("🧹 Starting ultimate database cleanup...");

  // 1. Get all valid User IDs to check against
  const allUsers = await prisma.user.findMany({ select: { id: true } });
  const validUserIds = new Set(allUsers.map(u => u.id));

  // ---------------------------------------------------------
  // 2. Clean up orphaned Tasks
  // ---------------------------------------------------------
  const allTasks = await prisma.task.findMany({
    select: { id: true, userId: true } // DO NOT use 'include' here!
  });

  const brokenTasks = allTasks
    .filter(task => !validUserIds.has(task.userId))
    .map(task => task.id);

  if (brokenTasks.length > 0) {
    await prisma.task.deleteMany({
      where: { id: { in: brokenTasks } }
    });
    console.log(`✅ Deleted ${brokenTasks.length} orphaned Tasks!`);
  } else {
    console.log("✅ Tasks are clean.");
  }

  // ---------------------------------------------------------
  // 3. Clean up orphaned Events (Preventative)
  // ---------------------------------------------------------
  const allEvents = await prisma.event.findMany({
    select: { id: true, userId: true }
  });

  const brokenEvents = allEvents
    .filter(event => !validUserIds.has(event.userId))
    .map(event => event.id);

  if (brokenEvents.length > 0) {
    await prisma.event.deleteMany({
      where: { id: { in: brokenEvents } }
    });
    console.log(`✅ Deleted ${brokenEvents.length} orphaned Events!`);
  } else {
    console.log("✅ Events are clean.");
  }

  console.log("✨ Database cleanup complete! You are good to go.");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });