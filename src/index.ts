import { config } from 'dotenv'
import express from 'express'

config()

const server = express()

const port = Number(process.env.PORT)
server.listen(port, () => {
  console.log(`Le serveur est en cour à l'adresse : http://localhost:${port}`)
})

export default server
