import prisma from '../src/db-config'

async function resetUserTable() {
  await prisma.user.deleteMany()
}

async function resetStatTable() {
  await prisma.stats.deleteMany()
}

async function resetCourseTable() {
  await prisma.courses.deleteMany()
}

export async function resetDb() {
  await resetCourseTable()
  await resetStatTable()
  await resetUserTable()
}
