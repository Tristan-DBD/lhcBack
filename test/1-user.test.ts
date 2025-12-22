import server from '../src/index'
import request from 'supertest'
import { resetDb } from './resetDb'

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
      role: 'COACH',
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
      name: 'newName',
    })
    expect(res.body.success).toBe(true)
    expect(res.body.data.name).toBe('newName')
  })
  it('DELETE (DELETE /api/user/id)', async () => {
    const res = await request(server).delete(`/api/user/${createdUserId}`)

    expect(res.status).toBe(204)
  })
})
