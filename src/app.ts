import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { renderHomePage, renderMarkdownPage } from './pages.js'
import { getMarkdownBody } from './request.js'
import { readMarkdown, saveMarkdown } from './storage.js'

interface McpHttpTransport {
  handleRequest(request: Request): Response | Promise<Response>
}

export function createApp(mcpTransport: McpHttpTransport) {
  const app = new Hono()

  app.all('/mcp', (c) => mcpTransport.handleRequest(c.req.raw))

  app.get('/', (c) => c.html(renderHomePage()))

  app.post('/markdown', async (c) => {
    const result = await saveMarkdown(await getMarkdownBody(c))

    return c.json(result, 201)
  })

  app.get('/:id/raw', async (c) => {
    const markdown = await readMarkdown(c.req.param('id'))
    return c.text(markdown, 200, { 'content-type': 'text/markdown; charset=utf-8' })
  })

  app.get('/:id', async (c) => {
    const id = c.req.param('id')
    const markdown = await readMarkdown(id)
    return c.html(renderMarkdownPage(id, markdown))
  })

  app.onError((err, c) => {
    if (err instanceof HTTPException) {
      return c.json({ error: err.message }, err.status)
    }

    console.error(err)
    return c.json({ error: 'Interner Serverfehler' }, 500)
  })

  return app
}
