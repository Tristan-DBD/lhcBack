import request from 'supertest'
import server from '../src'
import { createToken } from '../src/routes/login'
import { resetDb } from './resetDb'

beforeAll(async () => {
  await resetDb()
})

describe('REGISTER/UNREGISTER séances individuelles (1 place max)', () => {
  let athletes: any[]
  let sessionId: string
  let coach: any

  beforeAll(async () => {
    const adminToken = await createToken('00000000-0000-0000-0000-000000000099', 'ADMIN', 'adminuser')

    const coachRes = await request(server)
      .post('/api/user/coach')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Coach',
        surname: 'RegIndiv',
        age: 30,
        weight: 80,
        phone: '0601020304',
        role: 'COACH',
      })

    coach = {
      id: coachRes.body.data[0].message.id,
      token: await createToken(
        coachRes.body.data[0].message.id,
        'COACH',
        coachRes.body.data[0].message.username,
      ),
    }

    athletes = []
    for (let i = 0; i < 3; i++) {
      const res = await request(server)
        .post('/api/user')
        .set('Authorization', `Bearer ${coach.token}`)
        .send({
          name: 'Athlete',
          surname: `RegIndiv${i}`,
          age: 25,
          weight: 70,
          phone: `06099${i.toString().padStart(5, '0')}`,
        })
      athletes.push({
        id: res.body.data[0].message.id,
        token: await createToken(
          res.body.data[0].message.id,
          'ATHLETE_CO',
          res.body.data[0].message.username,
        ),
      })
    }

    const sessionRes = await request(server)
      .post('/api/individual-session')
      .set('Authorization', `Bearer ${coach.token}`)
      .send({
        title: 'Séance individuelle test',
        description: 'Test registration',
        startAt: new Date(Date.now() + 86400000),
        coachId: coach.id,
        durationMinutes: 60,
      })
    sessionId = sessionRes.body.data[0].message.id
  })

  describe('REGISTER (POST /api/individual-session/register)', () => {
    it('ATHLETE -> Succès inscription', async () => {
      const res = await request(server)
        .post('/api/individual-session/register')
        .set('Authorization', `Bearer ${athletes[0].token}`)
        .send({ userId: athletes[0].id, courseId: sessionId })

      expect(res.body.success).toBe(true)
    })

    it('ATHLETE -> Déjà inscrit', async () => {
      const res = await request(server)
        .post('/api/individual-session/register')
        .set('Authorization', `Bearer ${athletes[0].token}`)
        .send({ userId: athletes[0].id, courseId: sessionId })

      expect(res.body.success).toBe(false)
      expect(res.body.data[0].message).toBe('Déjà inscrit à cette séance')
    })

    it('SÉANCE COMPLÈTE (1 place max) -> 400', async () => {
      const res = await request(server)
        .post('/api/individual-session/register')
        .set('Authorization', `Bearer ${athletes[1].token}`)
        .send({ userId: athletes[1].id, courseId: sessionId })

      expect(res.body.success).toBe(false)
      expect(res.body.data[0].message).toBe('Séance déjà réservée')
    })

    it('SÉANCE INEXISTANTE -> 404', async () => {
      const res = await request(server)
        .post('/api/individual-session/register')
        .set('Authorization', `Bearer ${athletes[2].token}`)
        .send({
          userId: athletes[2].id,
          courseId: '00000000-0000-0000-0000-000000000000',
        })

      expect(res.body.success).toBe(false)
      expect(['Séance non trouvée', 'Id incorrect']).toContain(
        res.body.data[0].message,
      )
    })

    it('COACH -> Unauthorize', async () => {
      const res = await request(server)
        .post('/api/individual-session/register')
        .set('Authorization', `Bearer ${coach.token}`)
        .send({ userId: athletes[2].id, courseId: sessionId })

      expect(res.body.success).toBe(false)
    })

    it('NO TOKEN -> Unauthorized', async () => {
      const res = await request(server)
        .post('/api/individual-session/register')
        .send({ userId: athletes[2].id, courseId: sessionId })

      expect([400, 401]).toContain(res.status)
    })
  })

  describe('UNREGISTER (POST /api/individual-session/unregister)', () => {
    it('ATHLETE -> Succès désinscription', async () => {
      // Réinscrire athletes[0] pour tester la désinscription
      await request(server)
        .post('/api/individual-session/register')
        .set('Authorization', `Bearer ${athletes[0].token}`)
        .send({ userId: athletes[0].id, courseId: sessionId })

      const res = await request(server)
        .post('/api/individual-session/unregister')
        .set('Authorization', `Bearer ${athletes[0].token}`)
        .send({ userId: athletes[0].id, courseId: sessionId })
      expect(res.body.success).toBe(true)
    })

    it('ATHLETE -> Non inscrit', async () => {
      const res = await request(server)
        .post('/api/individual-session/unregister')
        .set('Authorization', `Bearer ${athletes[0].token}`)
        .send({ userId: athletes[0].id, courseId: sessionId })

      expect(res.body.success).toBe(false)
      expect(res.body.data[0].message).toBe("Non inscrit à cette séance")
    })

    it('SÉANCE INEXISTANTE -> 404', async () => {
      const res = await request(server)
        .post('/api/individual-session/unregister')
        .set('Authorization', `Bearer ${athletes[1].token}`)
        .send({
          userId: athletes[1].id,
          courseId: '00000000-0000-0000-0000-000000000000',
        })

      expect(res.body.success).toBe(false)
      expect(['Séance non trouvée', 'Id incorrect']).toContain(
        res.body.data[0].message,
      )
    })

    it('COACH -> Authorized', async () => {
      // Réinscrire athletes[0] pour que le coach puisse le désinscrire
      await request(server)
        .post('/api/individual-session/register')
        .set('Authorization', `Bearer ${athletes[0].token}`)
        .send({ userId: athletes[0].id, courseId: sessionId })

      const res = await request(server)
        .post('/api/individual-session/unregister')
        .set('Authorization', `Bearer ${coach.token}`)
        .send({ userId: athletes[0].id, courseId: sessionId })

      expect(res.body.success).toBe(true)
    })

    it('NO TOKEN -> Unauthorized', async () => {
      const res = await request(server)
        .post('/api/individual-session/unregister')
        .send({ userId: athletes[0].id, courseId: sessionId })

      expect([400, 401]).toContain(res.status)
    })
  })
})

afterAll(async () => {
  await resetDb()
})
