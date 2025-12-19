import { Role } from '@prisma/client'

export default interface Stats {
  squat: number
  bench: number
  deadlift: number
}

export default interface User {
  id: number
  name: string
  surname: string
  age: number
  weight: number
  phone: string
  role: Role
  stat: Stats[]

  email: string
  password: string
}
