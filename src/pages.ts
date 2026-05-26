import MarkdownIt from 'markdown-it'
import type { MarkdownEntry } from './storage.js'

const md = new MarkdownIt({ html: false, linkify: true, typographer: true })

function markdownHref(id: string) {
  return `/${encodeURIComponent(id)}`
}

function rawMarkdownHref(id: string) {
  return `/${encodeURIComponent(id)}/raw`
}

function deleteMarkdownHref(id: string) {
  return `/markdown/${encodeURIComponent(id)}/delete`
}

function escapeHtml(text: string) {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function formatDateTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return null
  }

  return new Intl.DateTimeFormat('de-DE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function renderLayout(title: string, content: string) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <script src="https://cdn.tailwindcss.com?plugins=typography"></script>
  </head>
  <body class="bg-slate-50 text-slate-950">
    <main class="mx-auto max-w-4xl px-6 py-10">
      ${content}
    </main>
  </body>
</html>`
}

function renderAlert(kind: 'error' | 'success' | 'warning' | 'info', message: string) {
  const styles = {
    error: 'border-red-200 bg-red-50 text-red-700',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    warning: 'border-amber-200 bg-amber-50 text-amber-800',
    info: 'border-sky-200 bg-sky-50 text-sky-800',
  }

  return `<p class="mt-4 rounded border px-3 py-2 text-sm ${styles[kind]}">${escapeHtml(message)}</p>`
}

export function renderHomePage(authenticated: boolean) {
  return renderLayout(
    'Markdown Share',
    `<div class="space-y-6">
      <section class="rounded-xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 class="text-3xl font-bold">Markdown Share Server</h1>
            <p class="mt-3 max-w-2xl text-slate-700">Store Markdown over HTTP or MCP, then read it back as raw Markdown or rendered HTML. All markdown and MCP access requires authentication.</p>
          </div>
          ${
            authenticated
              ? '<a class="rounded bg-slate-900 px-4 py-2 text-center text-white hover:bg-slate-700" href="/account">Open account</a>'
              : '<a class="rounded bg-slate-900 px-4 py-2 text-center text-white hover:bg-slate-700" href="/login">Login</a>'
          }
        </div>
      </section>
      <div class="grid gap-6 lg:grid-cols-2">
        <section class="rounded-xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <h2 class="text-lg font-semibold">Default admin account</h2>
          <p class="mt-3 text-sm text-slate-700">On first start the server creates a single admin account. Sign in and change the password immediately.</p>
          <pre class="mt-4 overflow-x-auto rounded bg-slate-900 p-4 text-sm text-slate-100">username: admin
password: password</pre>
        </section>
        <section class="rounded-xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <h2 class="text-lg font-semibold">Recommended workflow</h2>
          <ol class="mt-3 list-decimal space-y-2 pl-5 text-sm text-slate-700">
            <li>Login in the browser at <code>/login</code>.</li>
            <li>Open <code>/account</code> and change the default password.</li>
            <li>Generate an API key on the account page.</li>
            <li>Use that key for HTTP API and MCP requests.</li>
          </ol>
        </section>
      </div>
      <div class="grid gap-6 lg:grid-cols-2">
        <section class="rounded-xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <h2 class="text-lg font-semibold">Save Markdown with an API key</h2>
          <pre class="mt-4 overflow-x-auto rounded bg-slate-900 p-4 text-sm text-slate-100">curl -X POST http://localhost:3000/markdown \\
  -H 'authorization: Bearer &lt;api-key&gt;' \\
  -H 'content-type: text/markdown' \\
  --data-binary '# Hello World'</pre>
        </section>
        <section class="rounded-xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <h2 class="text-lg font-semibold">Read Markdown with an API key</h2>
          <pre class="mt-4 overflow-x-auto rounded bg-slate-900 p-4 text-sm text-slate-100">curl http://localhost:3000/&lt;id&gt;/raw \\
  -H 'authorization: Bearer &lt;api-key&gt;'</pre>
        </section>
      </div>
    </div>`,
  )
}

interface LoginPageOptions {
  error?: string
  notice?: string
}

export function renderLoginPage({ error, notice }: LoginPageOptions = {}) {
  return renderLayout(
    'Login',
    `<div class="mx-auto max-w-md rounded-xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
      <h1 class="text-2xl font-bold">Login</h1>
      <p class="mt-3 text-sm text-slate-700">Sign in with the admin account. If this is the first login, change the default password afterwards.</p>
      ${notice ? renderAlert('info', notice) : ''}
      ${error ? renderAlert('error', error) : ''}
      <form class="mt-6 space-y-4" method="post" action="/login">
        <label class="block text-sm font-medium text-slate-800">
          Username
          <input class="mt-1 w-full rounded border border-slate-300 px-3 py-2" name="username" value="admin" autocomplete="username" required />
        </label>
        <label class="block text-sm font-medium text-slate-800">
          Password
          <input class="mt-1 w-full rounded border border-slate-300 px-3 py-2" type="password" name="password" autocomplete="current-password" required />
        </label>
        <button class="w-full rounded bg-slate-900 px-4 py-2 text-white hover:bg-slate-700" type="submit">Login</button>
      </form>
      <div class="mt-6 rounded border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
        <p class="font-medium text-slate-900">First start</p>
        <p class="mt-2">The server initially creates:</p>
        <pre class="mt-3 overflow-x-auto rounded bg-slate-900 p-4 text-slate-100">username: admin
password: password</pre>
      </div>
      <p class="mt-4 text-sm text-slate-600"><a class="font-medium hover:text-slate-950" href="/">Back to home</a></p>
    </div>`,
  )
}

interface AccountPageOptions {
  username: string
  passwordWarning: boolean
  hasApiKey: boolean
  apiKey?: string
  error?: string
  success?: string
}

interface MarkdownListPageOptions {
  entries: MarkdownEntry[]
  notice?: string
}

export function renderAccountPage({ username, passwordWarning, hasApiKey, apiKey, error, success }: AccountPageOptions) {
  return renderLayout(
    'Account',
    `<div class="space-y-6">
      <nav class="flex items-center justify-between text-sm text-slate-600">
        <a class="font-medium hover:text-slate-950" href="/">Markdown Share</a>
        <form method="post" action="/logout">
          <button class="rounded bg-slate-900 px-3 py-1.5 text-white hover:bg-slate-700" type="submit">Logout</button>
        </form>
      </nav>
      <section class="rounded-xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <h1 class="text-2xl font-bold">Account</h1>
        <p class="mt-3 text-slate-700">Logged in as <strong>${escapeHtml(username)}</strong>.</p>
        <p class="mt-2 text-sm text-slate-700">Use this page to secure the admin account and manage the API key for HTTP and MCP access.</p>
        ${passwordWarning ? renderAlert('warning', 'The default password is still active. Please change it now.') : ''}
        ${error ? renderAlert('error', error) : ''}
        ${success ? renderAlert('success', success) : ''}
      </section>
      <div class="grid gap-6 lg:grid-cols-2">
        <section class="rounded-xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <h2 class="text-xl font-semibold">Change password</h2>
          <p class="mt-2 text-sm text-slate-700">Choose a strong password with at least 10 characters.</p>
          <form class="mt-6 grid gap-4" method="post" action="/account/password">
            <label class="block text-sm font-medium text-slate-800">
              Current password
              <input class="mt-1 w-full rounded border border-slate-300 px-3 py-2" type="password" name="currentPassword" autocomplete="current-password" required />
            </label>
            <label class="block text-sm font-medium text-slate-800">
              New password
              <input class="mt-1 w-full rounded border border-slate-300 px-3 py-2" type="password" name="newPassword" minlength="10" autocomplete="new-password" required />
            </label>
            <button class="w-fit rounded bg-slate-900 px-4 py-2 text-white hover:bg-slate-700" type="submit">Update password</button>
          </form>
        </section>
        <section class="rounded-xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <div class="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 class="text-xl font-semibold">API key</h2>
              <p class="mt-2 text-sm text-slate-700">Generate a new API key for HTTP and MCP access. Generating a new key invalidates the old one.</p>
            </div>
            <form method="post" action="/account/api-key">
              <button class="rounded bg-slate-900 px-4 py-2 text-white hover:bg-slate-700" type="submit">Generate API key</button>
            </form>
          </div>
          ${renderAlert('info', hasApiKey ? 'An API key is currently active.' : 'No API key has been generated yet.')}
          ${
            apiKey
              ? `<div class="mt-6 rounded border border-sky-200 bg-sky-50 p-4 text-sm text-sky-950">
                  <p class="font-medium">New API key</p>
                  <pre class="mt-3 overflow-x-auto rounded bg-slate-900 p-4 text-slate-100">${escapeHtml(apiKey)}</pre>
                  <p class="mt-3">Copy it now. This is the only time it will be shown.</p>
                </div>`
              : ''
          }
        </section>
      </div>
      <section class="rounded-xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 class="text-xl font-semibold">Stored markdown</h2>
            <p class="mt-2 text-sm text-slate-700">Open an overview of all stored markdown documents, then view or delete them.</p>
          </div>
          <a class="rounded bg-slate-900 px-4 py-2 text-white hover:bg-slate-700" href="/markdown">Open overview</a>
        </div>
      </section>
      <section class="rounded-xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <h2 class="text-xl font-semibold">Examples</h2>
        <div class="mt-6 grid gap-6 lg:grid-cols-2">
          <div>
            <h3 class="text-sm font-semibold uppercase tracking-wide text-slate-500">HTTP API</h3>
            <pre class="mt-3 overflow-x-auto rounded bg-slate-900 p-4 text-sm text-slate-100">curl -X POST http://localhost:3000/markdown \\
  -H 'authorization: Bearer &lt;api-key&gt;' \\
  -H 'content-type: text/markdown' \\
  --data-binary '# Hello World'</pre>
          </div>
          <div>
            <h3 class="text-sm font-semibold uppercase tracking-wide text-slate-500">MCP</h3>
            <pre class="mt-3 overflow-x-auto rounded bg-slate-900 p-4 text-sm text-slate-100">curl http://localhost:3000/mcp \\
  -H 'authorization: Bearer &lt;api-key&gt;'</pre>
          </div>
        </div>
      </section>
    </div>`,
  )
}

export function renderMarkdownListPage({ entries, notice }: MarkdownListPageOptions) {
  const items =
    entries.length === 0
      ? `<p class="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600">No markdown files have been stored yet.</p>`
      : `<div class="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
          <ul class="divide-y divide-slate-200">
            ${entries
              .map((entry) => {
                const escapedId = escapeHtml(entry.id)
                const createdAt = entry.createdAt ? formatDateTime(entry.createdAt) : null
                return `<li class="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p class="text-base font-semibold text-slate-900">${escapeHtml(entry.title)}</p>
                    ${createdAt ? `<p class="mt-1 text-sm text-slate-500">Created: ${escapeHtml(createdAt)}</p>` : ''}
                    <code class="mt-2 block break-all rounded bg-slate-100 px-3 py-2 text-sm text-slate-800">${escapedId}</code>
                  </div>
                  <div class="flex flex-wrap gap-3">
                    <a class="rounded border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100" href="${escapeHtml(markdownHref(entry.id))}">View</a>
                    <a class="rounded border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100" href="${escapeHtml(rawMarkdownHref(entry.id))}">Raw</a>
                    <form method="post" action="${escapeHtml(deleteMarkdownHref(entry.id))}" onsubmit="return confirm('Delete this markdown file?')">
                      <button class="rounded bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-500" type="submit">Delete</button>
                    </form>
                  </div>
                </li>`
              })
              .join('')}
          </ul>
        </div>`

  return renderLayout(
    'Markdown overview',
    `<div class="space-y-6">
      <nav class="flex items-center justify-between text-sm text-slate-600">
        <div class="flex items-center gap-4">
          <a class="font-medium hover:text-slate-950" href="/">Markdown Share</a>
          <a class="hover:text-slate-950" href="/account">Account</a>
        </div>
        <span>${entries.length} file${entries.length === 1 ? '' : 's'}</span>
      </nav>
      <section class="rounded-xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <h1 class="text-2xl font-bold">Markdown overview</h1>
        <p class="mt-3 text-slate-700">Here you can open stored markdown files as rendered HTML or raw Markdown, and delete files you no longer need.</p>
        ${notice ? renderAlert('success', notice) : ''}
      </section>
      ${items}
    </div>`,
  )
}

interface StatusPageOptions {
  title: string
  heading: string
  message: string
  actionHref?: string
  actionLabel?: string
}

export function renderStatusPage({ title, heading, message, actionHref, actionLabel }: StatusPageOptions) {
  return renderLayout(
    title,
    `<div class="mx-auto max-w-2xl rounded-xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
      <p class="text-sm font-semibold uppercase tracking-wide text-slate-500">Markdown Share</p>
      <h1 class="mt-3 text-3xl font-bold">${escapeHtml(heading)}</h1>
      <p class="mt-4 text-slate-700">${escapeHtml(message)}</p>
      <div class="mt-6 flex flex-wrap gap-3">
        ${
          actionHref && actionLabel
            ? `<a class="rounded bg-slate-900 px-4 py-2 text-white hover:bg-slate-700" href="${escapeHtml(actionHref)}">${escapeHtml(actionLabel)}</a>`
            : ''
        }
        <a class="rounded border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-100" href="/">Back to home</a>
      </div>
    </div>`,
  )
}

export function renderMarkdownPage(id: string, markdown: string) {
  const html = md.render(markdown)

  return renderLayout(
    `Markdown ${id}`,
    `<nav class="mb-8 flex items-center justify-between gap-4 text-sm text-slate-600">
      <div class="flex items-center gap-4">
        <a class="font-medium hover:text-slate-950" href="/">Markdown Share</a>
        <a class="hover:text-slate-950" href="/account">Account</a>
        <a class="hover:text-slate-950" href="/markdown">Overview</a>
      </div>
      <div class="flex flex-wrap gap-3">
        <a class="rounded border border-slate-300 px-3 py-1.5 text-slate-700 hover:bg-slate-100" href="${escapeHtml(rawMarkdownHref(id))}">Raw</a>
        <form method="post" action="${escapeHtml(deleteMarkdownHref(id))}" onsubmit="return confirm('Delete this markdown file?')">
          <button class="rounded bg-red-600 px-3 py-1.5 text-white hover:bg-red-500" type="submit">Delete</button>
        </form>
      </div>
    </nav>
    <article class="prose prose-slate max-w-none rounded-xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
      ${html}
    </article>`,
  )
}
