import type { Hono } from 'hono'

type UserRecord = {
  id: string
  username: string
  email: string
  password: string
  displayName: string
  phone?: string
  role: string
  createdAt: string
}

type AuthPayload = {
  username?: string
  email?: string
  password?: string
  displayName?: string
  phone?: string
  role?: string
}

const users = new Map<string, UserRecord>()

function toPublicUser(user: UserRecord) {
  const { password: _password, ...publicUser } = user
  return publicUser
}

export function registerAuthRoutes(app: Hono) {
  app.post('/api/auth/register', async (c) => {
    const { username, email, password, displayName, phone, role } = await c.req.json<AuthPayload>()

    if (!username || !email || !password) {
      return c.json({ success: false, message: '用户名、邮箱和密码为必填项' }, 400)
    }

    const hasDuplicateEmail = [...users.values()].some((u) => u.email === email)
    if (users.has(username) || hasDuplicateEmail) {
      return c.json({ success: false, message: '用户名或邮箱已被注册' }, 409)
    }

    const user: UserRecord = {
      id: 'U_' + Date.now(),
      username,
      email,
      password,
      displayName: displayName || username,
      phone,
      role: role || 'investor',
      createdAt: new Date().toISOString(),
    }

    users.set(username, user)
    return c.json({ success: true, user: toPublicUser(user), message: '注册成功' })
  })

  app.post('/api/auth/login', async (c) => {
    const { username, password } = await c.req.json<AuthPayload>()

    if (!username || !password) {
      return c.json({ success: false, message: '请输入用户名和密码' }, 400)
    }

    const user = users.get(username) || [...users.values()].find((u) => u.email === username)
    if (!user || user.password !== password) {
      return c.json({ success: false, message: '用户名或密码错误' }, 401)
    }

    return c.json({ success: true, user: toPublicUser(user), message: '登录成功' })
  })

  app.post('/api/auth/logout', (c) => c.json({ success: true, message: '已安全退出' }))
  app.get('/api/auth/me', (c) => c.json({ success: true, user: null }))
}
