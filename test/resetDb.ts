import prisma from '../src/db-config'

async function resetUserTable() {
  await prisma.refreshToken.deleteMany()
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

async function resetShopAndOrders() {
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.productStock.deleteMany()
  await prisma.product.deleteMany()
}

async function resetCoachingSlots() {
  await prisma.slotBooking.deleteMany()
  await prisma.coachingSlot.deleteMany()
}

export async function resetDb() {
  try {
    await resetPaymentTable()
    await resetRegisterTable()
    await resetCourseTable()
    await resetStatTable()
    await resetProgramTable()
    await resetShopAndOrders()
    await resetCoachingSlots()
    await resetUserTable()
  } catch (e) {
    console.error('Error during resetDb:', e)
  }
}
