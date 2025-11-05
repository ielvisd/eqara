import type { H3Event } from 'h3'
import { createClient } from '@supabase/supabase-js'

/**
 * Get user identification from auth or session
 * Prefers authenticated user_id over anonymous session_id
 */
export async function getUserIdentifier(event: H3Event): Promise<{
  userId: string | null
  sessionId: string | null
  isAuthenticated: boolean
}> {
  const config = useRuntimeConfig()
  
  // Create Supabase client
  const supabase = createClient(
    config.public.supabaseUrl as string,
    config.supabaseServiceKey as string
  )

  // Try to get authenticated user from session
  const authHeader = getHeader(event, 'authorization')
  let userId: string | null = null
  
  if (authHeader) {
    try {
      const token = authHeader.replace('Bearer ', '')
      const { data: { user } } = await supabase.auth.getUser(token)
      userId = user?.id || null
    } catch (err) {
      // Failed to get user from token
      console.warn('Failed to get user from auth token:', err)
    }
  }

  // Get sessionId from body or query
  const body = await readBody(event).catch(() => ({}))
  const query = getQuery(event)
  const sessionId = body?.sessionId || query?.sessionId as string || null

  return {
    userId,
    sessionId,
    isAuthenticated: !!userId
  }
}

/**
 * Build Supabase query filter for user or session
 */
export function buildUserFilter(userId: string | null, sessionId: string | null) {
  if (userId) {
    return { user_id: userId }
  } else if (sessionId) {
    return { session_id: sessionId }
  }
  throw createError({
    statusCode: 400,
    statusMessage: 'Either userId or sessionId is required'
  })
}

