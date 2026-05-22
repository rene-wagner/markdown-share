---
name: markdown-share
description: Use when the user wants to store, share, retrieve, or display Markdown through the local Markdown Share Server. Provides HTTP curl workflows for creating Markdown files, reading raw Markdown by UUID, and opening rendered HTML pages.
---

# Markdown Share Skill

Use this skill when the user wants to store, share, retrieve, or display Markdown via the local Markdown Share Server.

## Server

The server runs by default at:

```txt
http://localhost:3000
```

If the server is not running, start it from the project directory with:

```bash
npm run dev
```

## Store Markdown

Only store Markdown when the user explicitly asks for it.

Route:

```txt
POST /markdown
```

Example with `text/markdown`:

```bash
curl -s -X POST http://localhost:3000/markdown \
  -H 'content-type: text/markdown' \
  --data-binary '# Title

Markdown content...'
```

Example with JSON:

```bash
curl -s -X POST http://localhost:3000/markdown \
  -H 'content-type: application/json' \
  -d '{"markdown":"# Title\n\nMarkdown content..."}'
```

The response contains:

```json
{
  "id": "...uuid...",
  "rawUrl": "/...uuid.../raw",
  "htmlUrl": "/...uuid...",
  "resourceUri": "markdown://...uuid..."
}
```

After storing Markdown successfully, report at least these values to the user:

- `id`
- Raw URL: `http://localhost:3000/<id>/raw`
- HTML URL: `http://localhost:3000/<id>`

## Read Raw Markdown

Use the raw route for machine processing or when the user wants the Markdown source.

Route:

```txt
GET /:id/raw
```

Example:

```bash
curl -s http://localhost:3000/<UUID>/raw
```

## Display Markdown as HTML

Use the HTML route when the user wants a formatted browser view or a shareable rendered page.

Route:

```txt
GET /:id
```

Example URL:

```txt
http://localhost:3000/<UUID>
```

## MCP Note

The server also exposes an MCP Streamable HTTP endpoint at:

```txt
http://localhost:3000/mcp
```

Agents may either use the HTTP API described above or connect through the MCP endpoint if they support MCP Streamable HTTP.

## Rules

- Do not store Markdown unless the user explicitly requests it.
- If the Markdown content is empty, ask for clarification before storing it.
- Use `/:id/raw` for further processing.
- Use `/:id` for humans and browser views.
- If a request fails, first check whether the server is running.
