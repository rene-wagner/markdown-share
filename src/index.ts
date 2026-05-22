import { serve } from '@hono/node-server'
import { createApp } from './app.js'
import { createMcpTransport } from './mcp.js'

const mcpTransport = await createMcpTransport()
const app = createApp(mcpTransport)

const port = Number(process.env.PORT ?? 3000)
serve({ fetch: app.fetch, port }, (info) => {
  console.log(`Server läuft auf http://localhost:${info.port}`)
})
