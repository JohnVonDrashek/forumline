import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getForumlineServer } from './_lib/forumline-server.js'

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    const server = getForumlineServer()
    return res.status(200).json({ ok: true, server: server.config.name })
  } catch (e: any) {
    return res.status(500).json({ error: e.message })
  }
}
