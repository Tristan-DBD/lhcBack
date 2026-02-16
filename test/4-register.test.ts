import request from 'supertest'
import server from '../src'
import { createToken } from '../src/routes/login'
import { resetDb } from './resetDb'

beforeAll(async () => {
    await resetDb()
})

describe('REGISTER/UNREGISTER', () => {
    let athletes: any[]
    let limitedCourseId: number
    let coach: any

    beforeAll(async () => {
        const adminToken = await createToken(98, 'ADMIN', 'admin@gmail.com')

        // Créer le coach
        const coachRes = await request(server)
            .post('/api/user/coach')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                name: 'Coach',
                surname: 'Test',
                age: 30,
                weight: 80,
                phone: '0601020304',
                email: 'coach@test.com',
                password: 'password123',
                role: 'COACH',
            })

        coach = {
            id: coachRes.body.data[0].message.id,
            token: await createToken(coachRes.body.data[0].message.id, 'COACH', 'coach@test.com')
        }

        // Créer 5 athlètes pour tester la capacité
        athletes = []
        for (let i = 0; i < 5; i++) {
            const res = await request(server)
                .post('/api/user')
                .set('Authorization', `Bearer ${coach.token}`)
                .send({
                    name: `Athlete${i}`,
                    surname: 'Test',
                    age: 25,
                    weight: 70,
                    phone: `06010203${i.toString().padStart(2, '0')}`,
                    email: `athlete${i}@test.com`,
                    password: 'password123',
                })
            athletes.push({
                id: res.body.data[0].message.id,
                token: await createToken(res.body.data[0].message.id, 'ATHLETE_CO', `athlete${i}@test.com`)
            })
        }

        // Créer un cours avec 3 places max
        const courseRes = await request(server)
            .post('/api/course')
            .set('Authorization', `Bearer ${coach.token}`)
            .send({
                title: 'Cours limité',
                maxParticipants: 3,
                startAt: new Date(),
                coachId: coach.id,
                durationMinutes: 60,
                description: 'Cours pour tester la capacité'
            })
        limitedCourseId = courseRes.body.data[0].message.id
    })

    describe('REGISTER (POST /api/course/register)', () => {
        it('ATHLETE -> Succès inscription', async () => {
            const res = await request(server)
                .post('/api/course/register')
                .set('Authorization', `Bearer ${athletes[0].token}`)
                .send({ userId: athletes[0].id, courseId: limitedCourseId })

            expect(res.body.success).toBe(true)
        })

        it('ATHLETE -> Déjà inscrit', async () => {
            const res = await request(server)
                .post('/api/course/register')
                .set('Authorization', `Bearer ${athletes[0].token}`)
                .send({ userId: athletes[0].id, courseId: limitedCourseId })

            expect(res.body.success).toBe(false)
            expect(res.body.data[0].message).toBe('Déjà inscrit au cours')
        })

        it('COURS COMPLET -> 400', async () => {
            // Inscrire 2 autres athlètes (total = 3)
            for (let i = 1; i <= 2; i++) {
                const res = await request(server)
                    .post('/api/course/register')
                    .set('Authorization', `Bearer ${athletes[i].token}`)
                    .send({ userId: athletes[i].id, courseId: limitedCourseId })
                expect(res.body.success).toBe(true)
            }

            // Le 4ème athlète échoue (cours complet)
            const res = await request(server)
                .post('/api/course/register')
                .set('Authorization', `Bearer ${athletes[3].token}`)
                .send({ userId: athletes[3].id, courseId: limitedCourseId })

            expect(res.body.success).toBe(false)
            expect(res.body.data[0].message).toBe('Cours complet')
        })

        it('COURS INEXISTANT -> 404', async () => {
            const res = await request(server)
                .post('/api/course/register')
                .set('Authorization', `Bearer ${athletes[4].token}`)
                .send({ userId: athletes[4].id, courseId: 99999 })

            expect(res.body.success).toBe(false)
            expect(res.body.data[0].message).toBe('Cours non trouvé')
        })

        it('COACH -> Unauthorize', async () => {
            const res = await request(server)
                .post('/api/course/register')
                .set('Authorization', `Bearer ${coach.token}`)
                .send({ userId: athletes[4].id, courseId: limitedCourseId })

            expect(res.body.success).toBe(false)
        })

        it('NO TOKEN -> Unauthorized', async () => {
            const res = await request(server)
                .post('/api/course/register')
                .send({ userId: athletes[4].id, courseId: limitedCourseId })

            expect(res.status).toBe(401)
        })
    })

    describe('UNREGISTER (POST /api/course/unregister)', () => {
        it('ATHLETE -> Succès désinscription', async () => {
            const res = await request(server)
                .post('/api/course/unregister')
                .set('Authorization', `Bearer ${athletes[0].token}`)
                .send({ userId: athletes[0].id, courseId: limitedCourseId })
            expect(res.body.success).toBe(true)
        })

        it('ATHLETE -> Non inscrit', async () => {
            const res = await request(server)
                .post('/api/course/unregister')
                .set('Authorization', `Bearer ${athletes[0].token}`)
                .send({ userId: athletes[0].id, courseId: limitedCourseId })

            expect(res.body.success).toBe(false)
            expect(res.body.data[0].message).toBe('Non inscrit au cours')
        })

        it('COURS INEXISTANT -> 404', async () => {
            const res = await request(server)
                .post('/api/course/unregister')
                .set('Authorization', `Bearer ${athletes[1].token}`)
                .send({ userId: athletes[1].id, courseId: 99999 })

            expect(res.body.success).toBe(false)
            expect(res.body.data[0].message).toBe('Cours non trouvé')
        })

        it('COACH -> Authorized', async () => {
            const res = await request(server)
                .post('/api/course/unregister')
                .set('Authorization', `Bearer ${coach.token}`)
                .send({ userId: athletes[1].id, courseId: limitedCourseId })

            expect(res.body.success).toBe(true)
        })

        it('NO TOKEN -> Unauthorized', async () => {
            const res = await request(server)
                .post('/api/course/unregister')
                .send({ userId: athletes[1].id, courseId: limitedCourseId })

            expect(res.status).toBe(401)
        })
    })
})