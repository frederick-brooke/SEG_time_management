import { PrismaClient, FriendStatus } from '@prisma/client'
import { faker } from '@faker-js/faker'
import bcrypt from 'bcryptjs'
import { SHOP_CATALOGUE } from '../src/lib/shop-catalogue'

const prisma = new PrismaClient()

// Constants

const SEED_USER_COUNT = 20
const SEED_TASKS_PER_USER = 3
const SEED_EVENTS_PER_USER = 6
const SEED_EXAMS_PER_USER = 2
const SEED_FRIENDS_PER_USER = 5
const SEED_PASSWORD = 'Password123'
const MAX_EVENT_DURATION_HOURS = 3
const MAX_DUE_DATE_DAYS = 20
const MAX_EXAM_DATE_DAYS = 30
const EXAM_TITLES = ['CS1 Exam', 'Maths Exam', 'Ethics Exam']
const EVENT_CATEGORIES = ['Work', 'Personal', 'Health', 'Social', 'Other']
const EVENT_DURATION_OPTIONS = [15, 30, 45, 60, 90, 120]
const MAX_TIME_PER_DAY_OPTIONS = [60, 90, 120, 180]

// Task field values — plain strings to match schema defaults
const TASK_STATUSES = ['todo', 'in_progress', 'done']
const TASK_PRIORITIES = ['Low', 'Medium', 'High']

// Helpers

function randomFutureDate(maxDays: number): Date {
  const date = new Date()
  date.setDate(date.getDate() + faker.number.int({ min: 1, max: maxDays }))
  return date
}

function randomEventEnd(start: Date): Date {
  const end = new Date(start)
  end.setHours(start.getHours() + faker.number.int({ min: 1, max: MAX_EVENT_DURATION_HOURS }))
  return end
}

function pickFriendTargets(userId: string, allUsers: { id: string }[]) {
  return faker.helpers.arrayElements(
    allUsers.filter((u) => u.id !== userId),
    SEED_FRIENDS_PER_USER,
  )
}

// Seeders

async function seedShopItems(): Promise<void> {
  console.log('Seeding shop items...')
  for (const item of SHOP_CATALOGUE) {
    await prisma.shopItem.upsert({
      where: { name: item.name },
      create: { ...item, isActive: true },
      update: { price: item.price, description: item.description, isActive: true },
    })
  }
}

async function seedUsers(passwordHash: string): Promise<{ id: string }[]> {
  console.log('Creating users...')
  const users = []
  for (let i = 0; i < SEED_USER_COUNT; i++) {
    const firstName = faker.person.firstName()
    const lastName = faker.person.lastName()
    const user = await prisma.user.create({
      data: {
        email: faker.internet.email({ firstName, lastName }).toLowerCase(),
        username: faker.internet.username({ firstName, lastName }).toLowerCase(),
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
  return users
}

async function seedProgressForUser(userId: string): Promise<void> {
  await prisma.userProgress.create({
    data: {
      userId,
      points: 0,
      coins: 0,
      level: 1,
      experience: 0,
      streak: 0,
      streakShields: 0,
    },
  })
}

async function seedTasksForUser(userId: string): Promise<void> {
  for (let i = 0; i < SEED_TASKS_PER_USER; i++) {
    const status = faker.helpers.arrayElement(TASK_STATUSES)
    const completedAt = status === 'done' ? faker.date.recent({ days: 7 }) : null

    // subtasks is a String[] on the Task model itself — no separate model
    const subtasks = faker.datatype.boolean(0.5)
      ? Array.from(
          { length: faker.number.int({ min: 1, max: 4 }) },
          () => `${faker.hacker.verb()} ${faker.hacker.noun()}`,
        )
      : []

    const durationMins = faker.helpers.arrayElement(EVENT_DURATION_OPTIONS)

    await prisma.task.create({
      data: {
        userId,
        title: faker.hacker.phrase(),
        description: faker.datatype.boolean(0.6) ? faker.lorem.sentence() : null,
        dueDate: randomFutureDate(MAX_DUE_DATE_DAYS),
        status,
        completedAt,
        durationMins: String(durationMins), // durationMins is String? in schema
        priority: faker.helpers.arrayElement(TASK_PRIORITIES),
        subtasks,
      },
    })
  }
}

async function seedEventsForUser(userId: string): Promise<void> {
  for (let i = 0; i < SEED_EVENTS_PER_USER; i++) {
    const allDay = faker.datatype.boolean(0.2)
    const start = randomFutureDate(MAX_DUE_DATE_DAYS)
    const end = randomEventEnd(start)
    const hasTravelDetails = faker.datatype.boolean(0.3)

    await prisma.event.create({
      data: {
        userId,
        title: faker.lorem.words({ min: 2, max: 4 }),
        description: faker.datatype.boolean(0.5) ? faker.lorem.sentence() : null,
        start: allDay ? new Date(start.toDateString()) : start,
        end: allDay ? new Date(end.toDateString()) : end,
        allDay,
        category: faker.helpers.arrayElement(EVENT_CATEGORIES),
        ...(hasTravelDetails && {
          destinationCoords: {
            lat: faker.location.latitude(),
            lng: faker.location.longitude(),
          },
          travelDuration: faker.number.int({ min: 5, max: 60 }),
          transportMode: faker.helpers.arrayElement(['driving', 'walking', 'transit']),
        }),
      },
    })
  }
}

async function seedExamsForUser(userId: string): Promise<void> {
  for (let i = 0; i < SEED_EXAMS_PER_USER; i++) {
    await prisma.exam.create({
      data: {
        userId,
        title: faker.helpers.arrayElement(EXAM_TITLES),
        examDate: randomFutureDate(MAX_EXAM_DATE_DAYS),
        maxTimePerDay: faker.helpers.arrayElement(MAX_TIME_PER_DAY_OPTIONS),
      },
    })
  }
}

async function seedFriendships(users: { id: string }[]): Promise<void> {
  console.log('Creating friendships...')
  const seenPairs = new Set<string>()

  for (const user of users) {
    const targets = pickFriendTargets(user.id, users)
    for (const target of targets) {
      const pairKey = [user.id, target.id].sort().join('-')
      if (seenPairs.has(pairKey)) continue
      seenPairs.add(pairKey)

      await prisma.friendRequest.create({
        data: {
          senderId: user.id,
          receiverId: target.id,
          status: FriendStatus.ACCEPTED,
        },
      })
    }
  }
}

async function clearInventory(): Promise<void> {
  await prisma.userInventory.deleteMany()
  await prisma.shopItem.deleteMany()
}

// Main

async function main(): Promise<void> {
  console.log('Starting seeding...')

  await clearInventory()
  await seedShopItems()

  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10)
  const users = await seedUsers(passwordHash)

  console.log('Creating progress, tasks, events, and exams...')
  for (const user of users) {
    await seedProgressForUser(user.id)
    await seedTasksForUser(user.id)
    await seedEventsForUser(user.id)
    await seedExamsForUser(user.id)
  }

  await seedFriendships(users)

  console.log('Seeding complete.')
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())