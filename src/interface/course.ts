export interface Course {
  id: number
  title: string
  description: string | null
  startAt: Date
  durationMinutes: number
  maxParticipants: number
  coachId: number | null
  createdAt: Date
  updatedAt: Date
}
