import server from '../src/index'
import request from 'supertest'
import { resetDb } from './resetDb'
import { FileTestHelper } from './testUtils'
import { createToken } from '../src/routes/login'
import prisma from '../src/db-config'

beforeAll(async () => {
  await FileTestHelper.ensureBucketExists()
  await FileTestHelper.uploadTestFiles()
  await resetDb()
})

afterAll(async () => {
  await FileTestHelper.cleanupTestFiles()
})

describe('Test CRUD Produits & Stocks (Shop)', () => {
  let coachToken: string
  let athleteToken: string
  let coachId: string
  let athleteId: string
  let productId: string

  beforeAll(async () => {
    const coach = await prisma.user.create({
      data: {
        name: 'Coach',
        surname: 'Shop',
        age: 35,
        weight: 80,
        phone: '0601020311',
        username: 'coach_shop_test',
        password: 'pwd',
        imageUri: '',
        role: {
          connectOrCreate: {
            where: { name: 'COACH' },
            create: { name: 'COACH' },
          },
        },
      },
    })
    const athlete = await prisma.user.create({
      data: {
        name: 'Athlete',
        surname: 'Shop',
        age: 22,
        weight: 70,
        phone: '0601020312',
        username: 'athlete_shop_test',
        password: 'pwd',
        imageUri: '',
        role: {
          connectOrCreate: {
            where: { name: 'ATHLETE_PROG' },
            create: { name: 'ATHLETE_PROG' },
          },
        },
      },
    })

    coachId = coach.id
    athleteId = athlete.id
    coachToken = await createToken(coachId, 'COACH', 'coach_shop_test')
    athleteToken = await createToken(
      athleteId,
      'ATHLETE_PROG',
      'athlete_shop_test',
    )
  })

  // ─── CREATE ───────────────────────────────────────────────────────────────

  describe('CREATE PRODUCT (POST /api/shop)', () => {
    it('COACH -> Autorisé à créer un produit avec image', async () => {
      const res = await request(server)
        .post('/api/shop')
        .set('Authorization', `Bearer ${coachToken}`)
        .attach('productImage', FileTestHelper.getTestImagePath('test.png'))
        .field('name', 'Maillot LHC')
        .field('price', '45')
        .field('sizes', JSON.stringify(['S', 'M']))

      expect(res.status).toBe(201)
      expect(res.body.success).toBe(true)
      expect(res.body.data[0].message.name).toBe('Maillot LHC')
      productId = res.body.data[0].message.id
    })

    it('ATHLETE -> Interdit de créer un produit (403)', async () => {
      const res = await request(server)
        .post('/api/shop')
        .set('Authorization', `Bearer ${athleteToken}`)
        .field('name', 'Produit Pirate')
        .field('price', '10')
        .field('sizes', JSON.stringify([{ size: 'L', quantity: 3 }]))

      expect(res.status).toBe(403)
    })

    it('COACH -> Echec si champs requis manquants (Zod)', async () => {
      const res = await request(server)
        .post('/api/shop')
        .set('Authorization', `Bearer ${coachToken}`)
        .field('price', '45')
      // name manquant

      expect(res.status).toBe(400)
    })

    it('NO TOKEN -> Non autorisé (401)', async () => {
      const res = await request(server)
        .post('/api/shop')
        .field('name', 'Ghost Product')
        .field('price', '20')

      expect(res.status).toBe(401)
    })
  })

  // ─── READ ─────────────────────────────────────────────────────────────────

  describe('GET ALL PRODUCTS (GET /api/shop)', () => {
    it('COACH -> Autorisé', async () => {
      const res = await request(server)
        .get('/api/shop')
        .set('Authorization', `Bearer ${coachToken}`)

      expect(res.status).toBe(200)
      expect(Array.isArray(res.body.data[0].message)).toBe(true)
    })

    it('ATHLETE -> Autorisé (accès lecture)', async () => {
      const res = await request(server)
        .get('/api/shop')
        .set('Authorization', `Bearer ${athleteToken}`)

      expect(res.status).toBe(200)
    })

    it('NO TOKEN -> Non autorisé (401)', async () => {
      const res = await request(server).get('/api/shop')
      expect(res.status).toBe(401)
    })
  })

  describe('GET PRODUCT BY ID (GET /api/shop/:id)', () => {
    it('COACH -> Récupère un produit existant', async () => {
      const res = await request(server)
        .get(`/api/shop/${productId}`)
        .set('Authorization', `Bearer ${coachToken}`)

      expect(res.status).toBe(200)
      expect(res.body.data[0].message.id).toBe(productId)
    })

    it('COACH -> 404 sur un ID inexistant', async () => {
      const res = await request(server)
        .get('/api/shop/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${coachToken}`)

      expect(res.status).toBe(404)
    })

    it('ATHLETE -> Autorisé à lire un produit', async () => {
      const res = await request(server)
        .get(`/api/shop/${productId}`)
        .set('Authorization', `Bearer ${athleteToken}`)

      expect(res.status).toBe(200)
    })
  })

  // ─── UPDATE PRICE ─────────────────────────────────────────────────────────

  describe('UPDATE PRICE (PUT /api/shop/:id/price)', () => {
    it('COACH -> Modifie le prix', async () => {
      const res = await request(server)
        .put(`/api/shop/${productId}/price`)
        .set('Authorization', `Bearer ${coachToken}`)
        .send({ price: 55 })

      expect(res.status).toBe(200)
      expect(res.body.data[0].message.price).toBe(55)
    })

    it('ATHLETE -> Interdit de modifier le prix (403)', async () => {
      const res = await request(server)
        .put(`/api/shop/${productId}/price`)
        .set('Authorization', `Bearer ${athleteToken}`)
        .send({ price: 1 })

      expect(res.status).toBe(403)
    })

    it('COACH -> 404 sur un ID inexistant', async () => {
      const res = await request(server)
        .put('/api/shop/00000000-0000-0000-0000-000000000000/price')
        .set('Authorization', `Bearer ${coachToken}`)
        .send({ price: 20 })

      expect(res.status).toBe(404)
    })
  })

  // ─── UPDATE STOCK ─────────────────────────────────────────────────────────

  describe('UPDATE STOCK (PUT /api/shop/:id/stock/:size)', () => {
    it("COACH -> Met à jour la quantité d'une taille", async () => {
      const res = await request(server)
        .put(`/api/shop/${productId}/stock/M`)
        .set('Authorization', `Bearer ${coachToken}`)
        .send({ quantity: 25 })

      expect(res.status).toBe(200)
      expect(res.body.data[0].message.quantity).toBe(25)
    })

    it('ATHLETE -> Interdit (403)', async () => {
      const res = await request(server)
        .put(`/api/shop/${productId}/stock/M`)
        .set('Authorization', `Bearer ${athleteToken}`)
        .send({ quantity: 0 })

      expect(res.status).toBe(403)
    })

    it('COACH -> 404 si taille introuvable', async () => {
      const res = await request(server)
        .put(`/api/shop/${productId}/stock/XXL`)
        .set('Authorization', `Bearer ${coachToken}`)
        .send({ quantity: 5 })

      expect(res.status).toBe(404)
    })
  })

  // ─── ADD SIZE ─────────────────────────────────────────────────────────────

  describe('ADD SIZE (POST /api/shop/:id/size)', () => {
    it('COACH -> Ajoute une nouvelle taille', async () => {
      const res = await request(server)
        .post(`/api/shop/${productId}/size`)
        .set('Authorization', `Bearer ${coachToken}`)
        .send({ size: 'XL' })

      expect(res.status).toBe(201)
    })

    it('COACH -> Echec si taille déjà existante', async () => {
      const res = await request(server)
        .post(`/api/shop/${productId}/size`)
        .set('Authorization', `Bearer ${coachToken}`)
        .send({ size: 'XL' }) // déjà créée ci-dessus

      expect(res.status).toBe(400)
    })

    it('COACH -> Echec si taille manquante dans le body', async () => {
      const res = await request(server)
        .post(`/api/shop/${productId}/size`)
        .set('Authorization', `Bearer ${coachToken}`)
        .send({})

      expect(res.status).toBe(400)
    })

    it('ATHLETE -> Interdit (403)', async () => {
      const res = await request(server)
        .post(`/api/shop/${productId}/size`)
        .set('Authorization', `Bearer ${athleteToken}`)
        .send({ size: 'L' })

      expect(res.status).toBe(403)
    })
  })

  // ─── DELETE SIZE ──────────────────────────────────────────────────────────

  describe('DELETE SIZE (DELETE /api/shop/:id/stock/:size)', () => {
    it('COACH -> Supprime une taille', async () => {
      const res = await request(server)
        .delete(`/api/shop/${productId}/stock/XL`)
        .set('Authorization', `Bearer ${coachToken}`)

      expect(res.status).toBe(200)
    })

    it('COACH -> 404 si taille inexistante', async () => {
      const res = await request(server)
        .delete(`/api/shop/${productId}/stock/XXXS`)
        .set('Authorization', `Bearer ${coachToken}`)

      expect(res.status).toBe(404)
    })

    it('ATHLETE -> Interdit (403)', async () => {
      const res = await request(server)
        .delete(`/api/shop/${productId}/stock/S`)
        .set('Authorization', `Bearer ${athleteToken}`)

      expect(res.status).toBe(403)
    })
  })

  // ─── UPDATE IMAGE ─────────────────────────────────────────────────────────

  describe('UPDATE IMAGE (PUT /api/shop/:id/image)', () => {
    it("COACH -> Met à jour l'image du produit", async () => {
      const res = await request(server)
        .put(`/api/shop/${productId}/image`)
        .set('Authorization', `Bearer ${coachToken}`)
        .attach('productImage', FileTestHelper.getTestImagePath('test2.png'))

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
    })

    it('COACH -> Echec sans fichier joint', async () => {
      const res = await request(server)
        .put(`/api/shop/${productId}/image`)
        .set('Authorization', `Bearer ${coachToken}`)

      expect(res.status).toBe(400)
    })

    it('ATHLETE -> Interdit (403)', async () => {
      const res = await request(server)
        .put(`/api/shop/${productId}/image`)
        .set('Authorization', `Bearer ${athleteToken}`)
      // Pas besoin de fichier : authorize('COACH') rejette avant multer

      expect(res.status).toBe(403)
    })
  })

  // ─── DELETE PRODUCT ───────────────────────────────────────────────────────

  describe('DELETE PRODUCT (DELETE /api/shop/:id)', () => {
    it('ATHLETE -> Interdit (403)', async () => {
      const res = await request(server)
        .delete(`/api/shop/${productId}`)
        .set('Authorization', `Bearer ${athleteToken}`)

      expect(res.status).toBe(403)
    })

    it('COACH -> Supprime le produit (et image associée)', async () => {
      const res = await request(server)
        .delete(`/api/shop/${productId}`)
        .set('Authorization', `Bearer ${coachToken}`)

      expect(res.status).toBe(200)
    })

    it('COACH -> 404 sur un produit déjà supprimé', async () => {
      const res = await request(server)
        .delete(`/api/shop/${productId}`)
        .set('Authorization', `Bearer ${coachToken}`)

      expect(res.status).toBe(404)
    })
  })
})
