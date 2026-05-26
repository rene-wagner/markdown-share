---
name: markdown-share
description: Use when the user wants to store, share, retrieve, or display Markdown through the Markdown Share Server. Provides authenticated HTTP curl workflows for creating Markdown files, reading raw Markdown by UUID, and opening rendered HTML pages. The server base URL is configurable.
---

# Markdown Share Skill

Use this skill when the user wants to store, share, retrieve, or display Markdown via the Markdown Share Server.

## Base URL

The Markdown Share Server base URL is configurable.

Default base URL:

```txt
http://localhost:3000
```

The user may define the base URL as an environment variable before running commands:

```bash
export MARKDOWN_SHARE_BASE_URL='http://localhost:3000'
```

Use the base URL in this order:

1. A base URL explicitly provided by the user in the current request.
2. The `MARKDOWN_SHARE_BASE_URL` environment variable, if it is set.
3. A base URL previously established by the user in the current conversation.
4. The default base URL: `http://localhost:3000`.

Refer to the selected base URL as:

```txt
$MARKDOWN_SHARE_BASE_URL
```

If the environment variable is not set, substitute the selected URL directly in commands.

Examples of valid base URLs:

```txt
http://localhost:3000
http://localhost:8080
https://example.com
https://markdown.example.org
```

If the user provides a base URL, use it for all Markdown Share operations in the current task.

Examples of user-provided base URL instructions:

- "Use https://example.com as the Markdown Share server."
- "My markdown server is at https://md.example.org."
- "Set the Markdown Share base URL to http://localhost:8080."
- "Use https://example.com for this upload."

Do not ask for a server URL unless the task cannot be completed with the default.

## Authentication

Markdown Share now requires authentication for all Markdown and MCP operations.

Supported auth methods:

1. Browser session cookie obtained from logging in on `$MARKDOWN_SHARE_BASE_URL/login`
2. API key sent as:

```txt
Authorization: Bearer $MARKDOWN_SHARE_API_KEY
```

The user may define the API key as an environment variable before running commands:

```bash
export MARKDOWN_SHARE_API_KEY='<api-key>'
```

For agent workflows, prefer the API key.

If the user asks you to store or read Markdown through HTTP or MCP and no API key or authenticated browser/session context is available, ask for an API key before proceeding.

Do not assume the default admin password is still valid. The admin is expected to change it.

## Server

The server default is:

```txt
http://localhost:3000
```

If the selected server is local and is not running, start it from the project directory with:

```bash
npm run dev
```

If the selected server is remote, do not suggest `npm run dev`. Instead, report that the remote request failed and include the URL that was attempted.

## Store Markdown

Only store Markdown when the user explicitly asks for it.

Route:

```txt
POST /markdown
```

Example with `text/markdown`:

```bash
curl -s -X POST "$MARKDOWN_SHARE_BASE_URL/markdown" \
  -H "authorization: Bearer $MARKDOWN_SHARE_API_KEY" \
  -H 'content-type: text/markdown' \
  --data-binary '# Title

Markdown content...'
```

Example with JSON:

```bash
curl -s -X POST "$MARKDOWN_SHARE_BASE_URL/markdown" \
  -H "authorization: Bearer $MARKDOWN_SHARE_API_KEY" \
  -H 'content-type: application/json' \
  -d '{"title":"Short descriptive title","markdown":"# Title\n\nMarkdown content..."}'
```

When storing Markdown as JSON, generate a concise human-readable title from the content unless the user explicitly provides one. Send it as the optional `title` field.

The response contains:

```json
{
  "id": "...uuid...",
  "title": "Short descriptive title",
  "rawUrl": "/...uuid.../raw",
  "htmlUrl": "/...uuid...",
  "resourceUri": "markdown://...uuid..."
}
```

After storing Markdown successfully, report at least these values to the user:

- `id`
- `title`
- Raw URL: `$MARKDOWN_SHARE_BASE_URL/<id>/raw`
- HTML URL: `$MARKDOWN_SHARE_BASE_URL/<id>`

When reporting the URLs, replace `$MARKDOWN_SHARE_BASE_URL` with the selected base URL.

## Read Raw Markdown

Use the raw route for machine processing or when the user wants the Markdown source.

Route:

```txt
GET /:id/raw
```

Example:

```bash
curl -s "$MARKDOWN_SHARE_BASE_URL/<UUID>/raw" \
  -H "authorization: Bearer $MARKDOWN_SHARE_API_KEY"
```

## Display Markdown as HTML

Use the HTML route when the user wants a formatted browser view.

Route:

```txt
GET /:id
```

Example URL:

```txt
$MARKDOWN_SHARE_BASE_URL/<UUID>
```

The browser must already be logged in for the HTML route, otherwise the user will be redirected to the login page.

## MCP Note

The server also exposes an MCP Streamable HTTP endpoint at:

```txt
$MARKDOWN_SHARE_BASE_URL/mcp
```

MCP requests require:

```txt
Authorization: Bearer $MARKDOWN_SHARE_API_KEY
```

Agents may either use the authenticated HTTP API described above or connect through the MCP endpoint if they support MCP Streamable HTTP.

## Rules

- Do not store Markdown unless the user explicitly requests it.
- If the Markdown content is empty, ask for clarification before storing it.
- When storing Markdown as JSON, generate a concise human-readable title from the content unless the user explicitly provides one.
- Determine the base URL in this order:
  1. A base URL explicitly provided by the user in the current request.
  2. The `MARKDOWN_SHARE_BASE_URL` environment variable, if it is set.
  3. A base URL previously established by the user in the current conversation.
  4. The default base URL: `http://localhost:3000`.
- Use `/:id/raw` for further processing.
- Use `/:id` for humans and browser views.
- If an authenticated request is required and no API key is available through `MARKDOWN_SHARE_API_KEY` or another authenticated context, ask the user for one.
- If a request fails, first check whether the selected server is local or remote.
- If the selected server is local and is not running, suggest starting it with `npm run dev` from the project directory.
- If the selected server is remote, do not suggest `npm run dev`; report that the remote request failed and include the URL that was attempted.
- Do not claim that a user-provided base URL is remembered beyond the current conversation unless a persistent configuration mechanism is available.
