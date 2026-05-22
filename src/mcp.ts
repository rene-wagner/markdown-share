import { McpServer, ResourceTemplate, WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/server'
import { z } from 'zod'
import { listMarkdownIds, readMarkdown, saveMarkdown } from './storage.js'

export async function createMcpTransport() {
  const mcpServer = new McpServer({ name: 'markdown-share-server', version: '1.0.0' })

  mcpServer.registerTool(
    'create_markdown',
    {
      title: 'Markdown anlegen',
      description: 'Speichert eine neue Markdown-Datei und gibt UUID sowie Abruf-URLs zurück.',
      inputSchema: z.object({
        markdown: z.string().describe('Der zu speichernde Markdown-Inhalt'),
      }),
      outputSchema: z.object({
        id: z.string(),
        rawUrl: z.string(),
        htmlUrl: z.string(),
        resourceUri: z.string(),
      }),
    },
    async ({ markdown }) => {
      const result = await saveMarkdown(markdown)

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        structuredContent: result,
      }
    },
  )

  mcpServer.registerTool(
    'read_markdown',
    {
      title: 'Markdown lesen',
      description: 'Liest eine gespeicherte Markdown-Datei anhand ihrer UUID.',
      inputSchema: z.object({
        id: z.string().uuid().describe('UUID der Markdown-Datei'),
      }),
      outputSchema: z.object({
        id: z.string(),
        markdown: z.string(),
      }),
    },
    async ({ id }) => {
      const markdown = await readMarkdown(id)
      const result = { id, markdown }

      return {
        content: [{ type: 'text', text: markdown }],
        structuredContent: result,
      }
    },
  )

  mcpServer.registerResource(
    'markdown',
    new ResourceTemplate('markdown://{id}', {
      list: async () => ({
        resources: (await listMarkdownIds()).map((id) => ({
          name: id,
          uri: `markdown://${id}`,
          title: `Markdown ${id}`,
          mimeType: 'text/markdown',
        })),
      }),
    }),
    {
      title: 'Gespeicherte Markdown-Dateien',
      mimeType: 'text/markdown',
    },
    async (uri, { id }) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: 'text/markdown',
          text: await readMarkdown(String(id)),
        },
      ],
    }),
  )

  const mcpTransport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined })
  await mcpServer.connect(mcpTransport)

  return mcpTransport
}
