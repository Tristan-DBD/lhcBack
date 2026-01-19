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

async function resetRegisterTable() {
  await prisma.registration.deleteMany()
}

export async function resetDb() {
  await resetRegisterTable()
  await resetCourseTable()
  await resetStatTable()
  await resetUserTable()
}
