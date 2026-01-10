import { Role } from '@prisma/client'
import { Course } from './course'

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
  imageUri: string
  progUri: string
  stat: Stats[]
  courses: Course[]

  email: string
  password: string
}
