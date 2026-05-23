import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { generateSessionId, sessionMaxAgeSeconds } from './auth.js'

const dataDir = join(process.cwd(), 'data')
const sessionsFile = join(dataDir, 'sessions.json')

export interface Session {
  id: string
  userId: string
  createdAt: string
  expiresAt: string
}

async function readStoredSessions() {
  try {
    return JSON.parse(await readFile(sessionsFile, 'utf8')) as Session[]
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return []
    }

    throw error
  }
}

async function writeStoredSessions(sessions: Session[]) {
  await mkdir(dataDir, { recursive: true })
  await writeFile(sessionsFile, `${JSON.stringify(sessions, null, 2)}\n`, 'utf8')
}

function isExpired(session: Session) {
  return new Date(session.expiresAt).getTime() <= Date.now()
}

async function cleanupExpiredSessions(sessions?: Session[]) {
  const loadedSessions = sessions ?? (await readStoredSessions())
  const activeSessions = loadedSessions.filter((session) => !isExpired(session))

  if (activeSessions.length !== loadedSessions.length) {
    await writeStoredSessions(activeSessions)
  }

  return activeSessions
}

export async function createSession(userId: string) {
  const sessions = await cleanupExpiredSessions()
  const now = Date.now()
  const session: Session = {
    id: generateSessionId(),
    userId,
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + sessionMaxAgeSeconds * 1000).toISOString(),
  }

  sessions.push(session)
  await writeStoredSessions(sessions)

  return session
}

export async function getSession(sessionId: string) {
  const sessions = await cleanupExpiredSessions()
  return sessions.find((session) => session.id === sessionId) ?? null
}

export async function deleteSession(sessionId: string) {
  const sessions = await readStoredSessions()
  const nextSessions = sessions.filter((session) => session.id !== sessionId)

  if (nextSessions.length !== sessions.length) {
    await writeStoredSessions(nextSessions)
  }
}
