import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const isConfigured = Boolean(supabaseUrl && supabaseAnonKey)

// Simple in-memory mutex to replace navigator.locks (which deadlocks in
// production bundles) while still serializing token refresh operations.
const locks = new Map<string, Promise<unknown>>()
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function inMemoryLock(_name: string, _acquireTimeout: number, fn: () => Promise<any>) {
  const name = _name
  while (locks.has(name)) {
    await locks.get(name)
  }
  const promise = fn()
  locks.set(name, promise)
  try {
    return await promise
  } finally {
    locks.delete(name)
  }
}

let supabase: SupabaseClient<Database>

if (isConfigured) {
  supabase = createClient<Database>(supabaseUrl!, supabaseAnonKey!, {
    auth: {
      lock: inMemoryLock as any,
    },
  } as any)
} else {
  console.warn(
    'Supabase credentials not found. Running in demo mode.\n' +
    'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local'
  )
  supabase = new Proxy({} as SupabaseClient<Database>, {
    get: () => () => Promise.resolve({ data: null, error: null })
  })
}

export { supabase }
