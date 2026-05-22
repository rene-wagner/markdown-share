# AGENTS.md

This file provides guidance to AI coding agents when working with code in this repository.

## Commands

- **Dev server:** `npm run dev` (uses tsx watch, auto-reloads on changes)
- **Build:** `npm run build` (runs tsc, outputs to `dist/`)
- **Production start:** `npm run start` (runs `node dist/index.js`)
- **Port:** configured via `PORT` env var, defaults to 3000

No test framework is configured.

## Architecture

A Hono-based TypeScript server that stores and serves Markdown files, with an MCP endpoint for AI agent integration.

**Source files (`src/`):**

- `index.ts` — Entry point. Creates MCP transport, builds the Hono app, starts the HTTP server via `@hono/node-server`.
- `app.ts` — Hono route definitions. Wires together HTTP routes and the MCP transport. Routes: `GET /` (home page), `POST /markdown` (create), `GET /:id` (rendered HTML), `GET /:id/raw` (raw markdown), `ALL /mcp` (MCP endpoint).
- `mcp.ts` — MCP server setup using `@modelcontextprotocol/server`. Registers two tools (`create_markdown`, `read_markdown`) and a resource template (`markdown://{id}`). Uses Zod for input/output schemas. Returns a `WebStandardStreamableHTTPServerTransport`.
- `storage.ts` — File-based storage in `data/` directory. Markdown files stored as `data/<uuid>.md`. UUID validated with regex. Functions: `saveMarkdown`, `readMarkdown`, `listMarkdownIds`.
- `request.ts` — Parses incoming POST bodies. Supports both `application/json` (expects `{markdown: string}`) and plain text / `text/markdown` content types.
- `pages.ts` — HTML page rendering using template strings. Uses markdown-it for Markdown→HTML conversion and Tailwind CSS (via CDN) with the typography plugin for styling.

**Key patterns:**

- ESM throughout (`"type": "module"` in package.json, `.js` extensions in imports)
- Errors thrown as `HTTPException` from Hono, caught by the global `onError` handler in `app.ts`
- No database — plain filesystem storage in `data/` (gitignored)

## Deployment

Docker multi-stage build (node:24-alpine). The `data/` directory is a Docker volume. Docker Compose configured for Traefik reverse proxy. GitHub Actions workflow builds multi-arch images (ARM + AMD) and publishes to GHCR.

## Skills

The `skills/markdown-share/SKILL.md` file defines an AI agent skill for interacting with the server via curl. Referenced in `package.json` under `pi.skills`.
