import prisma from '../src/db-config'

async function resetUserTable() {
  await prisma.program.deleteMany()
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

async function resetProgramTable() {
  await prisma.program.deleteMany()
}

async function resetPaymentTable() {
  await prisma.paymentYear.deleteMany()
}

export async function resetDb() {
  await resetPaymentTable()
  await resetRegisterTable()
  await resetCourseTable()
  await resetStatTable()
  await resetProgramTable()
  await resetUserTable()
}
