import { Context, Hono } from 'hono'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import { HTTPException } from 'hono/http-exception'
import { generateApiKey, hashApiKey, sessionCookieName, sessionMaxAgeSeconds } from './auth.js'
import {
  renderAccountPage,
  renderHomePage,
  renderLoginPage,
  renderMarkdownListPage,
  renderMarkdownPage,
  renderStatusPage,
} from './pages.js'
import { getLoginBody, getMarkdownBody, getPasswordChangeBody } from './request.js'
import { createSession, deleteSession, getSession } from './sessions.js'
import { deleteMarkdown, listMarkdownIds, readMarkdown, saveMarkdown } from './storage.js'
import {
  getUser,
  hasDefaultPassword,
  setApiKeyHash,
  updatePassword,
  verifyApiKey,
  verifyCurrentPassword,
  verifyLogin,
} from './user.js'

interface McpHttpTransport {
  handleRequest(request: Request): Response | Promise<Response>
}

async function getSessionUser(c: Context) {
  const sessionId = getCookie(c, sessionCookieName)
  if (!sessionId) {
    return null
  }

  const session = await getSession(sessionId)
  if (!session) {
    return null
  }

  const user = await getUser()
  return session.userId === user.id ? user : null
}

async function getApiKeyUser(c: Context) {
  const authorization = c.req.header('authorization') ?? ''
  if (!authorization.startsWith('Bearer ')) {
    return null
  }

  const apiKey = authorization.slice('Bearer '.length).trim()
  if (!apiKey) {
    return null
  }

  return verifyApiKey(apiKey)
}

async function getAuthenticatedUser(c: Context) {
  const sessionUser = await getSessionUser(c)
  if (sessionUser) {
    return sessionUser
  }

  return getApiKeyUser(c)
}

function isJsonRequest(c: Context) {
  return (c.req.header('content-type') ?? '').includes('application/json')
}

function wantsHtml(c: Context) {
  return (c.req.header('accept') ?? '').includes('text/html')
}

function setSessionCookie(c: Context, sessionId: string) {
  setCookie(c, sessionCookieName, sessionId, {
    path: '/',
    httpOnly: true,
    sameSite: 'Lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: sessionMaxAgeSeconds,
  })
}

function redirectToLogin(c: Context, notice: string) {
  const location = `/login?notice=${encodeURIComponent(notice)}`
  return c.redirect(location, 303)
}

function getHttpExceptionMessage(err: HTTPException) {
  return err.message || 'Request failed'
}

export function createApp(mcpTransport: McpHttpTransport) {
  const app = new Hono()

  app.all('/mcp', async (c) => {
    const user = await getApiKeyUser(c)
    if (!user) {
      c.header('WWW-Authenticate', 'Bearer realm="markdown-share"')
      return c.json(
        {
          error: 'A valid API key is required. Send it as Authorization: Bearer <api-key>.',
        },
        401,
      )
    }

    return mcpTransport.handleRequest(c.req.raw)
  })

  app.get('/', async (c) => {
    const user = await getSessionUser(c)
    return c.html(renderHomePage(Boolean(user)))
  })

  app.get('/login', async (c) => {
    const user = await getSessionUser(c)
    if (user) {
      return c.redirect('/account', 303)
    }

    return c.html(
      renderLoginPage({
        notice: c.req.query('notice'),
      }),
    )
  })

  app.post('/login', async (c) => {
    const { username, password } = await getLoginBody(c)
    const user = await verifyLogin(username, password)

    if (!user) {
      if (isJsonRequest(c)) {
        return c.json({ error: 'Invalid username or password' }, 401)
      }

      return c.html(renderLoginPage({ error: 'Invalid username or password' }), 401)
    }

    const session = await createSession(user.id)
    setSessionCookie(c, session.id)

    if (isJsonRequest(c)) {
      return c.json({ username: user.username }, 200)
    }

    return c.redirect('/account', 303)
  })

  app.post('/logout', async (c) => {
    const sessionId = getCookie(c, sessionCookieName)
    if (sessionId) {
      await deleteSession(sessionId)
    }

    deleteCookie(c, sessionCookieName, { path: '/' })

    if (isJsonRequest(c)) {
      return c.json({ ok: true }, 200)
    }

    return redirectToLogin(c, 'Signed out successfully.')
  })

  app.get('/account', async (c) => {
    const user = await getSessionUser(c)
    if (!user) {
      return redirectToLogin(c, 'Please sign in to open the account page.')
    }

    return c.html(
      renderAccountPage({
        username: user.username,
        passwordWarning: hasDefaultPassword(user),
        hasApiKey: Boolean(user.apiKeyHash),
      }),
    )
  })

  app.post('/account/password', async (c) => {
    const user = await getSessionUser(c)
    if (!user) {
      if (isJsonRequest(c)) {
        return c.json({ error: 'Authentication required' }, 401)
      }

      return redirectToLogin(c, 'Please sign in to change the password.')
    }

    const { currentPassword, newPassword } = await getPasswordChangeBody(c)
    if (!(await verifyCurrentPassword(currentPassword))) {
      if (isJsonRequest(c)) {
        return c.json({ error: 'Current password is incorrect' }, 401)
      }

      return c.html(
        renderAccountPage({
          username: user.username,
          passwordWarning: hasDefaultPassword(user),
          hasApiKey: Boolean(user.apiKeyHash),
          error: 'Current password is incorrect',
        }),
        401,
      )
    }

    if (newPassword.length < 10) {
      if (isJsonRequest(c)) {
        return c.json({ error: 'New password must be at least 10 characters long' }, 400)
      }

      return c.html(
        renderAccountPage({
          username: user.username,
          passwordWarning: hasDefaultPassword(user),
          hasApiKey: Boolean(user.apiKeyHash),
          error: 'New password must be at least 10 characters long',
        }),
        400,
      )
    }

    const updatedUser = await updatePassword(newPassword)

    if (isJsonRequest(c)) {
      return c.json({ ok: true }, 200)
    }

    return c.html(
      renderAccountPage({
        username: updatedUser.username,
        passwordWarning: hasDefaultPassword(updatedUser),
        hasApiKey: Boolean(updatedUser.apiKeyHash),
        success: 'Password updated successfully.',
      }),
    )
  })

  app.post('/account/api-key', async (c) => {
    const user = await getSessionUser(c)
    if (!user) {
      if (isJsonRequest(c)) {
        return c.json({ error: 'Authentication required' }, 401)
      }

      return redirectToLogin(c, 'Please sign in to generate an API key.')
    }

    const apiKey = generateApiKey()
    const updatedUser = await setApiKeyHash(hashApiKey(apiKey))

    if (isJsonRequest(c)) {
      return c.json({ apiKey }, 201)
    }

    return c.html(
      renderAccountPage({
        username: updatedUser.username,
        passwordWarning: hasDefaultPassword(updatedUser),
        hasApiKey: Boolean(updatedUser.apiKeyHash),
        success: 'Generated a new API key. The previous key is no longer valid.',
        apiKey,
      }),
    )
  })

  app.get('/markdown', async (c) => {
    const user = await getAuthenticatedUser(c)
    if (!user) {
      if (wantsHtml(c)) {
        return redirectToLogin(c, 'Please sign in to open the markdown overview.')
      }

      c.header('WWW-Authenticate', 'Bearer realm="markdown-share"')
      throw new HTTPException(401, {
        message: 'Authentication required. Use a session cookie or Authorization: Bearer <api-key>.',
      })
    }

    const ids = await listMarkdownIds()
    if (!wantsHtml(c)) {
      return c.json(
        {
          markdown: ids.map((id) => ({
            id,
            rawUrl: `/${id}/raw`,
            htmlUrl: `/${id}`,
          })),
        },
        200,
      )
    }

    return c.html(
      renderMarkdownListPage({
        ids,
        notice: c.req.query('notice'),
      }),
    )
  })

  app.post('/markdown', async (c) => {
    const user = await getAuthenticatedUser(c)
    if (!user) {
      c.header('WWW-Authenticate', 'Bearer realm="markdown-share"')
      throw new HTTPException(401, {
        message: 'Authentication required. Use a session cookie or Authorization: Bearer <api-key>.',
      })
    }

    const result = await saveMarkdown(await getMarkdownBody(c))
    return c.json(result, 201)
  })

  app.post('/markdown/:id/delete', async (c) => {
    const user = await getAuthenticatedUser(c)
    if (!user) {
      if (wantsHtml(c)) {
        return redirectToLogin(c, 'Please sign in to delete stored Markdown.')
      }

      c.header('WWW-Authenticate', 'Bearer realm="markdown-share"')
      throw new HTTPException(401, {
        message: 'Authentication required. Use a session cookie or Authorization: Bearer <api-key>.',
      })
    }

    const id = c.req.param('id')
    await deleteMarkdown(id)

    if (wantsHtml(c)) {
      return c.redirect(`/markdown?notice=${encodeURIComponent('Markdown deleted successfully.')}`, 303)
    }

    return c.json({ ok: true, id }, 200)
  })

  app.get('/:id/raw', async (c) => {
    const user = await getAuthenticatedUser(c)
    if (!user) {
      c.header('WWW-Authenticate', 'Bearer realm="markdown-share"')
      throw new HTTPException(401, {
        message: 'Authentication required. Use a session cookie or Authorization: Bearer <api-key>.',
      })
    }

    const markdown = await readMarkdown(c.req.param('id'))
    return c.text(markdown, 200, { 'content-type': 'text/markdown; charset=utf-8' })
  })

  app.get('/:id', async (c) => {
    const user = await getAuthenticatedUser(c)
    if (!user) {
      return redirectToLogin(c, 'Please sign in to view stored Markdown.')
    }

    const id = c.req.param('id')
    const markdown = await readMarkdown(id)
    return c.html(renderMarkdownPage(id, markdown))
  })

  app.notFound((c) => {
    if (wantsHtml(c)) {
      return c.html(
        renderStatusPage({
          title: 'Not found',
          heading: 'Page not found',
          message: 'The page or markdown document you requested does not exist.',
          actionHref: '/',
          actionLabel: 'Open home',
        }),
        404,
      )
    }

    return c.json({ error: 'Not found' }, 404)
  })

  app.onError((err, c) => {
    if (err instanceof HTTPException) {
      if (wantsHtml(c)) {
        const status = err.status
        const title =
          status === 401 ? 'Authentication required' : status === 404 ? 'Not found' : 'Request failed'
        const heading =
          status === 401 ? 'Authentication required' : status === 404 ? 'Page not found' : 'Request failed'

        return c.html(
          renderStatusPage({
            title,
            heading,
            message: getHttpExceptionMessage(err),
            actionHref: status === 401 ? '/login' : '/',
            actionLabel: status === 401 ? 'Open login' : 'Open home',
          }),
          status,
        )
      }

      return c.json({ error: getHttpExceptionMessage(err) }, err.status)
    }

    console.error(err)

    if (wantsHtml(c)) {
      return c.html(
        renderStatusPage({
          title: 'Internal server error',
          heading: 'Something went wrong',
          message: 'The server failed to process the request. Please try again.',
          actionHref: '/',
          actionLabel: 'Open home',
        }),
        500,
      )
    }

    return c.json({ error: 'Internal server error' }, 500)
  })

  return app
}
