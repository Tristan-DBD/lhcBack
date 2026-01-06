import server from '../src/index'
import request from 'supertest'
import { resetDb } from './resetDb'
import fsp from 'fs/promises'
import fs from 'fs'
import path from 'path'
import { createToken } from '../src/routes/login'
import { FileService } from '../src/middleware/upload'

beforeAll(async () => {
  resetDb()
})

describe('Test CRUD pour les utilisateurs', () => {
  let coachTestId: number
  let athleteTestId: number
  let coachToken: string
  let athleteToken: string
  async function token() {
    coachToken = await createToken(1, 'COACH', 'email@gmail.com')
    athleteToken = await createToken(2, 'ATHLETE', 'email@gmail.com')
  }
  token()
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
          email: 'coach@gmail.com',
          password: '1234',
          role: 'COACH',
        })

      coachTestId = res.body.data.id
      expect(res.body.success).toBe(true)

      const ath = await request(server)
        .post('/api/user')
        .set('Authorization', `Bearer ${coachToken}`)
        .send({
          name: 'Test',
          surname: 'Testest',
          age: 23,
          weight: 85,
          phone: '0601020304',
          email: 'ahtlete@gmail.com',
          password: '1234',
          role: 'ATHLETE',
        })

      athleteTestId = ath.body.data.id

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
          email: 'athelete@gmail.com',
          password: '1234',
          role: 'ATHELETE',
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
      expect(res.body.data.name).toBe('coachName')
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
        .attach('profileImage', path.join(__dirname, '../test/image/test.png'))

      expect(res.body.success).toBe(true)
    })
    it('ATHELETE -> Authorize', async () => {
      const res = await request(server)
        .put(`/api/user/${athleteTestId}/profile-image`)
        .set('Authorization', `Bearer ${athleteToken}`)
        .attach('profileImage', path.join(__dirname, '../test/image/test2.png'))

      expect(res.body.success).toBe(true)
    })
  })
  describe('RESET IMAGE (DELETE /api/user/id/profile-image', () => {
    it('COACH -> Authorize', async () => {
      const user = await request(server)
        .get(`/api/user/${coachTestId}`)
        .set('Authorization', `Bearer ${coachToken}`)
      const imageUri = user.body.data.imageUri

      const res = await request(server)
        .delete(`/api/user/${coachTestId}/profile-image`)
        .set('Authorization', `Bearer ${coachToken}`)

      expect(fs.existsSync(`${imageUri}`)).toBe(false)
      expect(res.body.success).toBe(true)
    })
    it('ATHLETE -> Unauthorize', async () => {
      const user = await request(server)
        .get(`/api/user/${athleteTestId}`)
        .set('Authorization', `Bearer ${athleteTestId}`)
      const imageUri = user.body.data.imageUri

      const res = await request(server)
        .delete(`/api/user/${athleteTestId}/profile-image`)
        .set('Authorization', `Bearer ${athleteTestId}`)

      expect(res.body.success).toBe(false)
    })
  })
  describe('UPDATE PROG (PUT /api/user/id/prog)rst', () => {
    it('COACH -> Auhtorize', async () => {
      const res = await request(server)
        .put(`/api/user/${coachTestId}/prog`)
        .set('Authorization', `Bearer ${coachToken}`)
        .attach('statsFile', path.join(__dirname, '../test/prog/test.xlsx'), {
          contentType:
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        })

      expect(res.body.success).toBe(true)
    })
    it('ATHLETE -> Unauhtorize', async () => {
      const res = await request(server)
        .put(`/api/user/${athleteTestId}/prog`)
        .set('Authorization', `Bearer ${athleteToken}`)
        .attach('statsFile', path.join(__dirname, '../test/prog/test.xlsx'), {
          contentType:
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        })

      expect(res.body.success).toBe(false)
    })
  })
  describe('REMOVE PROG (DELETE /api/user/id/prog)', () => {
    it('COACH -> Authorize', async () => {
      const user = await request(server)
        .get(`/api/user/${coachTestId}`)
        .set('Authorization', `Bearer ${coachToken}`)
      const progUri = user.body.data.progUri

      const res = await request(server)
        .delete(`/api/user/${coachTestId}/prog`)
        .set('Authorization', `Bearer ${coachToken}`)

      expect(fs.existsSync(`${progUri}`))
      expect(res.body.success).toBe(true)
    })
    it('ATHLETE -> Unauthorize', async () => {
      const user = await request(server)
        .get(`/api/user/${athleteTestId}`)
        .set('Authorization', `Bearer ${athleteToken}`)
      const progUri = user.body.data.progUri

      const res = await request(server)
        .delete(`/api/user/${athleteTestId}/prog`)
        .set('Authorization', `Bearer ${athleteToken}`)

      expect(fs.existsSync(`${progUri}`))
      expect(res.body.success).toBe(false)
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
