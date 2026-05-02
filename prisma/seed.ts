import prisma from '../src/db-config'

const ROLES = [
  { name: 'ADMIN', description: 'Administrateur de la plateforme' },
  { name: 'COACH', description: 'Coach sportif' },
  { name: 'ATHLETE_PROG', description: 'Athlète avec programme uniquement' },
  {
    name: 'ATHLETE_CO',
    description: 'Athlète avec cours collectifs uniquement',
  },
  { name: 'ATHLETE_FULL', description: 'Athlète avec accès complet' },
]

async function seedRoles() {
  console.log('🚀 Seeding des rôles...')

  for (const role of ROLES) {
    const existing = await prisma.role.findUnique({
      where: { name: role.name },
    })

    if (existing) {
      console.log(`  ⏭️  Role "${role.name}" déjà existant, skip.`)
    } else {
      await prisma.role.create({ data: role })
      console.log(`  ✅ Role "${role.name}" créé.`)
    }
  }

  console.log('🎉 Seeding terminé !')
}

async function main() {
  try {
    await seedRoles()
  } catch (error) {
    console.error('❌ Erreur lors du seeding :', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
