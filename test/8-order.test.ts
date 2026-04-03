import server from '../src/index'
import request from 'supertest'
import { resetDb } from './resetDb'
import { createToken } from '../src/routes/login'
import prisma from '../src/db-config'

beforeAll(async () => {
  await resetDb()
})

describe('Test E-commerce Orders & Stocks API (Shop)', () => {
  let coachToken: string
  let athleteToken: string

  let coachId: string
  let athleteId: string
  let productId: string
  let productStockId: string
  let orderId: string

  beforeAll(async () => {
    // Inject test users directly since user tests handles the generic creation
    const coachUser = await prisma.user.create({
      data: {
        name: 'Coach',
        surname: 'Order',
        age: 30,
        weight: 80,
        phone: '0601020304',
        username: 'coach_order',
        password: 'pwd',
        imageUri: '',
        role: {
          connectOrCreate: {
            where: { name: 'COACH' },
            create: { name: 'COACH' },
          },
        },
      },
    })

    const athleteUser = await prisma.user.create({
      data: {
        name: 'Athlete',
        surname: 'Order',
        age: 20,
        weight: 70,
        phone: '0601020305',
        username: 'athlete_order',
        password: 'pwd',
        imageUri: '',
        role: {
          connectOrCreate: {
            where: { name: 'ATHLETE_PROG' },
            create: { name: 'ATHLETE_PROG' },
          },
        },
      },
    })

    coachId = coachUser.id
    athleteId = athleteUser.id

    coachToken = await createToken(coachId, 'COACH', 'coach_order')
    athleteToken = await createToken(athleteId, 'ATHLETE_PROG', 'athlete_order')

    // Seed e-commerce items
    const product = await prisma.product.create({
      data: {
        name: 'Test T-Shirt',
        price: 30.0,
      },
    })

    const stock = await prisma.productStock.create({
      data: {
        productId: product.id,
        size: 'M',
        quantity: 10,
      },
    })

    productId = product.id
    productStockId = stock.id
  })

  describe('CREATE ORDER (POST /api/order)', () => {
    it('ATHLETE -> Should create an order and deduct stock', async () => {
      const res = await request(server)
        .post('/api/order')
        .set('Authorization', `Bearer ${athleteToken}`)
        .send({
          items: [{ productId, size: 'M', quantity: 2, price: 30.0 }],
        })

      expect(res.status).toBe(201)
      expect(res.body.success).toBe(true)
      orderId = res.body.data[0].message.id

      // Validation de la déduction des stocks
      const updatedStock = await prisma.productStock.findUnique({
        where: { id: productStockId },
      })
      expect(updatedStock?.quantity).toBe(8) // 10 original - 2 ordered
    })

    it('ATHLETE -> Should fail tracking if empty cart', async () => {
      const res = await request(server)
        .post('/api/order')
        .set('Authorization', `Bearer ${athleteToken}`)
        .send({ items: [] })

      expect(res.status).toBe(400)
    })
  })

  describe('GET ATHLETE ORDERS (GET /api/order/my)', () => {
    it('ATHLETE -> Authorize & Ensure proper list', async () => {
      const res = await request(server)
        .get('/api/order/my')
        .set('Authorization', `Bearer ${athleteToken}`)

      expect(res.status).toBe(200)
      expect(res.body.data[0].message.length).toBeGreaterThan(0)
    })
  })

  describe('GET ALL ORDERS & SUMMARY (GET /api/order/)', () => {
    it('COACH -> Allowed to view global orders history', async () => {
      const res = await request(server)
        .get('/api/order')
        .set('Authorization', `Bearer ${coachToken}`)

      expect(res.status).toBe(200)
      expect(res.body.data[0].message.length).toBeGreaterThan(0)
    })

    it('COACH -> Fetches accurate production summary', async () => {
      const res = await request(server)
        .get('/api/order/summary')
        .set('Authorization', `Bearer ${coachToken}`)

      expect(res.status).toBe(200)

      const summary = res.body.data[0].message
      // Should contain an entry for Test T-Shirt size M with quantity 2
      const tshirtEntry = summary.find(
        (s: any) => s.productName === 'Test T-Shirt' && s.size === 'M',
      )
      expect(tshirtEntry).toBeDefined()
      expect(tshirtEntry.quantity).toBe(2)
    })

    it('ATHLETE -> Blocked from viewing coach overview', async () => {
      const res = await request(server)
        .get('/api/order')
        .set('Authorization', `Bearer ${athleteToken}`)

      expect(res.status).toBe(403)
    })
  })

  describe('UPDATE ORDER STATUS (PATCH /api/order/:id/status)', () => {
    it('COACH -> Status modification validation', async () => {
      const res = await request(server)
        .patch(`/api/order/${orderId}/status`)
        .set('Authorization', `Bearer ${coachToken}`)
        .send({ status: 'PROCESSING' })

      expect(res.status).toBe(200)
      expect(res.body.data[0].message.status).toBe('PROCESSING')
    })

    it('COACH -> Fails validation on invalid ENUM status (Zod test)', async () => {
      const res = await request(server)
        .patch(`/api/order/${orderId}/status`)
        .set('Authorization', `Bearer ${coachToken}`)
        .send({ status: 'NOT_REAL_STATUS' })

      expect(res.status).toBe(400) // Zod Validation should be triggered
    })

    it('COACH -> Re-increments stocks when a coach CANCEL an order recursively', async () => {
      const res = await request(server)
        .patch(`/api/order/${orderId}/status`)
        .set('Authorization', `Bearer ${coachToken}`)
        .send({ status: 'CANCELLED' })

      expect(res.status).toBe(200)
      expect(res.body.data[0].message.status).toBe('CANCELLED')

      // Check stock refactor
      const finalStock = await prisma.productStock.findUnique({
        where: { id: productStockId },
      })
      expect(finalStock?.quantity).toBe(10) // 8 previously + 2 refunded
    })
  })

  describe('CANCEL ORDER (DELETE /api/order/:id)', () => {
    let secondOrderId: string

    beforeAll(async () => {
      const newOrder = await request(server)
        .post('/api/order')
        .set('Authorization', `Bearer ${athleteToken}`)
        .send({
          items: [{ productId, size: 'M', quantity: 1, price: 30.0 }],
        })
      secondOrderId = newOrder.body.data[0].message.id
    })

    it('ATHLETE -> Allowed to self-cancel and retrieve stock', async () => {
      const res = await request(server)
        .delete(`/api/order/${secondOrderId}`)
        .set('Authorization', `Bearer ${athleteToken}`)

      expect(res.status).toBe(200)

      const remainingStock = await prisma.productStock.findUnique({
        where: { id: productStockId },
      })
      expect(remainingStock?.quantity).toBe(10) // Since they bought 1 and canceled 1
    })

    it('ATHLETE -> Should fail to cancel a COMPLETED order', async () => {
      // Re-try buying and complete it
      const newOrder = await request(server)
        .post('/api/order')
        .set('Authorization', `Bearer ${athleteToken}`)
        .send({ items: [{ productId, size: 'M', quantity: 1, price: 30.0 }] })

      const thirdOrder = newOrder.body.data[0].message.id

      await request(server)
        .patch(`/api/order/${thirdOrder}/status`)
        .set('Authorization', `Bearer ${coachToken}`)
        .send({ status: 'COMPLETED' })

      const res = await request(server)
        .delete(`/api/order/${thirdOrder}`)
        .set('Authorization', `Bearer ${athleteToken}`)

      expect(res.status).toBe(400) // "ALREADY-PROCESSED" restriction kicks in
    })
  })
})

afterAll(async () => {
  await resetDb()
})
