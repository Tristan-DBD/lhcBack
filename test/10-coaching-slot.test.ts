import server from '../src/index'
import request from 'supertest'
import { resetDb } from './resetDb'
import { createToken } from '../src/routes/login'

beforeAll(async () => {
  await resetDb()
})

afterAll(async () => {
  await resetDb()
})

describe("Test CRUD pour les créneaux d'appel coach", () => {
  let coachTestId: number
  let athleteTestId: number
  let slotTestId: number
  let coachToken: string
  let athleteToken: string

  beforeAll(async () => {
    coachToken = await createToken(1, 'COACH', 'coachuser')
    athleteToken = await createToken(2, 'ATHLETE_CO', 'athleteuser')

    const coachRes = await request(server)
      .post('/api/user')
      .set('Authorization', `Bearer ${coachToken}`)
      .send({
        name: 'Coach',
        surname: 'Test',
        age: 30,
        weight: 80,
        phone: '0601020304',
        username: 'coachuser',
        password: '123456',
        role: 'COACH',
      })

    const athleteRes = await request(server)
      .post('/api/user')
      .set('Authorization', `Bearer ${coachToken}`)
      .send({
        name: 'Athlete',
        surname: 'Test',
        age: 25,
        weight: 70,
        phone: '0601020305',
        username: 'athleteuser',
        password: '123456',
        role: 'ATHLETE_CO',
      })

    coachTestId = coachRes.body.data[0].message.id
    athleteTestId = athleteRes.body.data[0].message.id
  })

  // ─────────────────────────────────────────────────────────
  // CREATE
  // ─────────────────────────────────────────────────────────
  describe('CREATE (POST /api/coaching-slots)', () => {
    it('COACH -> Authorize', async () => {
      const startTime = new Date(Date.now() + 24 * 60 * 60 * 1000)
      const endTime = new Date(startTime.getTime() + 60 * 60 * 1000)

      const res = await request(server)
        .post('/api/coaching-slots')
        .set('Authorization', `Bearer ${coachToken}`)
        .send({
          coachId: coachTestId,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
        })

      expect(res.status).toBe(201)
      expect(res.body.success).toBe(true)
      slotTestId = res.body.data[0].message.id
    })

    it('ATHLETE -> Unauthorize (403)', async () => {
      const startTime = new Date(Date.now() + 24 * 60 * 60 * 1000)
      const endTime = new Date(startTime.getTime() + 60 * 60 * 1000)

      const res = await request(server)
        .post('/api/coaching-slots')
        .set('Authorization', `Bearer ${athleteToken}`)
        .send({
          coachId: coachTestId,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
        })

      expect(res.status).toBe(403)
      expect(res.body.success).toBe(false)
    })

    it('NO TOKEN -> Unauthorized (401)', async () => {
      const startTime = new Date(Date.now() + 24 * 60 * 60 * 1000)
      const endTime = new Date(startTime.getTime() + 60 * 60 * 1000)

      const res = await request(server).post('/api/coaching-slots').send({
        coachId: coachTestId,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
      })

      expect(res.status).toBe(401)
    })

    it('endTime <= startTime -> Bad Request (400)', async () => {
      const startTime = new Date(Date.now() + 24 * 60 * 60 * 1000)
      const endTime = new Date(startTime.getTime() - 60 * 60 * 1000) // Avant startTime

      const res = await request(server)
        .post('/api/coaching-slots')
        .set('Authorization', `Bearer ${coachToken}`)
        .send({
          coachId: coachTestId,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
        })

      expect(res.status).toBe(400)
      expect(res.body.success).toBe(false)
    })

    it('Missing fields -> Bad Request (400)', async () => {
      const res = await request(server)
        .post('/api/coaching-slots')
        .set('Authorization', `Bearer ${coachToken}`)
        .send({ coachId: coachTestId }) // startTime et endTime manquants

      expect(res.status).toBe(400)
      expect(res.body.success).toBe(false)
    })
  })

  // ─────────────────────────────────────────────────────────
  // GET ALL
  // ─────────────────────────────────────────────────────────
  describe('GET ALL (GET /api/coaching-slots)', () => {
    it('COACH -> Authorize', async () => {
      const res = await request(server)
        .get('/api/coaching-slots')
        .set('Authorization', `Bearer ${coachToken}`)

      expect(res.body.success).toBe(true)
      expect(Array.isArray(res.body.data)).toBe(true)
    })

    it('ATHLETE -> Authorize', async () => {
      const res = await request(server)
        .get('/api/coaching-slots')
        .set('Authorization', `Bearer ${athleteToken}`)

      expect(res.body.success).toBe(true)
      expect(Array.isArray(res.body.data)).toBe(true)
    })

    it('NO TOKEN -> Unauthorized (401)', async () => {
      const res = await request(server).get('/api/coaching-slots')

      expect(res.status).toBe(401)
    })

    it('Filter by coachId -> returns filtered slots', async () => {
      const res = await request(server)
        .get(`/api/coaching-slots?coachId=${coachTestId}`)
        .set('Authorization', `Bearer ${coachToken}`)

      expect(res.body.success).toBe(true)
      expect(Array.isArray(res.body.data)).toBe(true)
    })

    it('Filter by date range -> returns filtered slots', async () => {
      const start = new Date(Date.now()).toISOString()
      const end = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

      const res = await request(server)
        .get(`/api/coaching-slots?startDate=${start}&endDate=${end}`)
        .set('Authorization', `Bearer ${coachToken}`)

      expect(res.body.success).toBe(true)
      expect(Array.isArray(res.body.data)).toBe(true)
    })
  })

  // ─────────────────────────────────────────────────────────
  // GET BY ID
  // ─────────────────────────────────────────────────────────
  describe('GET BY ID (GET /api/coaching-slots/:id)', () => {
    it('COACH -> Authorize', async () => {
      const res = await request(server)
        .get(`/api/coaching-slots/${slotTestId}`)
        .set('Authorization', `Bearer ${coachToken}`)

      expect(res.body.success).toBe(true)
      expect(res.body.data[0].message.id).toBe(slotTestId)
    })

    it('ATHLETE -> Authorize', async () => {
      const res = await request(server)
        .get(`/api/coaching-slots/${slotTestId}`)
        .set('Authorization', `Bearer ${athleteToken}`)

      expect(res.body.success).toBe(true)
      expect(res.body.data[0].message.id).toBe(slotTestId)
    })

    it('Not found -> 404', async () => {
      const res = await request(server)
        .get('/api/coaching-slots/99999')
        .set('Authorization', `Bearer ${coachToken}`)

      expect(res.status).toBe(404)
      expect(res.body.success).toBe(false)
    })

    it('NO TOKEN -> Unauthorized (401)', async () => {
      const res = await request(server).get(`/api/coaching-slots/${slotTestId}`)

      expect(res.status).toBe(401)
    })
  })

  // ─────────────────────────────────────────────────────────
  // UPDATE
  // ─────────────────────────────────────────────────────────
  describe('UPDATE (PUT /api/coaching-slots/:id)', () => {
    it('COACH -> Authorize', async () => {
      const newStartTime = new Date(Date.now() + 48 * 60 * 60 * 1000)
      const newEndTime = new Date(newStartTime.getTime() + 90 * 60 * 1000)

      const res = await request(server)
        .put(`/api/coaching-slots/${slotTestId}`)
        .set('Authorization', `Bearer ${coachToken}`)
        .send({
          startTime: newStartTime.toISOString(),
          endTime: newEndTime.toISOString(),
        })

      expect(res.body.success).toBe(true)
    })

    it('ATHLETE -> Unauthorize (403)', async () => {
      const res = await request(server)
        .put(`/api/coaching-slots/${slotTestId}`)
        .set('Authorization', `Bearer ${athleteToken}`)
        .send({
          startTime: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
          endTime: new Date(Date.now() + 50 * 60 * 60 * 1000).toISOString(),
        })

      expect(res.status).toBe(403)
    })

    it('Not found -> 404', async () => {
      const res = await request(server)
        .put('/api/coaching-slots/99999')
        .set('Authorization', `Bearer ${coachToken}`)
        .send({
          startTime: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
          endTime: new Date(Date.now() + 50 * 60 * 60 * 1000).toISOString(),
        })

      expect(res.status).toBe(404)
      expect(res.body.success).toBe(false)
    })

    it('NO TOKEN -> Unauthorized (401)', async () => {
      const res = await request(server)
        .put(`/api/coaching-slots/${slotTestId}`)
        .send({
          startTime: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
          endTime: new Date(Date.now() + 50 * 60 * 60 * 1000).toISOString(),
        })

      expect(res.status).toBe(401)
    })
  })

  // ─────────────────────────────────────────────────────────
  // BOOK
  // ─────────────────────────────────────────────────────────
  describe('BOOK (POST /api/coaching-slots/book)', () => {
    let slotToBookId: number

    beforeAll(async () => {
      const startTime = new Date(Date.now() + 96 * 60 * 60 * 1000)
      const endTime = new Date(startTime.getTime() + 60 * 60 * 1000)

      const res = await request(server)
        .post('/api/coaching-slots')
        .set('Authorization', `Bearer ${coachToken}`)
        .send({
          coachId: coachTestId,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
        })

      slotToBookId = res.body.data[0].message.id
    })

    it('ATHLETE -> Authorize', async () => {
      const res = await request(server)
        .post('/api/coaching-slots/book')
        .set('Authorization', `Bearer ${athleteToken}`)
        .send({ userId: athleteTestId, slotId: slotToBookId })

      expect(res.body.success).toBe(true)
    })

    it('Déjà inscrit -> Bad Request (400, ALREADY-BOOKED)', async () => {
      const res = await request(server)
        .post('/api/coaching-slots/book')
        .set('Authorization', `Bearer ${athleteToken}`)
        .send({ userId: athleteTestId, slotId: slotToBookId })

      expect(res.status).toBe(400)
      expect(res.body.success).toBe(false)
    })

    it('Créneau déjà pris par un autre -> Bad Request (400, ALREADY-TAKEN)', async () => {
      // coachToken essaie de réserver le même créneau déjà pris par l'athlète
      const res = await request(server)
        .post('/api/coaching-slots/book')
        .set('Authorization', `Bearer ${coachToken}`)
        .send({ userId: coachTestId, slotId: slotToBookId })

      expect(res.status).toBe(400)
      expect(res.body.success).toBe(false)
    })

    it('Créneau inexistant -> Not Found (404)', async () => {
      const res = await request(server)
        .post('/api/coaching-slots/book')
        .set('Authorization', `Bearer ${athleteToken}`)
        .send({ userId: athleteTestId, slotId: 99999 })

      expect(res.status).toBe(404)
      expect(res.body.success).toBe(false)
    })

    it('NO TOKEN -> Unauthorized (401)', async () => {
      const res = await request(server)
        .post('/api/coaching-slots/book')
        .send({ userId: athleteTestId, slotId: slotToBookId })

      expect(res.status).toBe(401)
    })

    it('Missing fields -> Bad Request (400)', async () => {
      const res = await request(server)
        .post('/api/coaching-slots/book')
        .set('Authorization', `Bearer ${athleteToken}`)
        .send({ userId: athleteTestId }) // slotId manquant

      expect(res.status).toBe(400)
    })
  })

  // ─────────────────────────────────────────────────────────
  // CANCEL
  // ─────────────────────────────────────────────────────────
  describe('CANCEL (POST /api/coaching-slots/cancel)', () => {
    let slotToCancelId: number

    beforeAll(async () => {
      const startTime = new Date(Date.now() + 120 * 60 * 60 * 1000)
      const endTime = new Date(startTime.getTime() + 60 * 60 * 1000)

      const res = await request(server)
        .post('/api/coaching-slots')
        .set('Authorization', `Bearer ${coachToken}`)
        .send({
          coachId: coachTestId,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
        })

      slotToCancelId = res.body.data[0].message.id

      // Réserver d'abord avant de tester l'annulation
      await request(server)
        .post('/api/coaching-slots/book')
        .set('Authorization', `Bearer ${athleteToken}`)
        .send({ userId: athleteTestId, slotId: slotToCancelId })
    })

    it('ATHLETE -> Authorize (annulation de sa propre résa)', async () => {
      const res = await request(server)
        .post('/api/coaching-slots/cancel')
        .set('Authorization', `Bearer ${athleteToken}`)
        .send({ userId: athleteTestId, slotId: slotToCancelId })

      expect(res.body.success).toBe(true)
    })

    it('Non réservé -> Bad Request (400, NOT-BOOKED)', async () => {
      const res = await request(server)
        .post('/api/coaching-slots/cancel')
        .set('Authorization', `Bearer ${athleteToken}`)
        .send({ userId: athleteTestId, slotId: slotToCancelId })

      expect(res.status).toBe(400)
      expect(res.body.success).toBe(false)
    })

    it('Créneau inexistant -> Not Found (404)', async () => {
      const res = await request(server)
        .post('/api/coaching-slots/cancel')
        .set('Authorization', `Bearer ${athleteToken}`)
        .send({ userId: athleteTestId, slotId: 99999 })

      expect(res.status).toBe(404)
      expect(res.body.success).toBe(false)
    })

    it('NO TOKEN -> Unauthorized (401)', async () => {
      const res = await request(server)
        .post('/api/coaching-slots/cancel')
        .send({ userId: athleteTestId, slotId: slotToCancelId })

      expect(res.status).toBe(401)
    })

    it('Missing fields -> Bad Request (400)', async () => {
      const res = await request(server)
        .post('/api/coaching-slots/cancel')
        .set('Authorization', `Bearer ${athleteToken}`)
        .send({ userId: athleteTestId }) // slotId manquant

      expect(res.status).toBe(400)
    })
  })

  // ─────────────────────────────────────────────────────────
  // GET BOOKINGS BY SLOT
  // ─────────────────────────────────────────────────────────
  describe('GET BOOKINGS (GET /api/coaching-slots/bookings/:id)', () => {
    let slotWithBookingId: number

    beforeAll(async () => {
      const startTime = new Date(Date.now() + 144 * 60 * 60 * 1000)
      const endTime = new Date(startTime.getTime() + 60 * 60 * 1000)

      const res = await request(server)
        .post('/api/coaching-slots')
        .set('Authorization', `Bearer ${coachToken}`)
        .send({
          coachId: coachTestId,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
        })

      slotWithBookingId = res.body.data[0].message.id

      // Réserver le créneau pour avoir une résa
      await request(server)
        .post('/api/coaching-slots/book')
        .set('Authorization', `Bearer ${athleteToken}`)
        .send({ userId: athleteTestId, slotId: slotWithBookingId })
    })

    it('COACH -> Authorize et retourne les bookings', async () => {
      const res = await request(server)
        .get(`/api/coaching-slots/bookings/${slotWithBookingId}`)
        .set('Authorization', `Bearer ${coachToken}`)

      expect(res.body.success).toBe(true)
      expect(Array.isArray(res.body.data[0].message)).toBe(true)
      expect(res.body.data[0].message.length).toBeGreaterThan(0)
    })

    it('ATHLETE -> Unauthorize (403)', async () => {
      const res = await request(server)
        .get(`/api/coaching-slots/bookings/${slotWithBookingId}`)
        .set('Authorization', `Bearer ${athleteToken}`)

      expect(res.status).toBe(403)
    })

    it('NOT FOUND -> 404', async () => {
      const res = await request(server)
        .get('/api/coaching-slots/bookings/99999')
        .set('Authorization', `Bearer ${coachToken}`)

      expect(res.status).toBe(404)
      expect(res.body.success).toBe(false)
    })

    it('NO TOKEN -> Unauthorized (401)', async () => {
      const res = await request(server).get(
        `/api/coaching-slots/bookings/${slotWithBookingId}`,
      )

      expect(res.status).toBe(401)
    })
  })

  // ─────────────────────────────────────────────────────────
  // DELETE
  // ─────────────────────────────────────────────────────────
  describe('DELETE (DELETE /api/coaching-slots/:id)', () => {
    let slotToDeleteId: number

    beforeAll(async () => {
      const startTime = new Date(Date.now() + 72 * 60 * 60 * 1000)
      const endTime = new Date(startTime.getTime() + 60 * 60 * 1000)

      const res = await request(server)
        .post('/api/coaching-slots')
        .set('Authorization', `Bearer ${coachToken}`)
        .send({
          coachId: coachTestId,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
        })

      slotToDeleteId = res.body.data[0].message.id
    })

    it('ATHLETE -> Unauthorize (403)', async () => {
      const res = await request(server)
        .delete(`/api/coaching-slots/${slotToDeleteId}`)
        .set('Authorization', `Bearer ${athleteToken}`)

      expect(res.status).toBe(403)
    })

    it('Not found -> 404', async () => {
      const res = await request(server)
        .delete('/api/coaching-slots/99999')
        .set('Authorization', `Bearer ${coachToken}`)

      expect(res.status).toBe(404)
      expect(res.body.success).toBe(false)
    })

    it('NO TOKEN -> Unauthorized (401)', async () => {
      const res = await request(server).delete(
        `/api/coaching-slots/${slotToDeleteId}`,
      )

      expect(res.status).toBe(401)
    })

    it('COACH -> Authorize', async () => {
      const res = await request(server)
        .delete(`/api/coaching-slots/${slotToDeleteId}`)
        .set('Authorization', `Bearer ${coachToken}`)

      expect(res.body.success).toBe(true)
    })

    it('Déjà supprimé -> 404', async () => {
      const res = await request(server)
        .delete(`/api/coaching-slots/${slotToDeleteId}`)
        .set('Authorization', `Bearer ${coachToken}`)

      expect(res.status).toBe(404)
      expect(res.body.success).toBe(false)
    })
  })
})
