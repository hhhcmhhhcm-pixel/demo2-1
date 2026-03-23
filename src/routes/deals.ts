import { Hono } from 'hono'

export const dealRoutes = new Hono()

dealRoutes.get('/', (c) => c.json({ success: true, deals: [] }))
