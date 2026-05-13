import server from '../src/index'
import request from 'supertest'
import { resetDb } from './resetDb'
import { createToken } from '../src/routes/login'

beforeAll(async () => {
  await resetDb()
})

describe('Test CRUD pour les séances individuelles', () => {
  let coachTestId: string
  let athleteTestId: string
  let sessionTestId: string
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
        surname: 'Indiv',
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
        surname: 'Indiv',
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

  describe('CREATE (POST /api/individual-session)', () => {
    it('COACH -> Authorize', async () => {
      const res = await request(server)
        .post('/api/individual-session')
        .set('Authorization', `Bearer ${coachToken}`)
        .send({
          title: 'Séance individuelle test',
          description: 'Description test',
          startAt: new Date(Date.now() + 86400000),
          coachId: coachTestId,
          durationMinutes: 60,
        })

      expect(res.body.success).toBe(true)
      sessionTestId = res.body.data[0].message.id
    })

    it('ATHLETE -> Unauthorize', async () => {
      const res = await request(server)
        .post('/api/individual-session')
        .set('Authorization', `Bearer ${athleteToken}`)
        .send({
          title: 'Séance non autorisée',
          description: 'Description',
          startAt: new Date(Date.now() + 86400000),
          coachId: coachTestId,
          durationMinutes: 60,
        })

      expect(res.body.success).toBe(false)
    })

    it('NO TOKEN -> Unauthorized', async () => {
      const res = await request(server)
        .post('/api/individual-session')
        .send({
          title: 'Séance sans token',
          description: 'Description',
          startAt: new Date(Date.now() + 86400000),
          coachId: coachTestId,
          durationMinutes: 60,
        })

      expect(res.status).toBe(401)
    })
  })

  describe('GET ALL (GET /api/individual-session)', () => {
    it('COACH -> Authorize', async () => {
      const res = await request(server)
        .get('/api/individual-session')
        .set('Authorization', `Bearer ${coachToken}`)

      expect(res.body.success).toBe(true)
      expect(Array.isArray(res.body.data)).toBe(true)
    })

    it('ATHLETE -> Authorize', async () => {
      const res = await request(server)
        .get('/api/individual-session')
        .set('Authorization', `Bearer ${athleteToken}`)

      expect(res.body.success).toBe(true)
      expect(Array.isArray(res.body.data)).toBe(true)
    })

    it('NO TOKEN -> Unauthorized', async () => {
      const res = await request(server).get('/api/individual-session')
      expect(res.status).toBe(401)
    })
  })

  describe('GET BY ID (GET /api/individual-session/:id)', () => {
    it('COACH -> Authorize', async () => {
      const res = await request(server)
        .get(`/api/individual-session/${sessionTestId}`)
        .set('Authorization', `Bearer ${coachToken}`)

      expect(res.body.success).toBe(true)
      expect(res.body.data[0].message.id).toBe(sessionTestId)
    })

    it('ATHLETE -> Authorize', async () => {
      const res = await request(server)
        .get(`/api/individual-session/${sessionTestId}`)
        .set('Authorization', `Bearer ${athleteToken}`)

      expect(res.body.success).toBe(true)
      expect(res.body.data[0].message.id).toBe(sessionTestId)
    })

    it('SESSION NOT FOUND -> 404', async () => {
      const res = await request(server)
        .get('/api/individual-session/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${coachToken}`)

      expect(res.body.success).toBe(false)
      expect(res.body.data[0].message).toBe('Séance non trouvée')
    })

    it('NO TOKEN -> Unauthorized', async () => {
      const res = await request(server).get(`/api/individual-session/${sessionTestId}`)
      expect(res.status).toBe(401)
    })
  })

  describe('UPDATE (PUT /api/individual-session/:id)', () => {
    it('COACH -> Authorize', async () => {
      const res = await request(server)
        .put(`/api/individual-session/${sessionTestId}`)
        .set('Authorization', `Bearer ${coachToken}`)
        .send({
          title: 'Séance modifiée coach',
        })

      expect(res.body.success).toBe(true)
      expect(res.body.data[0].message.title).toBe('Séance modifiée coach')
    })

    it('ATHLETE -> Unauthorize', async () => {
      const res = await request(server)
        .put(`/api/individual-session/${sessionTestId}`)
        .set('Authorization', `Bearer ${athleteToken}`)
        .send({
          title: 'Modification non autorisée',
        })

      expect(res.body.success).toBe(false)
    })

    it('SESSION NOT FOUND -> 404', async () => {
      const res = await request(server)
        .put('/api/individual-session/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${coachToken}`)
        .send({
          title: 'Séance inexistante',
        })

      expect(res.body.success).toBe(false)
      expect(res.body.data[0].message).toBe('Séance non trouvée')
    })

    it('NO TOKEN -> Unauthorized', async () => {
      const res = await request(server)
        .put(`/api/individual-session/${sessionTestId}`)
        .send({ title: 'Sans token' })

      expect(res.status).toBe(401)
    })
  })

  describe('DELETE (DELETE /api/individual-session/:id)', () => {
    it('COACH -> Authorize', async () => {
      const createRes = await request(server)
        .post('/api/individual-session')
        .set('Authorization', `Bearer ${coachToken}`)
        .send({
          title: 'Séance à supprimer',
          description: 'Description',
          startAt: new Date(Date.now() + 86400000),
          coachId: coachTestId,
          durationMinutes: 60,
        })

      const idToDelete = createRes.body.data[0].message.id

      const res = await request(server)
        .delete(`/api/individual-session/${idToDelete}`)
        .set('Authorization', `Bearer ${coachToken}`)

      expect(res.body.success).toBe(true)
    })

    it('ATHLETE -> Unauthorize', async () => {
      const res = await request(server)
        .delete(`/api/individual-session/${sessionTestId}`)
        .set('Authorization', `Bearer ${athleteToken}`)

      expect(res.body.success).toBe(false)
    })

    it('SESSION NOT FOUND -> 404', async () => {
      const res = await request(server)
        .delete('/api/individual-session/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${coachToken}`)

      expect(res.body.success).toBe(false)
      expect(res.body.data[0].message).toBe('Séance non trouvée')
    })

    it('NO TOKEN -> Unauthorized', async () => {
      const res = await request(server).delete(`/api/individual-session/${sessionTestId}`)
      expect(res.status).toBe(401)
    })
  })

  describe('GET REGISTRATIONS (GET /api/individual-session/registrations/:id)', () => {
    it('COACH -> Authorize', async () => {
      const res = await request(server)
        .get(`/api/individual-session/registrations/${sessionTestId}`)
        .set('Authorization', `Bearer ${coachToken}`)

      expect(res.body.success).toBe(true)
      expect(Array.isArray(res.body.data[0].message)).toBe(true)
    })

    it('ATHLETE -> Unauthorize', async () => {
      const res = await request(server)
        .get(`/api/individual-session/registrations/${sessionTestId}`)
        .set('Authorization', `Bearer ${athleteToken}`)

      expect(res.status).toBe(403)
    })

    it('SESSION NOT FOUND -> 404', async () => {
      const res = await request(server)
        .get('/api/individual-session/registrations/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${coachToken}`)

      expect(res.status).toBe(404)
    })

    it('NO TOKEN -> Unauthorized', async () => {
      const res = await request(server).get(
        `/api/individual-session/registrations/${sessionTestId}`,
      )
      expect(res.status).toBe(401)
    })
  })
})

afterAll(async () => {
  await resetDb()
})
