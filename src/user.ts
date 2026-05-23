import { randomUUID } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { hashApiKey, hashPassword, hashesMatch, verifyPassword } from './auth.js'

const dataDir = join(process.cwd(), 'data')
const userFile = join(dataDir, 'user.json')

export interface User {
  id: string
  username: 'admin'
  passwordHash: string
  apiKeyHash: string | null
  createdAt: string
  passwordChangedAt: string | null
}

async function readStoredUser() {
  try {
    return JSON.parse(await readFile(userFile, 'utf8')) as User
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null
    }

    throw error
  }
}

async function writeStoredUser(user: User) {
  await mkdir(dataDir, { recursive: true })
  await writeFile(userFile, `${JSON.stringify(user, null, 2)}\n`, 'utf8')
}

export async function ensureDefaultUser() {
  const existingUser = await readStoredUser()
  if (existingUser) {
    return false
  }

  const user: User = {
    id: randomUUID(),
    username: 'admin',
    passwordHash: await hashPassword('password'),
    apiKeyHash: null,
    createdAt: new Date().toISOString(),
    passwordChangedAt: null,
  }

  await writeStoredUser(user)
  return true
}

export async function getUser() {
  const user = await readStoredUser()
  if (!user) {
    throw new Error('Default user is missing')
  }

  return user
}

export async function verifyLogin(username: string, password: string) {
  const user = await getUser()
  if (username !== user.username) {
    return null
  }

  return (await verifyPassword(password, user.passwordHash)) ? user : null
}

export async function verifyCurrentPassword(password: string) {
  const user = await getUser()
  return verifyPassword(password, user.passwordHash)
}

export async function updatePassword(newPassword: string) {
  const user = await getUser()
  const updatedUser: User = {
    ...user,
    passwordHash: await hashPassword(newPassword),
    passwordChangedAt: new Date().toISOString(),
  }

  await writeStoredUser(updatedUser)
  return updatedUser
}

export async function setApiKeyHash(apiKeyHash: string | null) {
  const user = await getUser()
  const updatedUser: User = { ...user, apiKeyHash }
  await writeStoredUser(updatedUser)
  return updatedUser
}

export async function verifyApiKey(apiKey: string) {
  const user = await getUser()
  if (!user.apiKeyHash) {
    return null
  }

  return hashesMatch(hashApiKey(apiKey), user.apiKeyHash) ? user : null
}

export function hasDefaultPassword(user: User) {
  return user.passwordChangedAt === null
}
