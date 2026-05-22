import { randomUUID } from 'node:crypto'
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { HTTPException } from 'hono/http-exception'

const storageDir = join(process.cwd(), 'data')

function fileFor(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    throw new HTTPException(400, { message: 'Invalid UUID' })
  }

  return join(storageDir, `${id}.md`)
}

export async function saveMarkdown(markdown: string) {
  if (!markdown.trim()) {
    throw new HTTPException(400, { message: 'Markdown must not be empty' })
  }

  await mkdir(storageDir, { recursive: true })

  const id = randomUUID()
  await writeFile(fileFor(id), markdown, 'utf8')

  return {
    id,
    rawUrl: `/${id}/raw`,
    htmlUrl: `/${id}`,
    resourceUri: `markdown://${id}`,
  }
}

export async function readMarkdown(id: string) {
  try {
    return await readFile(fileFor(id), 'utf8')
  } catch {
    throw new HTTPException(404, { message: 'Markdown not found' })
  }
}

export async function listMarkdownIds() {
  try {
    const files = await readdir(storageDir)
    return files
      .filter((file) => /^[0-9a-f-]{36}\.md$/i.test(file))
      .map((file) => file.slice(0, -3))
  } catch {
    return []
  }
}
