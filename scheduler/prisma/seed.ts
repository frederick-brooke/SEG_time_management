import { PrismaClient } from '@prisma/client'
import { faker } from '@faker-js/faker'
import bcrypt from 'bcryptjs'
import { SHOP_CATALOGUE } from "../src/lib/shop-catalogue";


const prisma = new PrismaClient()
const TASK_STATUSES = ['todo', 'in-progress', 'completed']
const TASK_PRIORITIES = ['Low', 'Medium', 'High']
const EVENT_CATEGORIES = ['Work', 'Personal', 'Health', 'Social', 'Other']

function randomFutureDate(maxDays = 20) {
  const now = new Date()
  const future = new Date()
  future.setDate(now.getDate() + Math.floor(Math.random() * maxDays) + 1)
  return future
}

async function main() {
  await prisma.userInventory.deleteMany()
  await prisma.shopItem.deleteMany()

  console.log('Starting seeding...')

  const passwordHash = await bcrypt.hash('Password123', 10)

  // ── SHOP ITEMS ─────────────────────────────────────────────────────────────
  console.log('Seeding shop items...')
  for (const item of SHOP_CATALOGUE) {
    await prisma.shopItem.upsert({
      where: { name: item.name },
      create: { ...item, isActive: true },
      update: { price: item.price, description: item.description, isActive: true },
    });
  }

  // ── USERS ──────────────────────────────────────────────────────────────────
  console.log('Creating users...')
  const users = []
  for (let i = 0; i < 20; i++) {
    const firstName = faker.person.firstName()
    const lastName = faker.person.lastName()
    const username = faker.internet.username({ firstName, lastName }).toLowerCase()
    const user = await prisma.user.create({
      data: {
        email: faker.internet.email({ firstName, lastName }).toLowerCase(),
        username,
        fname: firstName,
        lname: lastName,
        bio: faker.datatype.boolean(0.7) ? faker.lorem.sentence() : null,
        pfp: faker.datatype.boolean(0.6) ? faker.image.avatar() : null,
        passwordHash,
      },
    })
    users.push(user)
  }
  console.log(`Created ${users.length} users.`)

  // ── USER PROGRESS + TASKS ──────────────────────────────────────────────────
  // Every user starts at 0 points. Points are only awarded when the user
  // actually completes tasks through the app (via the PATCH /api/tasks/[id]).
  console.log('Creating user progress and tasks...')
  for (const user of users) {
    await prisma.userProgress.create({
      data: {
        userId: user.id,
        points: 0,
        level: 1,
        experience: 0,
        streak: 0,
        streakShields: 0,
      },
    })

    for (let t = 0; t < 3; t++) {
      const status = faker.helpers.arrayElement(TASK_STATUSES)
      const isCompleted = status === 'completed'
      await prisma.task.create({
        data: {
          title: faker.hacker.phrase(),
          description: faker.datatype.boolean(0.6) ? faker.lorem.sentence() : null,
          dueDate: randomFutureDate(20),
          completed: isCompleted,
          completedAt: isCompleted ? faker.date.recent({ days: 7 }) : null,
          status,
          duration: faker.helpers.arrayElement([15, 30, 45, 60, 90, 120]),
          subtasks: faker.datatype.boolean(0.5)
            ? Array.from({ length: faker.number.int({ min: 1, max: 4 }) }, () =>
                faker.hacker.verb() + ' ' + faker.hacker.noun()
              )
            : [],
          priority: faker.helpers.arrayElement(TASK_PRIORITIES),
          userId: user.id,
        },
      })
    }
  }

  // ── EVENTS ─────────────────────────────────────────────────────────────────
  console.log('Creating events...')
  for (const user of users) {
    for (let e = 0; e < 6; e++) {
      const start = randomFutureDate(20)
      const end = new Date(start)
      end.setHours(start.getHours() + faker.number.int({ min: 1, max: 3 }))
      const allDay = faker.datatype.boolean(0.2)
      await prisma.event.create({
        data: {
          userId: user.id,
          title: faker.lorem.words({ min: 2, max: 4 }),
          description: faker.datatype.boolean(0.5) ? faker.lorem.sentence() : null,
          start: allDay ? new Date(start.toDateString()) : start,
          end: allDay ? new Date(end.toDateString()) : end,
          allDay,
          category: faker.helpers.arrayElement(EVENT_CATEGORIES),
          destinationCoords: faker.datatype.boolean(0.3)
            ? { lat: faker.location.latitude(), lng: faker.location.longitude() }
            : null,
          recurrence: null,
          exceptions: [],
          googleEventId: null,
          lastSyncedAt: null,
        },
      })
    }
  }

  // ── FRIENDSHIPS ────────────────────────────────────────────────────────────
  console.log('Creating friendships...')
  for (const user of users) {
    const otherUsers = users.filter((u) => u.id !== user.id)
    const targets = faker.helpers.arrayElements(otherUsers, 5)
    for (const target of targets) {
      const exists = await prisma.friendRequest.findFirst({
        where: {
          OR: [
            { senderId: user.id, receiverId: target.id },
            { senderId: target.id, receiverId: user.id },
          ],
        },
      })
      if (!exists) {
        await prisma.friendRequest.create({
          data: { senderId: user.id, receiverId: target.id, status: 'ACCEPTED' },
        })
      }
    }
  }

  // Exams (1 - 2 per user)
  console.log('Creating exams...')
  for (const user of users) {
    for (let x = 0; x < 2; x++) {
      await prisma.exam.create({
        data: {
          userId: user.id,
          title: faker.helpers.arrayElement(['CS1 Exam', 'Maths Exam', 'Ethics Exam']),
          examDate: randomFutureDate(30),
          maxTimePerDay: faker.helpers.arrayElement([60, 90, 120, 180])
        },
      })
    }
  }
}

  console.log('\nSeeding start!')


main()
  .catch((e) => {
    console.error('Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })