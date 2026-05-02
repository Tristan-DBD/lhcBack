import server from '../src'
import request from 'supertest'
import { resetDb } from './resetDb'
import { createToken } from '../src/routes/login'

let coachId: string
let athleteId: string
let coachStatId: string
let athStatId: string
let coachToken: string
let athleteToken: string

describe('Test CRUD pour les stats des utilisateurs', () => {
  async function token() {
    coachToken = await createToken('00000000-0000-0000-0000-000000000001', 'COACH', 'username')
    athleteToken = await createToken('00000000-0000-0000-0000-000000000002', 'ATHLETE_PROG', 'username')
  }

  beforeAll(async () => {
    await token()
    await resetDb()
    const createdCoach = await request(server)
      .post('/api/user')
      .set('Authorization', `Bearer ${coachToken}`)
      .send({
        name: 'Coach',
        surname: 'Master',
        age: 35,
        weight: 90,
        phone: '0601020304',
        username: 'coachuser',
        password: '1234',
        role: 'COACH',
      })
    coachId = createdCoach.body.data[0].message.id

    // Création des utilisateurs
    const createdAth = await request(server)
      .post('/api/user')
      .set('Authorization', `Bearer ${coachToken}`)
      .send({
        name: 'Athlete',
        surname: 'Strong',
        age: 25,
        weight: 75,
        phone: '0601020305',
        username: 'athleteuser',
        password: '1234',
        role: 'ATHLETE_PROG',
      })
    athleteId = createdAth.body.data[0].message.id

    // On regénère les tokens avec les VRAIS IDs de la base de données
    coachToken = await createToken(coachId, 'COACH', 'coachuser')
    athleteToken = await createToken(athleteId, 'ATHLETE_PROG', 'athleteuser')
  })

  afterAll(async () => {
    await resetDb()
  })
  describe('CREATE (POST /api/stats)', () => {
    it('COACH -> Authorize', async () => {
      const res = await request(server)
        .post('/api/stats')
        .set('Authorization', `Bearer ${coachToken}`)
        .send({
          userId: coachId,
          squat: 200,
          bench: 200,
          deadlift: 200,
        })

      coachStatId = res.body.data[0].message.id
      expect(res.body.success).toBe(true)
    })
    it('ATHLETE (own stats) -> Authorize', async () => {
      const res = await request(server)
        .post('/api/stats')
        .set('Authorization', `Bearer ${athleteToken}`)
        .send({
          userId: athleteId,
          squat: 200,
          bench: 200,
          deadlift: 200,
        })
      expect(res.body.success).toBe(true)
      athStatId = res.body.data[0].message.id
    })
    it('ATHLETE (other stats) -> Forbidden', async () => {
      const res = await request(server)
        .post('/api/stats')
        .set('Authorization', `Bearer ${athleteToken}`)
        .send({
          userId: coachId,
          squat: 200,
          bench: 200,
          deadlift: 200,
        })
      expect(res.body.success).toBe(false)
      const message = res.body.data[0].message
      expect(message).toContain('autorisation')
    })
  })
  describe('GET ALL (/api/stats)', () => {
    it('COACH -> Authorize', async () => {
      const res = await request(server)
        .get('/api/stats')
        .set('Authorization', `Bearer ${coachToken}`)

      expect(res.body.success).toBe(true)
    })
    it('ATHLETE -> Unauthorize', async () => {
      const res = await request(server)
        .get('/api/stats')
        .set('Authorization', `Bearer ${athleteToken}`)

      expect(res.body.success).toBe(false)
    })
  })
  describe('GET BY ID (GET /api/stats/id)', () => {
    it('COACH -> Authorize', async () => {
      const res = await request(server)
        .get(`/api/stats/${coachStatId}`)
        .set('Authorization', `Bearer ${coachToken}`)

      expect(res.body.success).toBe(true)
    })
    it('ATHLETE -> Unauthorize', async () => {
      const res = await request(server)
        .get(`/api/stats/${athStatId}`)
        .set('Authorization', `Bearer ${athleteToken}`)

      expect(res.body.success).toBe(false)
    })
  })
  describe('UPDATE (PUT /api/stats/)', () => {
    it('COACH -> Authorize', async () => {
      const res = await request(server)
        .put('/api/stats')
        .set('Authorization', `Bearer ${coachToken}`)
        .send({
          userId: coachId,
          squat: 99,
        })

      expect(res.body.success).toBe(true)
      expect(res.body.data[0].message.squat).toBe(99)
    })
    it('ATHLETE (own stats) -> Authorize', async () => {
      const res = await request(server)
        .put('/api/stats')
        .set('Authorization', `Bearer ${athleteToken}`)
        .send({
          userId: athleteId,
          squat: 150,
        })

      expect(res.body.success).toBe(true)
      expect(res.body.data[0].message.squat).toBe(150)
    })
    it('ATHLETE (other stats) -> Forbidden', async () => {
      const res = await request(server)
        .put('/api/stats')
        .set('Authorization', `Bearer ${athleteToken}`)
        .send({
          userId: coachId,
          squat: 150,
        })

      expect(res.body.success).toBe(false)
      expect(res.body.data[0].message).toContain('autorisation')
    })
  })
  describe('DELETE (DELETE /api/stats/id)', () => {
    it('COACH -> Authorize', async () => {
      const res = await request(server)
        .delete(`/api/stats/${coachStatId}`)
        .set('Authorization', `Bearer ${coachToken}`)

      expect(res.body.success).toBe(true)
    })
    it('ATHLETE -> Unauthorize', async () => {
      const res = await request(server)
        .delete(`/api/stats/${athStatId}`)
        .set('Authorization', `Bearer ${athleteToken}`)

      expect(res.body.success).toBe(false)
    })
  })
})
