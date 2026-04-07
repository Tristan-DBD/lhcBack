export interface Course {
  id: string
  title: string
  description: string | null
  startAt: Date
  durationMinutes: number
  maxParticipants: number
  coachId: string | null
  createdAt: Date
  updatedAt: Date
}
