import { Course } from './course'

export default interface User {
  id: string
  name: string
  surname: string
  age: number
  weight: number
  phone: string
  role: string
  imageUri: string
  programs: { id: string; name: string; fileUri: string }[]
  stats: { squat: number; bench: number; deadlift: number }[]
  courses: Course[]

  username: string
  password: string
}
