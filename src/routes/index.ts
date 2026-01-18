import userRoute from './user'
import authRoute from './login'
import statsRoute from './stats'
import courseRoute from './course'
import metricRoute from './metric'
import healthRoute from './health'
import { Router } from 'express'

const route = Router()

route.use('/user', userRoute)
route.use('/stats', statsRoute)
route.use('/auth', authRoute)   
route.use('/course', courseRoute)
route.use('/metric', metricRoute)
route.use('/admin/health', healthRoute)

export default route
