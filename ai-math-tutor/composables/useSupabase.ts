// Supabase client composable - Direct integration
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Singleton instance - shared across all calls
let supabaseInstance: SupabaseClient | null = null

export const useSupabase = () => {
  // Return existing instance if available
  if (supabaseInstance) {
    return supabaseInstance
  }

  // Create new instance only if it doesn't exist
  const config = useRuntimeConfig()

  supabaseInstance = createClient(
    config.public.supabaseUrl as string,
    config.public.supabaseAnonKey as string,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      }
    }
  )

  return supabaseInstance
}
