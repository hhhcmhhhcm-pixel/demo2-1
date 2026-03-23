/**
 * vite.config.ts -- Vite构建配置 (V20)
 *
 * 使用 @hono/vite-build/cloudflare-pages 插件将Hono应用编译为
 * Cloudflare Pages格式(生成 dist/_worker.js + _routes.json)。
 *
 * devServer插件提供本地开发时的HMR热更新支持，
 * 使用cloudflare适配器模拟Cloudflare Workers运行时环境。
 *
 * 入口文件: src/index.tsx (Hono应用主文件)
 * 构建输出: dist/ 目录
 */
import build from '@hono/vite-build/cloudflare-pages'
import devServer from '@hono/vite-dev-server'
import adapter from '@hono/vite-dev-server/cloudflare'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    build(),
    devServer({
      adapter,
      entry: 'src/index.tsx'
    })
  ]
})
