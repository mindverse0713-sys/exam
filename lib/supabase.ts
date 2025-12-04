import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Validate environment variables at initialization (client-side safe)
function validateEnv() {
  if (typeof window === 'undefined') {
    // Server-side validation
    if (!supabaseUrl) {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL environment variable is missing. Please configure it in Vercel Settings → Environment Variables.')
    }
    if (!supabaseAnonKey) {
      throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable is missing. Please configure it in Vercel Settings → Environment Variables.')
    }
    if (!serviceRoleKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is missing. Please configure it in Vercel Settings → Environment Variables.')
    }
  } else {
    // Client-side - check public env vars only
    if (!supabaseUrl) {
      console.error('NEXT_PUBLIC_SUPABASE_URL is missing')
    }
    if (!supabaseAnonKey) {
      console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY is missing')
    }
  }
}

// Don't throw errors on import - let it fail gracefully in actions
// Errors will be caught and handled in server actions

// Public client (for inserts only)
let supabaseClient: SupabaseClient | null = null

if (supabaseUrl && supabaseAnonKey) {
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  })
} else {
  console.warn('Supabase client not initialized: Missing environment variables')
}

export const supabase = supabaseClient || createClient(
  'https://placeholder.supabase.co',
  'placeholder-key',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  }
)

// Service role client (server-side only)
let adminClient: SupabaseClient | null = null

if (typeof window === 'undefined' && supabaseUrl && serviceRoleKey) {
  adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

export const supabaseAdmin = adminClient || (typeof window === 'undefined' 
  ? createClient(
      supabaseUrl || 'https://placeholder.supabase.co',
      serviceRoleKey || 'placeholder-key',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
  : null as any)

// Helper function to check if Supabase is configured
export function isSupabaseConfigured(): boolean {
  return !!(
    supabaseUrl &&
    supabaseAnonKey &&
    (typeof window !== 'undefined' || serviceRoleKey)
  )
}

