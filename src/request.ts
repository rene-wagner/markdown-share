import { Context } from 'hono'
import { HTTPException } from 'hono/http-exception'

function getStringField(body: Record<string, unknown>, key: string, message: string) {
  const value = body[key]
  if (typeof value !== 'string') {
    throw new HTTPException(400, { message })
  }

  return value
}

async function getStructuredBody(c: Context) {
  const contentType = c.req.header('content-type') ?? ''

  if (contentType.includes('application/json')) {
    try {
      return await c.req.json<Record<string, unknown>>()
    } catch {
      throw new HTTPException(400, { message: 'Invalid JSON body' })
    }
  }

  if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
    const formData = await c.req.formData()
    return Object.fromEntries(formData.entries())
  }

  throw new HTTPException(415, { message: 'Unsupported content type' })
}

export async function getMarkdownBody(c: Context) {
  const contentType = c.req.header('content-type') ?? ''

  if (contentType.includes('application/json')) {
    let body: { markdown?: unknown; title?: unknown }

    try {
      body = await c.req.json<{ markdown?: unknown; title?: unknown }>()
    } catch {
      throw new HTTPException(400, { message: 'Invalid JSON body' })
    }

    if (typeof body.markdown !== 'string') {
      throw new HTTPException(400, { message: 'JSON must contain a "markdown" field' })
    }

    if (body.title !== undefined && typeof body.title !== 'string') {
      throw new HTTPException(400, { message: 'JSON "title" field must be a string' })
    }

    return { markdown: body.markdown, title: body.title }
  }

  return { markdown: await c.req.text() }
}

export async function getLoginBody(c: Context) {
  const body = await getStructuredBody(c)
  return {
    username: getStringField(body, 'username', 'Request must contain a "username" field'),
    password: getStringField(body, 'password', 'Request must contain a "password" field'),
  }
}

export async function getPasswordChangeBody(c: Context) {
  const body = await getStructuredBody(c)
  return {
    currentPassword: getStringField(body, 'currentPassword', 'Request must contain a "currentPassword" field'),
    newPassword: getStringField(body, 'newPassword', 'Request must contain a "newPassword" field'),
  }
}
