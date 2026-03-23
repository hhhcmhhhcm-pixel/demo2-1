import type { Hono } from 'hono'

export function registerDealRoutes(app: Hono) {
  app.get('/api/deals', (c) => c.json({ success: true, deals: [] }))
}
