# Markdown Share Server

A small Hono app for storing and displaying Markdown over HTTP and MCP.

## Start

```bash
npm install
npm run dev
```

The server runs at `http://localhost:3000` by default.

## Authentication

There is no registration flow.

On first start, the server creates a single admin account and stores it in `data/user.json`:

```txt
username: admin
password: password
```

After signing in, the admin should immediately change the password on `/account`.

### Browser login

Open:

```txt
http://localhost:3000/login
```

After login, the browser receives a session cookie. The account page lets you:

- change the admin password
- generate a new API key
- see curl examples for HTTP and MCP access

### JSON login

```bash
curl -X POST http://localhost:3000/login \
  -H 'content-type: application/json' \
  -d '{"username":"admin","password":"password"}'
```

## API key

Generate an API key from the browser on `/account`, or by calling the account endpoint with a valid session cookie.

The API key is shown only once. Internally, only a hash is stored.

Use it like this:

```txt
Authorization: Bearer <api-key>
```

## Store Markdown

All Markdown routes require either:

- a browser session cookie, or
- an API key via `Authorization: Bearer <api-key>`

### As `text/markdown`

```bash
curl -X POST http://localhost:3000/markdown \
  -H 'authorization: Bearer <api-key>' \
  -H 'content-type: text/markdown' \
  --data-binary '# Hello World'
```

### As JSON

```bash
curl -X POST http://localhost:3000/markdown \
  -H 'authorization: Bearer <api-key>' \
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

Both routes require authentication.

- Raw Markdown: `GET /:id/raw`
- Rendered HTML page with Tailwind Typography: `GET /:id`

Example raw request:

```bash
curl http://localhost:3000/<uuid>/raw \
  -H 'authorization: Bearer <api-key>'
```

If you are logged in in the browser, you can open the HTML route directly.

Files are stored in the local `data/` directory.

## MCP Endpoint for Agents

The app also provides a Streamable HTTP MCP endpoint:

- MCP endpoint: `POST/GET/DELETE /mcp`
- Tool `create_markdown`: creates new Markdown
- Tool `read_markdown`: reads existing Markdown by UUID
- Resource template `markdown://{id}`: stored Markdown files as MCP resources

All MCP requests require:

```txt
Authorization: Bearer <api-key>
```

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

## Data files

The server stores local state in `data/`:

- `user.json` — single admin user
- `sessions.json` — active browser sessions
- `<uuid>.md` — markdown files
