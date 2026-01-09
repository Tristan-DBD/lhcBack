import server from '../src/index'
import request from 'supertest'
import { resetDb } from './resetDb'
import { createToken } from '../src/routes/login'

beforeAll(async () => {
  resetDb()
})

describe('Test CRUD pour les cours', () => {
  let coachTestId: number
  let athleteTestId: number
  let courseTestId: number
  let coachToken: string
  let athleteToken: string

  beforeAll(async () => {
    // Générer les tokens
    coachToken = await createToken(1, 'COACH', 'coach@test.com')
    athleteToken = await createToken(2, 'ATHLETE_CO', 'athlete@test.com')

    // Créer les utilisateurs de test
    const coachRes = await request(server)
      .post('/api/user')
      .set('Authorization', `Bearer ${coachToken}`)
      .send({
        name: 'Coach',
        surname: 'Test',
        age: 30,
        weight: 80,
        phone: '0601020304',
        email: 'coach@test.com',
        password: 'password123',
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
        email: 'athlete@test.com',
        password: 'password123',
        role: 'ATHLETE_CO',
      })

    coachTestId = coachRes.body.data.id
    athleteTestId = athleteRes.body.data.id
  })

  describe('CREATE (POST /api/course)', () => {
    it('COACH -> Authorize', async () => {
      const res = await request(server)
        .post('/api/course')
        .set('Authorization', `Bearer ${coachToken}`)
        .send({
          title: 'Course de test',
          maxParticipants: 10,
          startAt: new Date(Date.now()),
          coachId: coachTestId,
          durationMinutes: 60,
          description: 'Description du cours de test',
        })

      expect(res.body.success).toBe(true)
      courseTestId = res.body.data.id
    })

    it('ATHLETE -> Unauthorize', async () => {
      const res = await request(server)
        .post('/api/course')
        .set('Authorization', `Bearer ${athleteToken}`)
        .send({
          title: 'Course non autorisée',
          description: 'Description',
          startAt: new Date(Date.now()),
          durationMinutes: 60,
          maxParticipants: 10,
          coachId: coachTestId,
        })

      expect(res.body.success).toBe(false)
    })

    it('NO TOKEN -> Unauthorized', async () => {
      const res = await request(server)
        .post('/api/course')
        .send({
          title: 'Course sans token',
          description: 'Description',
          startAt: new Date(Date.now()),
          durationMinutes: 60,
          maxParticipants: 10,
          coachId: coachTestId,
        })

      expect(res.status).toBe(401)
    })
  })

  describe('GET ALL (GET /api/course)', () => {
    it('COACH -> Authorize', async () => {
      const res = await request(server)
        .get('/api/course')
        .set('Authorization', `Bearer ${coachToken}`)

      expect(res.body.success).toBe(true)
      expect(Array.isArray(res.body.data)).toBe(true)
    })

    it('ATHLETE -> Authorize', async () => {
      const res = await request(server)
        .get('/api/course')
        .set('Authorization', `Bearer ${athleteToken}`)

      expect(res.body.success).toBe(true)
      expect(Array.isArray(res.body.data)).toBe(true)
    })

    it('NO TOKEN -> Unauthorized', async () => {
      const res = await request(server).get('/api/course')

      expect(res.status).toBe(401)
    })
  })

  describe('GET BY ID (GET /api/course/:id)', () => {
    it('COACH -> Authorize', async () => {
      const res = await request(server)
        .get(`/api/course/${courseTestId}`)
        .set('Authorization', `Bearer ${coachToken}`)

      expect(res.body.success).toBe(true)
      expect(res.body.data.id).toBe(courseTestId)
    })

    it('ATHLETE -> Authorize', async () => {
      const res = await request(server)
        .get(`/api/course/${courseTestId}`)
        .set('Authorization', `Bearer ${athleteToken}`)

      expect(res.body.success).toBe(true)
      expect(res.body.data.id).toBe(courseTestId)
    })

    it('COURSE NOT FOUND -> 404', async () => {
      const res = await request(server)
        .get('/api/course/99999')
        .set('Authorization', `Bearer ${coachToken}`)

      expect(res.body.success).toBe(false)
      expect(res.body.data).toBe('Cours non trouvé')
    })

    it('NO TOKEN -> Unauthorized', async () => {
      const res = await request(server).get(`/api/course/${courseTestId}`)

      expect(res.status).toBe(401)
    })
  })

  describe('UPDATE (PUT /api/course/:id)', () => {
    it('COACH -> Authorize', async () => {
      const res = await request(server)
        .put(`/api/course/${courseTestId}`)
        .set('Authorization', `Bearer ${coachToken}`)
        .send({
          title: 'Course modifiée',
        })

      expect(res.body.success).toBe(true)
      expect(res.body.data.title).toBe('Course modifiée')
    })

    it('ATHLETE -> Unauthorize', async () => {
      const res = await request(server)
        .put(`/api/course/${courseTestId}`)
        .set('Authorization', `Bearer ${athleteToken}`)
        .send({
          title: 'Course non autorisée',
        })

      expect(res.body.success).toBe(false)
    })

    it('COURSE NOT FOUND -> 404', async () => {
      const res = await request(server)
        .put('/api/course/99999')
        .set('Authorization', `Bearer ${coachToken}`)
        .send({
          title: 'Course inexistante',
        })

      expect(res.body.success).toBe(false)
      expect(res.body.data).toBe('Cours non trouvé')
    })

    it('NO TOKEN -> Unauthorized', async () => {
      const res = await request(server)
        .put(`/api/course/${courseTestId}`)
        .send({
          title: 'Course sans token',
        })

      expect(res.status).toBe(401)
    })
  })

  describe('DELETE (DELETE /api/course/:id)', () => {
    it('COACH -> Authorize', async () => {
      // Créer un cours à supprimer
      const createRes = await request(server)
        .post('/api/course')
        .set('Authorization', `Bearer ${coachToken}`)
        .send({
          title: 'Course à supprimer',
          description: 'Description',
          startAt: '2026-01-10T10:00:00.000Z',
          durationMinutes: 60,
          maxParticipants: 10,
          coachId: coachTestId,
        })

      const courseIdToDelete = createRes.body.data.id

      const res = await request(server)
        .delete(`/api/course/${courseIdToDelete}`)
        .set('Authorization', `Bearer ${coachToken}`)

      expect(res.body.success).toBe(true)
    })

    it('ATHLETE -> Unauthorize', async () => {
      const res = await request(server)
        .delete(`/api/course/${courseTestId}`)
        .set('Authorization', `Bearer ${athleteToken}`)

      expect(res.body.success).toBe(false)
    })

    it('COURSE NOT FOUND -> 404', async () => {
      const res = await request(server)
        .delete('/api/course/99999')
        .set('Authorization', `Bearer ${coachToken}`)

      expect(res.body.success).toBe(false)
      expect(res.body.data).toBe('Cours non trouvé')
    })

    it('NO TOKEN -> Unauthorized', async () => {
      const res = await request(server).delete(`/api/course/${courseTestId}`)

      expect(res.status).toBe(401)
    })
  })
})
