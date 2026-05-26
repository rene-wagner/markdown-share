import { McpServer, ResourceTemplate, WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/server'
import { z } from 'zod'
import { listMarkdownEntries, readMarkdown, saveMarkdown } from './storage.js'

export async function createMcpTransport() {
  const mcpServer = new McpServer({ name: 'markdown-share-server', version: '1.0.0' })

  mcpServer.registerTool(
    'create_markdown',
    {
      title: 'Create Markdown',
      description: 'Stores a new Markdown file and returns the UUID, title, and retrieval URLs.',
      inputSchema: z.object({
        markdown: z.string().describe('The Markdown content to store'),
        title: z.string().optional().describe('A short human-readable title for the Markdown document'),
      }),
      outputSchema: z.object({
        id: z.string(),
        title: z.string(),
        rawUrl: z.string(),
        htmlUrl: z.string(),
        resourceUri: z.string(),
      }),
    },
    async ({ markdown, title }) => {
      const result = await saveMarkdown({ markdown, title })
      const structuredContent = { ...result }

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        structuredContent,
      }
    },
  )

  mcpServer.registerTool(
    'read_markdown',
    {
      title: 'Read Markdown',
      description: 'Reads a stored Markdown file by its UUID.',
      inputSchema: z.object({
        id: z.string().uuid().describe('UUID of the Markdown file'),
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
        resources: (await listMarkdownEntries()).map((entry) => ({
          name: entry.title,
          uri: entry.resourceUri,
          title: entry.title,
          mimeType: 'text/markdown',
        })),
      }),
    }),
    {
      title: 'Stored Markdown files',
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
