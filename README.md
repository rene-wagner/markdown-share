# Markdown Share Server

Kleine Hono-App zum Speichern und Anzeigen von Markdown.

## Start

```bash
npm install
npm run dev
```

Der Server läuft standardmäßig auf `http://localhost:3000`.

## Markdown speichern

Als `text/markdown` oder Plain Text:

```bash
curl -X POST http://localhost:3000/markdown \
  -H 'content-type: text/markdown' \
  --data-binary '# Hallo Welt'
```

Oder als JSON:

```bash
curl -X POST http://localhost:3000/markdown \
  -H 'content-type: application/json' \
  -d '{"markdown":"# Hallo Welt"}'
```

Antwort:

```json
{
  "id": "...uuid...",
  "rawUrl": "/...uuid.../raw",
  "htmlUrl": "/...uuid...",
  "resourceUri": "markdown://...uuid..."
}
```

## Markdown abrufen

- Raw Markdown: `GET /:id/raw`
- Gerenderte HTML-Seite mit Tailwind Typography: `GET /:id`

Gespeichert wird im lokalen Verzeichnis `data/`.

## MCP Endpoint für Agents

Die App stellt zusätzlich einen Streamable-HTTP-MCP-Endpoint bereit:

- MCP Endpoint: `POST/GET/DELETE /mcp`
- Tool `create_markdown`: legt neues Markdown an
- Tool `read_markdown`: liest bestehendes Markdown anhand der UUID
- Resource Template `markdown://{id}`: gespeicherte Markdown-Dateien als MCP Resources

Beispiel Tool-Call nach MCP-Initialisierung:

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "create_markdown",
    "arguments": {
      "markdown": "# Hallo Agent"
    }
  }
}
```
