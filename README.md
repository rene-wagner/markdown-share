# Markdown Share Server

A small Hono app for storing and displaying Markdown.

## Start

```bash
npm install
npm run dev
```

The server runs at `http://localhost:3000` by default.

## Store Markdown

As `text/markdown` or plain text:

```bash
curl -X POST http://localhost:3000/markdown \
  -H 'content-type: text/markdown' \
  --data-binary '# Hello World'
```

Or as JSON:

```bash
curl -X POST http://localhost:3000/markdown \
  -H 'content-type: application/json' \
  -d '{"markdown":"# Hello World"}'
```

Response:

```json
{
  "id": "...uuid...",
  "rawUrl": "/...uuid.../raw",
  "htmlUrl": "/...uuid...",
  "resourceUri": "markdown://...uuid..."
}
```

## Retrieve Markdown

- Raw Markdown: `GET /:id/raw`
- Rendered HTML page with Tailwind Typography: `GET /:id`

Files are stored in the local `data/` directory.

## MCP Endpoint for Agents

The app also provides a Streamable HTTP MCP endpoint:

- MCP endpoint: `POST/GET/DELETE /mcp`
- Tool `create_markdown`: creates new Markdown
- Tool `read_markdown`: reads existing Markdown by UUID
- Resource template `markdown://{id}`: stored Markdown files as MCP resources

Example tool call after MCP initialization:

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "create_markdown",
    "arguments": {
      "markdown": "# Hello Agent"
    }
  }
}
```
