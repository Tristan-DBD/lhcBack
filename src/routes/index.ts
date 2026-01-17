import userRoute from './user'
import authRoute from './login'
import statsRoute from './stats'
import courseRoute from './course'
import healthRoute from './health'
import metricRoute from './metric'
import { Router } from 'express'

const route = Router()

route.use('/user', userRoute)
route.use('/stats', statsRoute)
route.use('/auth', authRoute)
route.use('/course', courseRoute)
route.use('/health', healthRoute)
route.use('/metric', metricRoute)

export default route
