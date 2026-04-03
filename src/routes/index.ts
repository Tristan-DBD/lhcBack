import userRoute from './user'
import authRoute from './login'
import statsRoute from './stats'
import courseRoute from './course'
import metricRoute from './metric'
import healthRoute from './health'
import paymentRoute from './payment'
import shopRoute from './shop'
import orderRoute from './order'
import coachingSlotRoute from './coaching_slot'
import { Router } from 'express'

const route = Router()

route.use('/user', userRoute)
route.use('/stats', statsRoute)
route.use('/auth', authRoute)
route.use('/course', courseRoute)
route.use('/metric', metricRoute)
route.use('/payment', paymentRoute)
route.use('/shop', shopRoute)
route.use('/order', orderRoute)
route.use('/coaching-slots', coachingSlotRoute)
route.use('/admin/health', healthRoute)

export default route
