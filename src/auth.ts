import { createHash, randomBytes, scrypt as nodeScrypt, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

const scrypt = promisify(nodeScrypt)
const passwordHashPrefix = 'scrypt'

export const sessionCookieName = 'markdown_share_session'
export const sessionMaxAgeSeconds = 60 * 60 * 24 * 30

export async function hashPassword(password: string) {
  const salt = randomBytes(16)
  const hash = (await scrypt(password, salt, 64)) as Buffer
  return `${passwordHashPrefix}$${salt.toString('hex')}$${hash.toString('hex')}`
}

export async function verifyPassword(password: string, storedHash: string) {
  const [prefix, saltHex, hashHex] = storedHash.split('$')
  if (prefix !== passwordHashPrefix || !saltHex || !hashHex) {
    return false
  }

  try {
    const salt = Buffer.from(saltHex, 'hex')
    const expectedHash = Buffer.from(hashHex, 'hex')
    const actualHash = (await scrypt(password, salt, expectedHash.length)) as Buffer

    return timingSafeEqual(actualHash, expectedHash)
  } catch {
    return false
  }
}

export function generateApiKey() {
  return `msk_${randomBytes(24).toString('hex')}`
}

export function hashApiKey(apiKey: string) {
  return createHash('sha256').update(apiKey).digest('hex')
}

export function hashesMatch(leftHex: string, rightHex: string) {
  try {
    const left = Buffer.from(leftHex, 'hex')
    const right = Buffer.from(rightHex, 'hex')

    return left.length === right.length && timingSafeEqual(left, right)
  } catch {
    return false
  }
}

export function generateSessionId() {
  return randomBytes(32).toString('hex')
}
