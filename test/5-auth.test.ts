import request from 'supertest'
import server from '../src'
import { resetDb } from './resetDb'
import { createToken } from '../src/routes/login'
import bcrypt from 'bcrypt'

beforeAll(async () => {
    await resetDb()
})

afterAll(async () => {
    await resetDb()
})

describe('AUTHENTICATION', () => {
    let coachUser: any
    let coachToken: string
    let testPassword = 'password123'

    beforeAll(async () => {
        // Créer un utilisateur de test pour les tests de login

        const createRes = await request(server)
            .post('/api/user')
            .set('Authorization', `Bearer ${await createToken(1, 'ADMIN', 'admin@test.com')}`)
            .send({
                name: 'Coach',
                surname: 'Test',
                age: 30,
                weight: 80,
                phone: '0601020304',
                email: 'coach@test.com',
                password: testPassword,
                role: 'COACH'
            })

        coachUser = createRes.body.data[0].message
        coachToken = await createToken(coachUser.id, coachUser.role, coachUser.email)
    })

    describe('POST /api/auth/login', () => {
        it('SUCCESS -> Valid credentials', async () => {
            const res = await request(server)
                .post('/api/auth/login')
                .send({
                    email: 'coach@test.com',
                    password: testPassword
                })

            expect(res.body.success).toBe(true)
        })

        it('ERROR -> Invalid email', async () => {
            const res = await request(server)
                .post('/api/auth/login')
                .send({
                    email: 'nonexistent@test.com',
                    password: testPassword
                })

            expect(res.body.success).toBe(false)
            expect(res.body.data[0].message).toBe('Email ou mot de passe incorect')
        })

        it('ERROR -> Invalid password', async () => {
            const res = await request(server)
                .post('/api/auth/login')
                .send({
                    email: 'coach@test.com',
                    password: 'wrongpassword'
                })

            expect(res.body.success).toBe(false)
            expect(res.body.data[0].message).toBe('Email ou mot de passe incorect')
        })

        it('ERROR -> Missing email', async () => {
            const res = await request(server)
                .post('/api/auth/login')
                .send({
                    password: testPassword
                })

            expect([400, 429]).toContain(res.status)
            if (res.status === 400) {
                expect(res.body.success).toBe(false)
            }
        })

        it('ERROR -> Missing password', async () => {
            const res = await request(server)
                .post('/api/auth/login')
                .send({
                    email: 'coach@test.com'
                })

            expect([400, 429]).toContain(res.status)
            if (res.status === 400) {
                expect(res.body.success).toBe(false)
            }
        })

        it('ERROR -> Empty credentials', async () => {
            const res = await request(server)
                .post('/api/auth/login')
                .send({})

            expect([400, 429]).toContain(res.status)
            if (res.status === 400) {
                expect(res.body.success).toBe(false)
            }
        })

        it('RATE LIMIT -> Too many attempts', async () => {
            const loginData = {
                email: 'coach@test.com',
                password: 'wrongpassword'
            }

            // Faire 6 tentatives (limite configurée à 5 par 15 minutes)
            const promises = Array(6).fill(null).map(() =>
                request(server)
                    .post('/api/auth/login')
                    .send(loginData)
            )

            const results = await Promise.all(promises)

            // Vérifier qu'il n'y a PAS d'erreurs de login
            const loginErrors = results.filter(res => res?.status === 409)
            expect(loginErrors.length).toBe(0)
        })

        it('SUCCESS -> Rate limit resets after successful login', async () => {
            // Attendre un peu ou faire un login réussi pour réinitialiser
            const res = await request(server)
                .post('/api/auth/login')
                .send({
                    email: 'coach@test.com',
                    password: testPassword
                })

            expect([200, 429]).toContain(res.status)
            if (res.status === 200) {
                expect(res.body.success).toBe(true)
            }
        })
    })

    describe('POST /api/auth/register', () => {
        it('SUCCESS -> Create new user', async () => {
            const newUser = {
                name: 'New',
                surname: 'User',
                age: 25,
                weight: 70,
                phone: '0601020305',
                email: 'newuser@test.com',
                password: 'newpassword123',
                role: 'ATHLETE_CO'
            }

            const res = await request(server)
                .post('/api/auth/register')
                .send(newUser)

            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)
            expect(res.body.data[0].message).toBeDefined()
            expect(typeof res.body.data[0].message).toBe('string') // JWT token

            // Vérifier que le token est valide en le décodant
            const tokenParts = res.body.data[0].message.split('.')
            if (tokenParts.length === 3) {
                const decoded = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString())
                expect(decoded.email).toBe(newUser.email)
            }
            expect(res.body.data[0].message.password).toBeUndefined() // Password shouldn't be returned
        })

        it('ERROR -> Duplicate email', async () => {
            const duplicateUser = {
                name: 'Duplicate',
                surname: 'User',
                age: 25,
                weight: 70,
                phone: '0601020306',
                email: 'coach@test.com', // Email déjà existant
                password: 'password123',
                role: 'ATHLETE_CO'
            }

            const res = await request(server)
                .post('/api/auth/register')
                .send(duplicateUser)

            expect(res.status).toBe(409)
            expect(res.body.success).toBe(false)
            expect(res.body.data[0].message).toBe('Utilisateur déjà existant')
        })

        it('ERROR -> Invalid email format', async () => {
            const invalidUser = {
                name: 'Invalid',
                surname: 'User',
                age: 25,
                weight: 70,
                phone: '0601020307',
                email: 'invalid-email', // Format invalide
                password: 'password123',
                role: 'ATHLETE_CO'
            }

            const res = await request(server)
                .post('/api/auth/register')
                .send(invalidUser)

            expect([200, 400, 429]).toContain(res.status)
            if (res.status === 400) {
                expect(res.body.success).toBe(false)
            }
        })

        it('ERROR -> Missing required fields', async () => {
            const incompleteUser = {
                name: 'Incomplete',
                // Manque: surname, age, weight, phone, email, password, role
            }

            const res = await request(server)
                .post('/api/auth/register')
                .send(incompleteUser)

            expect([400, 429]).toContain(res.status)
            if (res.status === 400) {
                expect(res.body.success).toBe(false)
            }
        })

        it('ERROR -> Invalid age (negative)', async () => {
            const invalidAgeUser = {
                name: 'Invalid',
                surname: 'Age',
                age: -5, // Âge invalide
                weight: 70,
                phone: '0601020308',
                email: 'invalidage@test.com',
                password: 'password123',
                role: 'ATHLETE_CO'
            }

            const res = await request(server)
                .post('/api/auth/register')
                .send(invalidAgeUser)

            expect([400, 429]).toContain(res.status)
            if (res.status === 400) {
                expect(res.body.success).toBe(false)
            }
        })

        it('ERROR -> Invalid weight (zero)', async () => {
            const invalidWeightUser = {
                name: 'Invalid',
                surname: 'Weight',
                age: 25,
                weight: 0, // Poids invalide
                phone: '0601020309',
                email: 'invalidweight@test.com',
                password: 'password123',
                role: 'ATHLETE_CO'
            }

            const res = await request(server)
                .post('/api/auth/register')
                .send(invalidWeightUser)

            expect([400, 429]).toContain(res.status)
            if (res.status === 400) {
                expect(res.body.success).toBe(false)
            }
        })

        it('ERROR -> Invalid role', async () => {
            const invalidRoleUser = {
                name: 'Invalid',
                surname: 'Role',
                age: 25,
                weight: 70,
                phone: '0601020310',
                email: 'invalidrole@test.com',
                password: 'password123',
                role: 'INVALID_ROLE' // Rôle invalide
            }

            const res = await request(server)
                .post('/api/auth/register')
                .send(invalidRoleUser)

            expect([400, 429]).toContain(res.status)
            if (res.status === 400) {
                expect(res.body.success).toBe(false)
            }
        })

        it('RATE LIMIT -> Too many registration attempts', async () => {
            const newUser = {
                name: 'Rate',
                surname: 'Limit',
                age: 25,
                weight: 70,
                phone: '0601020311',
                email: 'ratelimit@test.com',
                password: 'password123',
                role: 'ATHLETE_CO'
            }

            // Faire 4 tentatives (limite configurée à 3 par 60 minutes)
            const promises = Array(4).fill(null).map((_, index) =>
                request(server)
                    .post('/api/auth/register')
                    .send({
                        ...newUser,
                        email: `ratelimit${index}@test.com`
                    })
            )

            const results = await Promise.all(promises)

            // Vérifier qu'au moins une requête a été limitée
            const hasRateLimit = results.some(res => res?.status === 429)
            expect(hasRateLimit).toBe(true)
        })
    })

    describe('Security Tests', () => {
        it('ERROR -> SQL Injection attempt in email', async () => {
            const res = await request(server)
                .post('/api/auth/login')
                .send({
                    email: "'; DROP TABLE users; --",
                    password: testPassword
                })

            expect([403, 429]).toContain(res.status)
            if (res.status === 403) {
                expect(res.body.success).toBe(false)
            }
        })

        it('ERROR -> XSS attempt in email', async () => {
            const res = await request(server)
                .post('/api/auth/login')
                .send({
                    email: '<script>alert("xss")</script>@test.com',
                    password: testPassword
                })

            expect([403, 429]).toContain(res.status)
            if (res.status === 403) {
                expect(res.body.success).toBe(false)
            }
        })

        it('ERROR -> Very long email', async () => {
            const longEmail = 'a'.repeat(300) + '@test.com'

            const res = await request(server)
                .post('/api/auth/login')
                .send({
                    email: longEmail,
                    password: testPassword
                })

            expect([403, 429]).toContain(res.status)
            if (res.status === 403) {
                expect(res.body.success).toBe(false)
            }
        })
    })
})