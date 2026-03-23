/**
 * ===================================================================
 * 参与通 Deal Connect — Full-Stack SPA
 * ===================================================================
 */
import { Hono } from 'hono'
import { authRoutes } from './routes/auth'
import { dealRoutes } from './routes/deals'
import { registerPageRoutes } from './routes/pages'

const app = new Hono()

app.route('/api/auth', authRoutes)
app.route('/api/deals', dealRoutes)
registerPageRoutes(app)

export default app
