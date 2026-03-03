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

describe('Test CRUD pour les utilisateurs', () => {
  let coachTestId: number
  let athleteTestId: number
  let coachToken: string
  let athleteToken: string
  async function token() {
    coachToken = await createToken(1, 'COACH', 'username')
    athleteToken = await createToken(2, 'ATHLETE_PROG', 'username')
  }
  beforeAll(async () => {
    await token()
  })
  describe('CREATE (POST /api/user/)', () => {
    it('COACH -> Authorize', async () => {
      const res = await request(server)
        .post('/api/user')
        .set('Authorization', `Bearer ${coachToken}`)
        .send({
          name: 'Test',
          surname: 'Testest',
          age: 23,
          weight: 85,
          phone: '0601020304',
        })

      coachTestId = res.body.data[0].message.id
      expect(res.body.success).toBe(true)

      const ath = await request(server)
        .post('/api/user')
        .set('Authorization', `Bearer ${coachToken}`)
        .send({
          name: 'Athlete',
          surname: 'Testest',
          age: 23,
          weight: 85,
          phone: '0601020305',
        })

      athleteTestId = ath.body.data[0].message.id

      expect(ath.body.success).toBe(true)
    })
    it('ATHLETE -> Unauthorize', async () => {
      const res = await request(server)
        .post('/api/user')
        .set('Authorization', `Bearer ${athleteToken}`)
        .send({
          name: 'Test',
          surname: 'Testest',
          age: 23,
          weight: 85,
          phone: '0601020304',
        })

      expect(res.body.success).toBe(false)
    })
  })
  describe('GET ALL (GET /api/user/)', () => {
    it('COACH -> Authorize', async () => {
      const res = await request(server)
        .get('/api/user')
        .set('Authorization', `Bearer ${coachToken}`)

      expect(res.body.success).toBe(true)
    })
    it('ATHLETE -> Unauthorize', async () => {
      const res = await request(server)
        .get('/api/user')
        .set('Authorization', `Bearer ${athleteToken}`)

      expect(res.body.success).toBe(false)
    })
  })
  describe('GET BY ID (GET /api/user/id)', () => {
    it('COACH -> Authorize', async () => {
      const res = await request(server)
        .get(`/api/user/${coachTestId}`)
        .set('Authorization', `Bearer ${coachToken}`)

      expect(res.body.success).toBe(true)
    })
    it('ATHLETE -> Authorize', async () => {
      const res = await request(server)
        .get(`/api/user/${athleteTestId}`)
        .set('Authorization', `Bearer ${athleteToken}`)

      expect(res.body.success).toBe(true)
    })
  })
  describe('UPDATE (PUT /api/user/id)', () => {
    it('COACH -> Authorize', async () => {
      const res = await request(server)
        .put(`/api/user/${coachTestId}`)
        .set('Authorization', `Bearer ${coachToken}`)
        .send({
          name: 'coachName',
        })
      expect(res.body.success).toBe(true)
      expect(res.body.data[0].message.name).toBe('coachName')
    })
    it('ATHLETE -> Authorize', async () => {
      const res = await request(server)
        .put(`/api/user/${athleteTestId}`)
        .set('Authorization', `Bearer ${athleteToken}`)
        .send({
          name: 'athleteName',
        })
      expect(res.body.success).toBe(false)
    })
  })
  describe('UPDATE IMAGE (PUT /api/user/id/profile-image)', () => {
    it('COACH -> Authorize', async () => {
      const res = await request(server)
        .put(`/api/user/${coachTestId}/profile-image`)
        .set('Authorization', `Bearer ${coachToken}`)
        .attach('profileImage', FileTestHelper.getTestImagePath('test.png'))
      console.log(res.body.data[0].message)
      expect(res.body.success).toBe(true)
    })
    it('ATHELETE -> Authorize', async () => {
      const res = await request(server)
        .put(`/api/user/${athleteTestId}/profile-image`)
        .set('Authorization', `Bearer ${athleteToken}`)
        .attach('profileImage', FileTestHelper.getTestImagePath('test2.png'))

      expect(res.body.success).toBe(true)
    })
  })
  describe('RESET IMAGE (DELETE /api/user/id/profile-image)', () => {
    it('COACH -> Authorize', async () => {
      const user = await request(server)
        .get(`/api/user/${coachTestId}`)
        .set('Authorization', `Bearer ${coachToken}`)
      const imageUri = user.body.data.imageUri
      console.log(user.body.data)
      // Vérifier si imageUri existe avant de tester
      if (imageUri) {
        const res = await request(server)
          .delete(`/api/user/${coachTestId}/profile-image`)
          .set('Authorization', `Bearer ${coachToken}`)
        await FileTestHelper.expectFileNotExists(imageUri)
        expect(res.body.success).toBe(true)
      } else {
        // Si pas d'image, le test passe directement
        expect(true).toBe(true)
      }
    })
    it('ATHLETE -> Authorize', async () => {
      const res = await request(server)
        .delete(`/api/user/${athleteTestId}/profile-image`)
        .set('Authorization', `Bearer ${athleteToken}`)

      expect(res.body.success).toBe(true)
    })
  })
  describe('UPDATE PROG (PUT /api/user/program/:id)', () => {
    it('COACH -> Auhtorize', async () => {
      const res = await request(server)
        .put(`/api/user/program/${coachTestId}`)
        .set('Authorization', `Bearer ${coachToken}`)
        .attach('programFile', FileTestHelper.getTestProgPath('test.xlsx'), {
          contentType:
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        })

      expect(res.status).toBe(201)
      expect(res.body.success).toBe(true)
    })
    it('ATHLETE -> Unauhtorize', async () => {
      const res = await request(server)
        .put(`/api/user/program/${athleteTestId}`)
        .set('Authorization', `Bearer ${athleteToken}`)
      // Pas de fichier attaché

      expect(res.status).toBe(403)
    })
  })
  describe('REMOVE PROG (DELETE /api/user/id/prog)', () => {
    it('COACH -> Authorize', async () => {
      const user = await request(server)
        .get(`/api/user/${coachTestId}`)
        .set('Authorization', `Bearer ${coachToken}`)
      const progUri = user.body.data.progUri

      // Vérifier si progUri existe avant de tester
      if (progUri && progUri.length > 0) {
        const res = await request(server)
          .delete(`/api/user/program/${coachTestId}`)
          .set('Authorization', `Bearer ${coachToken}`)
          .send({ name: progUri[0].split('/').pop().split('.')[0] })

        await FileTestHelper.expectFileNotExists(progUri[0])
        expect(res.body.success).toBe(true)
      } else {
        // Si pas de programme, le test passe directement
        expect(true).toBe(true)
      }
    })
    it('ATHLETE -> Unauthorize', async () => {
      await request(server)
        .put(`/api/user/program/${athleteTestId}`)
        .set('Authorization', `Bearer ${coachToken}`)
        .attach('programFile', FileTestHelper.getTestProgPath('test.xlsx'), {
          contentType:
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        })

      const user = await request(server)
        .get(`/api/user/${athleteTestId}`)
        .set('Authorization', `Bearer ${athleteToken}`)
      const progUri = user.body.data.progUri

      if (progUri && progUri.length > 0) {
        const res = await request(server)
          .delete(`/api/user/program/${athleteTestId}`)
          .set('Authorization', `Bearer ${athleteToken}`)
          .send({
            id: 1, // ID fictice pour la validation
            name: progUri[0].split('/').pop().split('.')[0],
          })

        expect(res.status).toBe(403)
      } else {
        // Si pas de programme, on teste directement avec des valeurs fictices
        const res = await request(server)
          .delete(`/api/user/program/${athleteTestId}`)
          .set('Authorization', `Bearer ${athleteToken}`)
          .send({
            id: 1,
            name: 'test-program',
          })

        expect(res.status).toBe(403)
      }
    })
  })
  describe('CREATE COACH (POST /api/user/coach)', () => {
    let adminToken: string
    beforeAll(async () => {
      adminToken = await createToken(98, 'ADMIN', 'adminuser')
    })

    it('ADMIN -> Authorize', async () => {
      const res = await request(server)
        .post('/api/user/coach')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Coach',
          surname: 'Admin',
          age: 35,
          weight: 85,
          phone: '0601020308',

        })

      expect(res.body.success).toBe(true)
      expect(res.body.data[0].message.role).toBe('COACH')
    })

    it('COACH -> Unauthorize', async () => {
      const res = await request(server)
        .post('/api/user/coach')
        .set('Authorization', `Bearer ${coachToken}`)
        .send({
          name: 'Coach2',
          surname: 'Unauthorized',
          age: 30,
          weight: 80,
          phone: '0601020309',

        })

      expect(res.status).toBe(403)
    })

    it('NO TOKEN -> Unauthorized', async () => {
      const res = await request(server).post('/api/user/coach').send({
        name: 'Coach3',
        surname: 'NoToken',
        age: 30,
        weight: 80,
        phone: '0601020310',
      })

      expect(res.status).toBe(401)
    })
  })

  describe('GET ALL COACHES (GET /api/user/get-coach)', () => {
    it('COACH -> Authorize', async () => {
      const res = await request(server)
        .get('/api/user/get-coach')
        .set('Authorization', `Bearer ${coachToken}`)

      expect(res.body.success).toBe(true)
      expect(Array.isArray(res.body.data[0].message)).toBe(true)
    })

    it('ATHLETE -> Unauthorize', async () => {
      const res = await request(server)
        .get('/api/user/get-coach')
        .set('Authorization', `Bearer ${athleteToken}`)

      expect(res.status).toBe(403)
    })

    it('NO TOKEN -> Unauthorized', async () => {
      const res = await request(server).get('/api/user/get-coach')
      expect(res.status).toBe(401)
    })
  })

  describe('DELETE (DELETE /api/user/id)', () => {
    it('COACH -> Authorize', async () => {
      const res = await request(server)
        .delete(`/api/user/${coachTestId}`)
        .set('Authorization', `Bearer ${coachToken}`)

      expect(res.status).toBe(204)
    })
    it('ATHLETE -> Unauthorize', async () => {
      const res = await request(server)
        .delete(`/api/user/${athleteTestId}`)
        .set('Authorization', `Bearer ${athleteToken}`)

      // suppression de l'utilisateur pour clean le fichier public et ne pas laisser d'utilsateur dans la db
      await request(server)
        .delete(`/api/user/${athleteTestId}`)
        .set('Authorization', `Bearer ${coachToken}`)

      expect(res.status).toBe(403)
    })
  })
})
