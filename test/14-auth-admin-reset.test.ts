import server from '../src/index'
import request from 'supertest'
import { resetDb } from './resetDb'
import { createToken } from '../src/routes/login'
import bcrypt from 'bcrypt'
import prisma from '../src/db-config'

beforeAll(async () => {
  await resetDb()
})

afterAll(async () => {
  await resetDb()
})

describe("ADMIN RESET PASSWORD (POST /api/auth/admin/reset-password)", () => {
  let adminToken: string
  let coachToken: string
  let athleteToken: string
  let athleteId: string
  let athleteUsername: string

  beforeAll(async () => {
    adminToken = await createToken('00000000-0000-0000-0000-000000000099', 'ADMIN', 'adminuser')
    coachToken = await createToken('00000000-0000-0000-0000-000000000001', 'COACH', 'coachuser')

    const coachRes = await request(server)
      .post('/api/user/coach')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Coach',
        surname: 'Reset',
        age: 30,
        weight: 80,
        phone: '0601020304',
        role: 'COACH',
      })

    const athleteRes = await request(server)
      .post('/api/user')
      .set('Authorization', `Bearer ${coachToken}`)
      .send({
        name: 'Athlete',
        surname: 'Reset',
        age: 25,
        weight: 70,
        phone: '0601020305',
      })

    athleteId = athleteRes.body.data[0].message.id
    athleteUsername = athleteRes.body.data[0].message.username
    athleteToken = await createToken(athleteId, 'ATHLETE_CO', athleteUsername)
  })

  it('ADMIN -> Réinitialisation du mot de passe réussie', async () => {
    const res = await request(server)
      .post('/api/auth/admin/reset-password')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ userId: athleteId })

    expect(res.body.success).toBe(true)
    expect(res.body.data[0].message).toContain('Mot de passe réinitialisé')
    expect(res.body.data[0].message).toContain(athleteUsername)

    // Vérifier que le nouveau hash correspond au mot de passe par défaut
    const updatedUser: any = await prisma.user.findUnique({
      where: { id: athleteId },
    })
    const DEFAULT_PASSWORD = process.env.DEFAULT_USER_PASSWORD || '123456'
    const validPassword = await bcrypt.compare(DEFAULT_PASSWORD, updatedUser.password)
    expect(validPassword).toBe(true)
  })

  it('COACH -> Forbidden', async () => {
    const res = await request(server)
      .post('/api/auth/admin/reset-password')
      .set('Authorization', `Bearer ${coachToken}`)
      .send({ userId: athleteId })

    expect(res.status).toBe(403)
    expect(res.body.success).toBe(false)
  })

  it('ATHLETE -> Forbidden', async () => {
    const res = await request(server)
      .post('/api/auth/admin/reset-password')
      .set('Authorization', `Bearer ${athleteToken}`)
      .send({ userId: athleteId })

    expect(res.status).toBe(403)
    expect(res.body.success).toBe(false)
  })

  it('NO TOKEN -> Unauthorized', async () => {
    const res = await request(server)
      .post('/api/auth/admin/reset-password')
      .send({ userId: athleteId })

    expect(res.status).toBe(401)
  })

  it('USER INEXISTANT -> 404', async () => {
    const res = await request(server)
      .post('/api/auth/admin/reset-password')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ userId: '00000000-0000-0000-0000-000000000000' })

    expect(res.body.success).toBe(false)
    expect(res.body.data[0].message).toBe('Utilisateur non trouvé')
  })

  it('UUID INVALIDE -> 400', async () => {
    const res = await request(server)
      .post('/api/auth/admin/reset-password')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ userId: 'not-a-uuid' })

    expect(res.status).toBe(400)
  })
})
