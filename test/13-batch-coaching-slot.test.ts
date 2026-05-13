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

describe("Test batch création de créneaux d'appel", () => {
  let coachTestId: string
  let coachToken: string
  let athleteToken: string

  beforeAll(async () => {
    coachToken = await createToken('00000000-0000-0000-0000-000000000001', 'COACH', 'coachuser')
    athleteToken = await createToken('00000000-0000-0000-0000-000000000002', 'ATHLETE_CO', 'athleteuser')

    const coachRes = await request(server)
      .post('/api/user')
      .set('Authorization', `Bearer ${coachToken}`)
      .send({
        name: 'Coach',
        surname: 'Batch',
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
        surname: 'Batch',
        age: 25,
        weight: 70,
        phone: '0601020305',
        username: 'athleteuser',
        password: '123456',
        role: 'ATHLETE_CO',
      })

    coachTestId = coachRes.body.data[0].message.id
  })

  describe('BATCH CREATE (POST /api/coaching-slots/batch)', () => {
    it('COACH -> Création de 3 créneaux sur 3 jours', async () => {
      const tomorrow = new Date(Date.now() + 86400000)
      const in3Days = new Date(Date.now() + 3 * 86400000)

      const res = await request(server)
        .post('/api/coaching-slots/batch')
        .set('Authorization', `Bearer ${coachToken}`)
        .send({
          coachId: coachTestId,
          startTime: '13:00',
          endTime: '13:30',
          startDate: tomorrow.toISOString(),
          endDate: in3Days.toISOString(),
        })

      expect(res.status).toBe(201)
      expect(res.body.success).toBe(true)
      expect(res.body.data[0].message).toBeInstanceOf(Array)
      expect(res.body.data[0].message).toHaveLength(3)
    })

    it('COACH -> Création sur 1 seul jour', async () => {
      const tomorrow = new Date(Date.now() + 86400000)

      const res = await request(server)
        .post('/api/coaching-slots/batch')
        .set('Authorization', `Bearer ${coachToken}`)
        .send({
          coachId: coachTestId,
          startTime: '10:00',
          endTime: '11:00',
          startDate: tomorrow.toISOString(),
          endDate: tomorrow.toISOString(),
        })

      expect(res.status).toBe(201)
      expect(res.body.data[0].message).toHaveLength(1)
    })

    it('ATHLETE -> Unauthorize (403)', async () => {
      const tomorrow = new Date(Date.now() + 86400000)
      const in3Days = new Date(Date.now() + 3 * 86400000)

      const res = await request(server)
        .post('/api/coaching-slots/batch')
        .set('Authorization', `Bearer ${athleteToken}`)
        .send({
          coachId: coachTestId,
          startTime: '13:00',
          endTime: '13:30',
          startDate: tomorrow.toISOString(),
          endDate: in3Days.toISOString(),
        })

      expect(res.status).toBe(403)
    })

    it('NO TOKEN -> Unauthorized', async () => {
      const tomorrow = new Date(Date.now() + 86400000)
      const in3Days = new Date(Date.now() + 3 * 86400000)

      const res = await request(server)
        .post('/api/coaching-slots/batch')
        .send({
          coachId: coachTestId,
          startTime: '13:00',
          endTime: '13:30',
          startDate: tomorrow.toISOString(),
          endDate: in3Days.toISOString(),
        })

      expect(res.status).toBe(401)
    })

    it('MAUVAIS FORMAT HEURE -> 400', async () => {
      const tomorrow = new Date(Date.now() + 86400000)
      const in3Days = new Date(Date.now() + 3 * 86400000)

      const res = await request(server)
        .post('/api/coaching-slots/batch')
        .set('Authorization', `Bearer ${coachToken}`)
        .send({
          coachId: coachTestId,
          startTime: '25:00',
          endTime: '13:30',
          startDate: tomorrow.toISOString(),
          endDate: in3Days.toISOString(),
        })

      expect(res.status).toBe(400)
    })

    it('END TIME AVANT START TIME -> 400', async () => {
      const tomorrow = new Date(Date.now() + 86400000)

      const res = await request(server)
        .post('/api/coaching-slots/batch')
        .set('Authorization', `Bearer ${coachToken}`)
        .send({
          coachId: coachTestId,
          startTime: '14:00',
          endTime: '13:00',
          startDate: tomorrow.toISOString(),
          endDate: tomorrow.toISOString(),
        })

      expect(res.status).toBe(400)
    })

    it('END DATE AVANT START DATE -> 400', async () => {
      const tomorrow = new Date(Date.now() + 86400000)
      const yesterday = new Date(Date.now() - 86400000)

      const res = await request(server)
        .post('/api/coaching-slots/batch')
        .set('Authorization', `Bearer ${coachToken}`)
        .send({
          coachId: coachTestId,
          startTime: '10:00',
          endTime: '11:00',
          startDate: tomorrow.toISOString(),
          endDate: yesterday.toISOString(),
        })

      expect(res.status).toBe(400)
    })

    it('UUID INVALIDE -> 400', async () => {
      const tomorrow = new Date(Date.now() + 86400000)

      const res = await request(server)
        .post('/api/coaching-slots/batch')
        .set('Authorization', `Bearer ${coachToken}`)
        .send({
          coachId: 'not-a-uuid',
          startTime: '10:00',
          endTime: '11:00',
          startDate: tomorrow.toISOString(),
          endDate: tomorrow.toISOString(),
        })

      expect(res.status).toBe(400)
    })
  })
})
