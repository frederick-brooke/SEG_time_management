import { PrismaClient } from '@prisma/client'
import { faker } from '@faker-js/faker'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting seeding users...')
  
  // Clear existing users
  console.log('Clearing existing users...')
  await prisma.user.deleteMany()
  
  console.log('Creating users...')
  
  const userCount = 20
  
  for (let i = 0; i < userCount; i++) {
    const firstName = faker.person.firstName()
    const lastName = faker.person.lastName()
    const username = faker.internet.username({ firstName, lastName }).toLowerCase()
    
    const user = await prisma.user.create({
      data: {
        email: faker.internet.email({ firstName, lastName }).toLowerCase(),
        username: username,
        fname: firstName,
        lname: lastName,
        bio: faker.datatype.boolean(0.7) ? faker.lorem.sentence() : null, // 70% have bios
        pfp: faker.datatype.boolean(0.6) ? faker.image.avatar() : null, // 60% have profile pictures
        // passwordHash is optional in schema, so null
      },
    })
  }
  
  console.log(`✅ Seeding completed! Created ${userCount} users.`)
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })