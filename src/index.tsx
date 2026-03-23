/**
 * ===================================================================
 * 参与通 Deal Connect — Full-Stack SPA
 * ===================================================================
 */
import { Hono } from 'hono'
import { registerAuthRoutes } from './routes/auth'
import { registerDealRoutes } from './routes/deals'
import { registerPageRoutes } from './routes/pages'

const app = new Hono()

registerAuthRoutes(app)
registerDealRoutes(app)
registerPageRoutes(app)

export default app
