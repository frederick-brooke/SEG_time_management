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

async function main() {
  console.log('Starting seeding...')

  const passwordHash = await bcrypt.hash('Password123', 10)

  // --- Users ---
  console.log('Creating users...')
  const userCount = 20
  const users = []

  for (let i = 0; i < userCount; i++) {
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

  // --- Tasks (currently 3 per user) ---
  console.log('Creating tasks...')
  for (const user of users) {
    for (let t = 0; t < 3; t++) {
      const dueDate = randomFutureDate(20)
      const status = faker.helpers.arrayElement(TASK_STATUSES)
      await prisma.task.create({
        data: {
          title: faker.hacker.phrase(),
          description: faker.datatype.boolean(0.6) ? faker.lorem.sentence() : null,
          dueDate,
          completed: status === 'completed',
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

main()
  .catch((e) => {
    console.error('Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })