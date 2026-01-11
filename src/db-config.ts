import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import dotenv from 'dotenv'

const env = process.env.NODE_ENV === 'production' ? 'prod' : 'dev'
dotenv.config({ path: `.env.${env}` })
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is missing')
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

export default prisma
