import server from '../src/index'
import request from 'supertest'
import { resetDb } from './resetDb'
import { FileTestHelper } from './testUtils'
import { createToken } from '../src/routes/login'

beforeAll(async () => {
  await FileTestHelper.ensureBucketExists()
  await FileTestHelper.uploadTestFiles()
  await resetDb()
})

afterAll(async () => {
  await FileTestHelper.cleanupTestFiles()
})

describe('Test CRUD pour les programmes utilisateurs', () => {
  let coachTestId: number
  let athleteTestId: number
  let coachToken: string
  let athleteToken: string

  beforeAll(async () => {
    // Générer les tokens
    coachToken = await createToken(1, 'COACH', 'coachuser')
    athleteToken = await createToken(2, 'ATHLETE_PROG', 'athleteuser')

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
        role: 'ATHLETE_PROG',
      })

    coachTestId = coachRes.body.data[0].message.id
    athleteTestId = athleteRes.body.data[0].message.id
  })

  describe('CREATE PROGRAM (POST /api/user/program/:id)', () => {
    it('COACH -> Authorize', async () => {
      const res = await request(server)
        .post(`/api/user/program/${coachTestId}`)
        .set('Authorization', `Bearer ${coachToken}`)
        .attach('programFile', FileTestHelper.getTestProgPath('test.xlsx'), {
          contentType:
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        })

      expect(res.body.success).toBe(true)
      expect(res.body.data[0].message.fileUri).toBeDefined()
    })

    it('ATHLETE -> Unauthorize', async () => {
      const res = await request(server)
        .post(`/api/user/program/${athleteTestId}`)
        .set('Authorization', `Bearer ${athleteToken}`)
      // Pas de fichier attaché

      expect(res.status).toBe(403)
    })

    it('NO FILE -> Erreur', async () => {
      const res = await request(server)
        .post(`/api/user/program/${athleteTestId}`)
        .set('Authorization', `Bearer ${coachToken}`)
      // Pas de fichier attaché

      expect(res.body.success).toBe(false)
      expect(res.body.data[0].message).toBe('Fichier manquant')
    })

    it('NO TOKEN -> Unauthorized', async () => {
      const res = await request(server).post(
        `/api/user/program/${athleteTestId}`,
      )
      // Pas de token ni de fichier

      expect(res.status).toBe(401)
    })
  })

  describe('GET PROGRAM (GET /api/user/program/:id)', () => {
    it('COACH -> Authorize', async () => {
      const res = await request(server)
        .get(`/api/user/program/${coachTestId}`)
        .set('Authorization', `Bearer ${coachToken}`)

      expect(res.body.success).toBe(true)
      expect(Array.isArray(res.body.data[0].message)).toBe(true)
    })

    it('ATHLETE_PROG -> Authorize (son propre programme)', async () => {
      const res = await request(server)
        .get(`/api/user/program/${athleteTestId}`)
        .set('Authorization', `Bearer ${athleteToken}`)

      expect(res.body.success).toBe(true)
      expect(Array.isArray(res.body.data[0].message)).toBe(true)
    })

    it('ATHLETE_CO -> Unauthorize', async () => {
      // Créer un athlete ATHLETE_CO
      const athleteCoToken = await createToken(3, 'ATHLETE_CO', 'athletecouser')
      const res = await request(server)
        .get(`/api/user/program/${athleteTestId}`)
        .set('Authorization', `Bearer ${athleteCoToken}`)

      expect(res.status).toBe(403)
    })

    it('NO TOKEN -> Unauthorized', async () => {
      const res = await request(server).get(
        `/api/user/program/${athleteTestId}`,
      )
      expect(res.status).toBe(401)
    })
  })

  describe('DELETE PROGRAM (DELETE /api/user/program/:id)', () => {
    it('COACH -> Authorize', async () => {
      // D'abord créer un programme
      await request(server)
        .post(`/api/user/program/${coachTestId}`)
        .set('Authorization', `Bearer ${coachToken}`)
        .attach('programFile', FileTestHelper.getTestProgPath('test.xlsx'), {
          contentType:
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        })

      // Récupérer le nom du programme pour le supprimer
      const getRes = await request(server)
        .get(`/api/user/program/${coachTestId}`)
        .set('Authorization', `Bearer ${coachToken}`)

      const programName = getRes.body.data[0]?.message?.[0]?.name
      console.log('programName', getRes.body.data[0])

      const res = await request(server)
        .delete(`/api/user/program/${coachTestId}`)
        .set('Authorization', `Bearer ${coachToken}`)
        .send({ name: programName })

      expect(res.body.success).toBe(true)
      expect(res.body.data[0].message).toBe('Programme supprimé')
    })

    it('ATHLETE -> Unauthorize', async () => {
      const res = await request(server)
        .delete(`/api/user/program/${athleteTestId}`)
        .set('Authorization', `Bearer ${athleteToken}`)
        .send({ name: 'test' })

      expect(res.status).toBe(403)
    })

    it('PROGRAM NOT FOUND -> 404', async () => {
      const res = await request(server)
        .delete(`/api/user/program/${athleteTestId}`)
        .set('Authorization', `Bearer ${coachToken}`)
        .send({ name: 'nonexistentprogram' })

      expect(res.body.success).toBe(false)
      expect(res.body.data[0].message).toBe(
        'Aucun programme trouvé pour cet utilisateur',
      )
    })

    it('NO TOKEN -> Unauthorized', async () => {
      const res = await request(server)
        .delete(`/api/user/program/${athleteTestId}`)
        .send({ name: 'test' })

      expect(res.status).toBe(401)
    })
  })
})
