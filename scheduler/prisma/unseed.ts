/**
 * Deletes all data from the database.
 * Respects foreign key constraints by deleting in the correct order.
 *
 * Usage: npx ts-node prisma/unseed.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function unseed(): Promise<void> {
  console.log('Starting database cleanup...')

  try {
    // Delete in order of dependencies (reverse of creation order)
    console.log('Deleting messages...')
    await prisma.message.deleteMany()

    console.log('Deleting conversation participants...')
    await prisma.conversationParticipant.deleteMany()

    console.log('Deleting conversations...')
    await prisma.conversation.deleteMany()

    console.log('Deleting point transactions...')
    await prisma.pointTransaction.deleteMany()

    console.log('Deleting user inventory...')
    await prisma.userInventory.deleteMany()

    console.log('Deleting module members...')
    await prisma.moduleMember.deleteMany()

    console.log('Deleting group members...')
    await prisma.groupMember.deleteMany()

    console.log('Deleting tasks...')
    await prisma.task.deleteMany()

    console.log('Deleting events...')
    await prisma.event.deleteMany()

    console.log('Deleting revision materials...')
    await prisma.revisionMaterial.deleteMany()

    console.log('Deleting exams...')
    await prisma.exam.deleteMany()

    console.log('Deleting friend requests...')
    await prisma.friendRequest.deleteMany()

    console.log('Deleting notifications...')
    await prisma.notification.deleteMany()

    console.log('Deleting user preferences...')
    await prisma.userPreferences.deleteMany()

    console.log('Deleting user progress...')
    await prisma.userProgress.deleteMany()

    console.log('Deleting appeals...')
    await prisma.appeal.deleteMany()

    console.log('Deleting reports...')
    await prisma.report.deleteMany()

    console.log('Deleting accounts...')
    await prisma.account.deleteMany()

    console.log('Deleting check-ins...')
    await prisma.checkIn.deleteMany()

    console.log('Deleting schedule logs...')
    await prisma.scheduleLog.deleteMany()

    console.log('Deleting categories...')
    await prisma.category.deleteMany()

    console.log('Deleting saved locations...')
    await prisma.savedLocation.deleteMany()

    console.log('Deleting modules...')
    await prisma.module.deleteMany()

    console.log('Deleting groups...')
    await prisma.group.deleteMany()

    console.log('Deleting shop items...')
    await prisma.shopItem.deleteMany()

    console.log('Deleting users...')
    await prisma.user.deleteMany()

    console.log('✓ Database cleanup complete.')
  } catch (error) {
    console.error('Error during database cleanup:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

unseed()
