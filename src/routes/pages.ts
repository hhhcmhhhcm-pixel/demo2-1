import type { Hono } from 'hono'
import { MAIN_HTML } from '../pages/main-html'

const FAVICON_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="url(#g)"/><defs><linearGradient id="g" x1="0" y1="0" x2="64" y2="64"><stop offset="0%" stop-color="#2EC4B6"/><stop offset="100%" stop-color="#28A696"/></linearGradient></defs><path d="M20 20 L44 32 L20 44 Z" fill="white" opacity="0.95"/></svg>'

export function registerPageRoutes(app: Hono) {
  app.get('/', (c) => c.html(MAIN_HTML))
  app.get('/favicon.svg', () => {
    return new Response(FAVICON_SVG, {
      headers: { 'Content-Type': 'image/svg+xml' },
    })
  })
}
