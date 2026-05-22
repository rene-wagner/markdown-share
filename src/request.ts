import { Context } from 'hono'
import { HTTPException } from 'hono/http-exception'

export async function getMarkdownBody(c: Context) {
  const contentType = c.req.header('content-type') ?? ''

  if (contentType.includes('application/json')) {
    const body = await c.req.json<{ markdown?: unknown }>()
    if (typeof body.markdown !== 'string') {
      throw new HTTPException(400, { message: 'JSON must contain a "markdown" field' })
    }

    return body.markdown
  }

  return c.req.text()
}
