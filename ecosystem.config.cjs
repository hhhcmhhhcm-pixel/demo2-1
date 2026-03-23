/**
 * ecosystem.config.cjs -- PM2进程管理配置 (V20)
 *
 * 使用PM2在沙箱环境中以daemon模式运行Wrangler开发服务器。
 *
 * 启动命令: pm2 start ecosystem.config.cjs
 * 查看日志: pm2 logs webapp --nostream
 * 重启:     pm2 restart webapp
 * 停止:     pm2 delete webapp
 *
 * 注意: 启动前必须先执行 npm run build 生成 dist/ 目录
 */
module.exports = {
  apps: [
    {
      name: 'webapp',                    // PM2进程名称
      script: 'npx',                     // 执行器
      args: 'wrangler pages dev dist --ip 0.0.0.0 --port 3000', // Wrangler本地开发服务
      cwd: '/home/user/webapp',          // 工作目录
      env: {
        NODE_ENV: 'development',         // 环境标识
        PORT: 3000                       // 服务端口
      },
      watch: false,                      // 禁用PM2文件监控(wrangler自带热更新)
      instances: 1,                      // 单实例运行(开发模式)
      exec_mode: 'fork'                  // fork模式(非cluster)
    }
  ]
}
