import { PrismaClient } from '@prisma/client'
import { faker } from '@faker-js/faker'
import bcrypt from 'bcryptjs'

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

// ─────────────────────────────────────────────────────────────────────────────
// SHOP CATALOGUE — seeded so the shop has stock on first run
// Points/inventory are NOT seeded — users earn and spend through the app
// ─────────────────────────────────────────────────────────────────────────────
const SHOP_ITEMS = [
  { name: "Cosmic Cadet",   description: "Every legend starts somewhere.",                              type: "TITLE" as const,      price: 100,  value: "Cosmic Cadet",   icon: "🚀", rarity: "common"    },
  { name: "Nebula Scout",   description: "You've explored the edges of the known universe.",            type: "TITLE" as const,      price: 250,  value: "Nebula Scout",   icon: "🌌", rarity: "rare"      },
  { name: "Star Commander", description: "You command the stars.",                                      type: "TITLE" as const,      price: 500,  value: "Star Commander", icon: "⭐", rarity: "epic"      },
  { name: "Void Walker",    description: "You move through darkness others fear.",                      type: "TITLE" as const,      price: 750,  value: "Void Walker",    icon: "🌑", rarity: "epic"      },
  { name: "Galaxy Brain",   description: "Legendary status. Only the most productive minds earn this.", type: "TITLE" as const,      price: 1500, value: "Galaxy Brain",   icon: "🧠", rarity: "legendary" },
  { name: "Solar Flare",    description: "A blazing gold frame that radiates energy.",                  type: "FRAME" as const,      price: 200,  value: "solar-flare",    icon: "☀️", rarity: "common"    },
  { name: "Nebula Glow",    description: "A dreamy purple-pink cosmic glow.",                           type: "FRAME" as const,      price: 400,  value: "nebula-glow",    icon: "💜", rarity: "rare"      },
  { name: "Aurora Ring",    description: "Northern lights dancing around your profile.",                type: "FRAME" as const,      price: 600,  value: "aurora-ring",    icon: "🌈", rarity: "epic"      },
  { name: "Event Horizon",  description: "The legendary black hole frame.",                             type: "FRAME" as const,      price: 2000, value: "event-horizon",  icon: "🕳️", rarity: "legendary" },
  { name: "XP Boost",       description: "Double your points for the next 24 hours.",                  type: "FUNCTIONAL" as const, price: 300,  value: "xp-boost-24h",  icon: "⚡", rarity: "rare"      },
  { name: "Streak Shield",  description: "Miss a day without breaking your streak. One-time use.",     type: "FUNCTIONAL" as const, price: 150,  value: "streak-shield",  icon: "🛡️", rarity: "common"    },
]

async function main() {
  console.log('Starting seeding...')

  const passwordHash = await bcrypt.hash('Password123', 10)

  // ── SHOP ITEMS ─────────────────────────────────────────────────────────────
  console.log('Seeding shop items...')
  for (const item of SHOP_ITEMS) {
    await prisma.shopItem.upsert({
      where: { name: item.name },
      create: { ...item, isActive: true },
      update: { price: item.price, description: item.description, isActive: true },
    })
    console.log(`  ✓ ${item.name}`)
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

  console.log('\n✅ Seeding complete!')
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
