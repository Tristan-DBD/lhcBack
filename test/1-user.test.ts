import server from '../src/index'
import request from 'supertest'
import { resetDb } from './resetDb'
import fs from 'fs'
import path from 'path'

beforeAll(async () => {
  resetDb()
})

describe('Test CRUD pour les utilisateurs', () => {
  let createdUserId: number

  it('CREATE (POST /api/user/)', async () => {
    const res = await request(server).post('/api/user').send({
      name: 'Test',
      surname: 'Testest',
      age: 23,
      weight: 85,
      phone: '0601020304',
      email: 'test@gmail.com',
      password: '1234',
    })

    createdUserId = res.body.data.id

    expect(res.body.success).toBe(true)
  })
  it('GET ALL (GET /api/user/)', async () => {
    const res = await request(server).get('/api/user')

    expect(res.body.success).toBe(true)
  })
  it('GET BY ID (GET /api/user/id)', async () => {
    const res = await request(server).get(`/api/user/${createdUserId}`)

    expect(res.body.success).toBe(true)
  })
  it('UPDATE (PUT /api/user/id', async () => {
    const res = await request(server).put(`/api/user/${createdUserId}`).send({
      name: 'modifiedName',
    })
    expect(res.body.success).toBe(true)
    expect(res.body.data.name).toBe('modifiedName')
  })
  it('UPDATE IMAGE (PUT /api/user/id/profile-image)', async () => {
    const res = await request(server)
      .put(`/api/user/${createdUserId}/profile-image`)
      .attach('profileImage', path.join(__dirname, '../test/image/test.png'))

    expect(res.body.success).toBe(true)
  })
  it('RESET IMAGE (DELETE /api/user/id/profile-image)', async () => {
    const user = await request(server).get(`/api/user/${createdUserId}`)
    const imageUri = user.body.data.imageUri

    const res = await request(server).delete(
      `/api/user/${createdUserId}/profile-image`,
    )

    expect(fs.existsSync(`/public/profileImage${imageUri}`)).toBe(false)
    expect(res.body.success).toBe(true)
  })
  it('UPDATE PROG (PUT /api/user/id/prog)', async () => {
    const res = await request(server)
      .put(`/api/user/${createdUserId}/prog`)
      .attach('statsFile', path.join(__dirname, '../test/prog/test.xlsx'), {
        contentType:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })

    expect(res.body.success).toBe(true)
  })
  it('REMOVE PROG (DELETE /api/user/id/prog)', async () => {
    const user = await request(server).get(`/api/user/${createdUserId}`)
    const progUri = user.body.data.progUri

    const res = await request(server).delete(`/api/user/${createdUserId}/prog`)

    expect(fs.existsSync(`${progUri}`))
    expect(res.body.success).toBe(true)
  })
  it('DELETE (DELETE /api/user/id)', async () => {
    const res = await request(server).delete(`/api/user/${createdUserId}`)

    expect(res.body.success).toBe(true)
  })
})
