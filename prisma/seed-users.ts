import prisma from '../src/db-config'
import bcrypt from 'bcrypt'

const DEFAULT_PASSWORD = process.env.DEFAULT_USER_PASSWORD || '123456'
const SALT_ROUNDS = Number(process.env.SALT_ROUND) || 10

const USERS = [
  {
    name: 'tristan',
    surname: 'debord',
    age: 30,
    weight: 80,
    phone: '0600000001',
    role: 'ADMIN',
  },
  {
    name: 'Coach',
    surname: 'Principal',
    age: 35,
    weight: 75,
    phone: '0600000002',
    role: 'COACH',
  },
  {
    name: 'Athlete',
    surname: 'full',
    age: 25,
    weight: 70,
    phone: '0600000003',
    role: 'ATHLETE_FULL',
  },
  {
    name: 'Athlete',
    surname: 'collectif',
    age: 24,
    weight: 68,
    phone: '0600000004',
    role: 'ATHLETE_CO',
  },
  {
    name: 'Athlete',
    surname: 'prog',
    age: 26,
    weight: 72,
    phone: '0600000005',
    role: 'ATHLETE_PROG',
  },
]

function generateUsername(name: string, surname: string): string {
  return (name.charAt(0) + surname).toLowerCase()
}

async function ensureRoles() {
  const roles = ['ADMIN', 'COACH', 'ATHLETE_PROG', 'ATHLETE_CO', 'ATHLETE_FULL']
  for (const name of roles) {
    const existing = await prisma.role.findUnique({ where: { name } })
    if (!existing) {
      await prisma.role.create({ data: { name, description: '' } })
      console.log(`  ✅ Role "${name}" créé`)
    }
  }
}

async function seedUsers() {
  console.log('🚀 Création des utilisateurs de test...\n')

  await ensureRoles()

  const hashed = await bcrypt.hash(DEFAULT_PASSWORD, SALT_ROUNDS)

  for (const u of USERS) {
    const username = generateUsername(u.name, u.surname)
    const exist = await prisma.user.findFirst({ where: { username } })
    if (exist) {
      console.log(`  ⏭️  "${username}" déjà existant, skip`)
      continue
    }

    const role = await prisma.role.findUnique({ where: { name: u.role } })
    if (!role) {
      console.log(`  ❌ Role "${u.role}" introuvable, skip`)
      continue
    }

    const user = await prisma.user.create({
      data: {
        name: u.name,
        surname: u.surname,
        age: u.age,
        weight: u.weight,
        phone: u.phone,
        username,
        password: hashed,
        role: { connect: { id: role.id } },
        imageUri: 'profileImage/default.png',
      },
    })

    console.log(`  ✅ ${u.role.padEnd(15)} → login: "${username}"  |  mdp: "${DEFAULT_PASSWORD}"`)
  }

  console.log('\n🎉 Terminé !')
}

async function main() {
  try {
    await seedUsers()
  } catch (error) {
    console.error('❌ Erreur :', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
