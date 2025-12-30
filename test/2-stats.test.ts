import server from '../src'
import request from 'supertest'
import { resetDb } from './resetDb'

beforeAll(async () => {
  await resetDb()

  const createdUser = await request(server).post('/api/user').send({
    name: 'Test',
    surname: 'Testest',
    age: 23,
    weight: 85,
    phone: '0601020304',
    email: 'teststat@gmail.com',
    password: '1234',
  })
  userId = createdUser.body.data.id
})

afterAll(async () => {
  resetDb()
})

let userId: number
let statsId: number

describe('Test CRUD pour les stats des utilisateurs', () => {
  it('CREATE (POST /api/stats)', async () => {
    const res = await request(server).post('/api/stats').send({
      userId: userId,
      squat: 200,
      bench: 200,
      deadlift: 200,
    })
    statsId = res.body.data.id
    expect(res.body.success).toBe(true)
  })
  it('GET ALL (/api/stats)', async () => {
    const res = await request(server).get('/api/stats')

    expect(res.body.success).toBe(true)
  })
  it('GET BY ID (GET /api/stats/id)', async () => {
    const res = await request(server).get(`/api/stats/${statsId}`)

    expect(res.body.success).toBe(true)
  })
  it('UPDATE (PUT /api/stats/)', async () => {
    const res = await request(server).put('/api/stats').send({
      userId: userId,
      squat: 99,
    })

    expect(res.body.success).toBe(true)
    expect(res.body.data.squat).toBe(99)
  })
  it('DELETE (DELETE /api/stats/id)', async () => {
    const res = await request(server).delete(`/api/stats/${statsId}`)

    expect(res.body.success).toBe(true)
  })
})
