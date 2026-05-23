import { serve } from '@hono/node-server'
import { createApp } from './app.js'
import { createMcpTransport } from './mcp.js'
import { ensureDefaultUser } from './user.js'

const createdDefaultUser = await ensureDefaultUser()
if (createdDefaultUser) {
  console.warn('Created default admin user with username "admin" and password "password". Please change the password immediately.')
}

const mcpTransport = await createMcpTransport()
const app = createApp(mcpTransport)

const port = Number(process.env.PORT ?? 3000)
serve({ fetch: app.fetch, port }, (info) => {
  console.log(`Server running at http://localhost:${info.port}`)
})
