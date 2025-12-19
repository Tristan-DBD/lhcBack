import prisma from '../src/db-config'

async function resetUserTable() {
  await prisma.user.deleteMany()
}

async function resetStatTable() {
  await prisma.stats.deleteMany()
}

export async function resetDb() {
  await resetStatTable()
  await resetUserTable()
}
