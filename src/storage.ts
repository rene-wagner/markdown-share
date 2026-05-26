import { randomUUID } from 'node:crypto'
import { mkdir, readFile, readdir, unlink, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { HTTPException } from 'hono/http-exception'

const storageDir = join(process.cwd(), 'data')
const maxTitleLength = 120

export interface MarkdownEntry {
  id: string
  title: string
  createdAt?: string
  rawUrl: string
  htmlUrl: string
  resourceUri: string
}

interface MarkdownMetadata {
  title?: string
  createdAt?: string
}

interface SaveMarkdownInput {
  markdown: string
  title?: string
}

function fileFor(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    throw new HTTPException(400, { message: 'Invalid UUID' })
  }

  return join(storageDir, `${id}.md`)
}

function metadataFileFor(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    throw new HTTPException(400, { message: 'Invalid UUID' })
  }

  return join(storageDir, `${id}.json`)
}

function normalizeTitle(title: string) {
  return title.replace(/\s+/g, ' ').trim().slice(0, maxTitleLength)
}

function deriveTitle(markdown: string, id: string) {
  const heading = markdown
    .split(/\r?\n/)
    .map((line) => line.match(/^#{1,6}\s+(.+)$/)?.[1])
    .find((line): line is string => Boolean(line?.trim()))

  if (heading) {
    return normalizeTitle(heading)
  }

  const firstTextLine = markdown
    .split(/\r?\n/)
    .map((line) => line.replace(/^[-*+>]\s*/, '').trim())
    .find(Boolean)

  if (firstTextLine) {
    return normalizeTitle(firstTextLine)
  }

  return `Markdown ${id}`
}

function markdownEntry(id: string, title: string, createdAt?: string): MarkdownEntry {
  return {
    id,
    title,
    createdAt,
    rawUrl: `/${id}/raw`,
    htmlUrl: `/${id}`,
    resourceUri: `markdown://${id}`,
  }
}

async function readMetadata(id: string): Promise<MarkdownMetadata | null> {
  try {
    return JSON.parse(await readFile(metadataFileFor(id), 'utf8')) as MarkdownMetadata
  } catch {
    return null
  }
}

export async function saveMarkdown({ markdown, title }: SaveMarkdownInput) {
  if (!markdown.trim()) {
    throw new HTTPException(400, { message: 'Markdown must not be empty' })
  }

  await mkdir(storageDir, { recursive: true })

  const id = randomUUID()
  const storedTitle = normalizeTitle(title ?? '') || deriveTitle(markdown, id)
  const createdAt = new Date().toISOString()

  await writeFile(fileFor(id), markdown, 'utf8')
  await writeFile(metadataFileFor(id), JSON.stringify({ title: storedTitle, createdAt }, null, 2), 'utf8')

  return markdownEntry(id, storedTitle, createdAt)
}

export async function readMarkdown(id: string) {
  try {
    return await readFile(fileFor(id), 'utf8')
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error
    }

    throw new HTTPException(404, { message: 'Markdown not found' })
  }
}

export async function deleteMarkdown(id: string) {
  try {
    await unlink(fileFor(id))
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error
    }

    throw new HTTPException(404, { message: 'Markdown not found' })
  }

  try {
    await unlink(metadataFileFor(id))
  } catch {
    // Metadata is optional for backward compatibility with existing Markdown files.
  }
}

export async function getMarkdownEntry(id: string) {
  const markdown = await readMarkdown(id)
  const metadata = await readMetadata(id)
  const title = normalizeTitle(metadata?.title ?? '') || deriveTitle(markdown, id)

  return markdownEntry(id, title, metadata?.createdAt)
}

export async function listMarkdownIds() {
  try {
    const files = await readdir(storageDir)
    return files
      .filter((file) => /^[0-9a-f-]{36}\.md$/i.test(file))
      .map((file) => file.slice(0, -3))
      .sort((a, b) => a.localeCompare(b))
  } catch {
    return []
  }
}

export async function listMarkdownEntries() {
  return Promise.all((await listMarkdownIds()).map((id) => getMarkdownEntry(id)))
}
