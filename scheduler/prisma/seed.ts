/**
 * Seeds the database with mock data for development.
 * Creates users, tasks, events, exams, shop items, and friendships.
 *
 * Uses Faker for realistic data generation.
 */

import { PrismaClient, FriendStatus } from '@prisma/client'
import { faker } from '@faker-js/faker'
import bcrypt from 'bcryptjs'
import { SHOP_CATALOGUE } from '../src/lib/shop-catalogue'

const prisma = new PrismaClient()

// Constants

const SEED_USER_COUNT = 300
const SEED_TASKS_PER_USER = 5
const SEED_EVENTS_PER_USER = 5
const SEED_EXAMS_PER_USER = 4
const SEED_FRIENDS_PER_USER = 5
const SEED_PASSWORD = 'Password123!'
const MAX_EVENT_DURATION_HOURS = 3
const MAX_DUE_DATE_DAYS = 20
const MAX_EXAM_DATE_DAYS = 30
const EXAM_TITLES = ['CS1 Exam', 'Maths Exam', 'Ethics Exam']
const EVENT_CATEGORIES = ['Work', 'Personal', 'Health', 'Social', 'Other']
const EVENT_DURATION_OPTIONS = [15, 30, 45, 60, 90, 120]
const MAX_TIME_PER_DAY_OPTIONS = [60, 90, 120, 180]

// Task field values
const TASK_STATUSES = ['todo', 'in_progress', 'done']
const TASK_PRIORITIES = ['Low', 'Medium', 'High']

// Helpers

async function clearAll(): Promise<void> {
  await prisma.userInventory.deleteMany()
  await prisma.shopItem.deleteMany()
  await prisma.friendRequest.deleteMany()
  await prisma.task.deleteMany()
  await prisma.revisionMaterial.deleteMany()
  await prisma.exam.deleteMany()
  await prisma.event.deleteMany()
  await prisma.pointTransaction.deleteMany()
  await prisma.userProgress.deleteMany()
  await prisma.userPreferences.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.checkIn.deleteMany()
  await prisma.scheduleLog.deleteMany()
  await prisma.category.deleteMany()
  await prisma.savedLocation.deleteMany()
  await prisma.account.deleteMany()
  await prisma.appeal.deleteMany()
  await prisma.report.deleteMany()
  await prisma.user.deleteMany()
}

function randomFutureDate(maxDays: number): Date {
  const date = new Date()
  date.setDate(date.getDate() + faker.number.int({ min: 1, max: maxDays }))
  return date
}

function randomPastDate(maxDays: number): Date {
  const date = new Date()
  date.setDate(date.getDate() - faker.number.int({ min: 1, max: maxDays }))
  return date
}

function randomTimeOfDay(date: Date): Date {
  const result = new Date(date)
  result.setHours(faker.number.int({ min: 7, max: 20 }))
  result.setMinutes(faker.helpers.arrayElement([0, 15, 30, 45]))
  result.setSeconds(0)
  result.setMilliseconds(0)
  return result
}

function randomEventEnd(start: Date): Date {
  const end = new Date(start)
  const durationMins = faker.helpers.arrayElement(EVENT_DURATION_OPTIONS) // [15, 30, 45, 60, 90, 120]
  end.setMinutes(start.getMinutes() + durationMins)
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

async function seedDefaultUsers(passwordHash: string): Promise<{ id: string }[]> {
  console.log('Creating default users...')
  const defaultUsers = []
  
  const johnDoe = await prisma.user.create({
    data: {
      email: 'example@mail.com',
      username: 'john-doe',
      fname: 'John',
      lname: 'Doe',
      bio: null,
      pfp: null,
      passwordHash,
      location: {
        lat: faker.location.nearbyGPSCoordinate({
          origin: [51.5072, -0.1276],
          radius: 15,
          isMetric: false,
        })[0],
        lng: faker.location.nearbyGPSCoordinate({
          origin: [51.5072, -0.1276],
          radius: 15,
          isMetric: false,
        })[1],
      },
      locationHidden: true,
    },
  })
  defaultUsers.push(johnDoe)

  const janeDoe = await prisma.user.create({
    data: {
      email: 'example2@mail.com',
      username: 'jane-doe',
      fname: 'Jane',
      lname: 'Doe',
      bio: null,
      pfp: null,
      passwordHash,
      role: 'SUPERUSER',
      location: {
        lat: faker.location.nearbyGPSCoordinate({
          origin: [51.5072, -0.1276],
          radius: 15,
          isMetric: false,
        })[0],
        lng: faker.location.nearbyGPSCoordinate({
          origin: [51.5072, -0.1276],
          radius: 15,
          isMetric: false,
        })[1],
      },
      locationHidden: true,
    },
  })
  defaultUsers.push(janeDoe)

  console.log(`Created ${defaultUsers.length} default users.`)
  return defaultUsers
}

async function seedUsers(passwordHash: string): Promise<{ id: string }[]> {
  console.log('Creating random users...')
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
        location: {
          lat: faker.location.nearbyGPSCoordinate({
            origin: [51.5072, -0.1276],
            radius: 15,
            isMetric: false,
          })[0],
          lng: faker.location.nearbyGPSCoordinate({
            origin: [51.5072, -0.1276],
            radius: 15,
            isMetric: false,
          })[1],
        },
        locationHidden: true,
      },
    })
    users.push(user)
  }
  console.log(`Created ${users.length} random users.`)
  return users
}

async function seedPreferencesForUser(userId: string): Promise<void> {
  const workStart = faker.helpers.arrayElement(['07:00', '08:00', '09:00'])
  const workEnd = faker.helpers.arrayElement(['17:00', '18:00', '19:00', '20:00'])
  const daysOff = faker.helpers.arrayElements(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], { min: 1, max: 2 })

  await prisma.userPreferences.create({
    data: {
      userId,
      workStartTime: workStart,
      workEndTime: workEnd,
      daysOff,
      sessionLength: faker.helpers.arrayElement([25, 45, 60, 90]),
      breakLength: faker.helpers.arrayElement([5, 10, 15]),
      breaksPerDay: faker.number.int({ min: 1, max: 5 }),
      taskOrder: faker.helpers.arrayElement(['priority', 'dueDate', 'createdAt']),
      maxTasksPerDay: faker.number.int({ min: 3, max: 10 }),
      defaultTaskDuration: faker.helpers.arrayElement([15, 30, 45, 60]),
      reminderDays: faker.number.int({ min: 1, max: 7 }),
    },
  })
}

async function seedProgressForUser(userId: string): Promise<void> {
  const level = faker.number.int({ min: 1, max: 20 })
  const points = level * faker.number.int({ min: 200, max: 800 })
  const coins = faker.number.int({ min: 0, max: 500 })
  const streak = faker.number.int({ min: 0, max: 30 })

  await prisma.userProgress.create({
    data: {
      userId,
      points,
      coins,
      level,
      experience: faker.number.int({ min: 0, max: 1000 }),
      streak,
      streakShields: faker.number.int({ min: 0, max: 3 }),
    },
  })
}

async function seedTasksForUser(userId: string, examIds: string[], eventIds: string[]): Promise<void> {
  for (let i = 0; i < SEED_TASKS_PER_USER; i++) {
    const status = faker.helpers.arrayElement(TASK_STATUSES)
    const completed = status === 'done'
    const dueDate = status === 'done' ? randomPastDate(60) : randomFutureDate(MAX_DUE_DATE_DAYS)
    const completedAt = status === 'done' ? faker.date.between({ from: dueDate, to: new Date() }) : null

    const subtasks = faker.datatype.boolean(0.5)
      ? Array.from(
          { length: faker.number.int({ min: 1, max: 4 }) },
          () => `${faker.hacker.verb()} ${faker.hacker.noun()}`,
        )
      : []

    const durationMins = faker.helpers.arrayElement(EVENT_DURATION_OPTIONS)

    // 20% linked to an exam, 20% linked to an event, rest standalone
    const roll = faker.number.float({ min: 0, max: 1 })
    const examId = roll < 0.2 ? faker.helpers.arrayElement(examIds) : null
    const eventId = roll >= 0.2 && roll < 0.4 ? faker.helpers.arrayElement(eventIds) : null

    await prisma.task.create({
      data: {
        userId,
        title: faker.hacker.phrase(),
        description: faker.datatype.boolean(0.6) ? faker.lorem.sentence() : null,
        dueDate,
        status,
        completed,
        completedAt,
        duration: durationMins,
        durationMins: String(durationMins),
        priority: faker.helpers.arrayElement(TASK_PRIORITIES),
        subtasks,
        ...(examId && { examId }),
        ...(eventId && { eventId }),
      },
    })
  }
}

async function seedEventsForUser(userId: string): Promise<string[]> {
  const eventIds: string[] = []
  for (let i = 0; i < SEED_EVENTS_PER_USER; i++) {
    const allDay = false
    const isPast = faker.datatype.boolean(0.4)
    const rawStart = isPast ? randomPastDate(60) : randomFutureDate(MAX_DUE_DATE_DAYS)
    const start = allDay ? rawStart : randomTimeOfDay(rawStart)
    const end = allDay ? rawStart : randomEventEnd(start)
    const hasTravelDetails = faker.datatype.boolean(0.3)

    const event = await prisma.event.create({
      data: {
        userId,
        title: faker.lorem.words({ min: 2, max: 4 }),
        description: faker.datatype.boolean(0.5) ? faker.lorem.sentence() : null,
        start: allDay ? new Date(start.toDateString()) : start,
        end: allDay ? new Date(end.toDateString()) : end,
        allDay,
        category: faker.helpers.arrayElement(EVENT_CATEGORIES),
        ...(hasTravelDetails && {
          startCoords: {
            lat: faker.location.latitude(),
            lng: faker.location.longitude(),
          },
          destinationCoords: {
            lat: faker.location.latitude(),
            lng: faker.location.longitude(),
          },
          travelDuration: faker.number.int({ min: 5, max: 60 }),
          transportMode: faker.helpers.arrayElement(['driving', 'walking', 'transit']),
        }),
      },
    })
    eventIds.push(event.id)
  }
  return eventIds
}

async function seedExamsForUser(userId: string): Promise<string[]> {
  const examIds: string[] = []
  for (let i = 0; i < SEED_EXAMS_PER_USER; i++) {
    const exam = await prisma.exam.create({
      data: {
        userId,
        title: faker.helpers.arrayElement(EXAM_TITLES),
        examDate: randomFutureDate(MAX_EXAM_DATE_DAYS),
        maxTimePerDay: faker.helpers.arrayElement(MAX_TIME_PER_DAY_OPTIONS),
      },
    })
    examIds.push(exam.id)
  }
  return examIds
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

// Main

async function main(): Promise<void> {
  console.log('Starting seeding...')

  await clearAll()
  await seedShopItems()

  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10)
  
  // Create default users first
  const defaultUsers = await seedDefaultUsers(passwordHash)
  
  // Create random users
  const randomUsers = await seedUsers(passwordHash)
  
  // Combine default and random users
  const users = [...defaultUsers, ...randomUsers]

  console.log('Creating progress, tasks, events, and exams...')
  for (const user of users) {
    await seedProgressForUser(user.id)
    await seedPreferencesForUser(user.id)
    const examIds = await seedExamsForUser(user.id)
    const eventIds = await seedEventsForUser(user.id)
    await seedTasksForUser(user.id, examIds, eventIds)
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