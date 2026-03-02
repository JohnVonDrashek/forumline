import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const isConfigured = Boolean(supabaseUrl && supabaseAnonKey)

// Debug: log config status at startup
console.log('[supabase] url:', supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'MISSING')
console.log('[supabase] key:', supabaseAnonKey ? supabaseAnonKey.substring(0, 20) + '...' : 'MISSING')
console.log('[supabase] isConfigured:', isConfigured)

let supabase: SupabaseClient<Database>

if (isConfigured) {
  supabase = createClient<Database>(supabaseUrl!, supabaseAnonKey!)
  console.log('[supabase] Client created successfully')
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
