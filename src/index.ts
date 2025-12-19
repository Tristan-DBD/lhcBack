import 'dotenv/config'
import express from 'express'
import dotenv from 'dotenv'
import route from './routes'

dotenv.config()

const server = express()

server.use(express.json())

server.use('/api', route)

const port = Number(process.env.PORT) || 4000
server.listen(port, () => {
  console.log(`Le serveur est en cours à l'adresse : http://localhost:${port}`)
})

// pour le récuperer dans les fichiers tests
export default server
