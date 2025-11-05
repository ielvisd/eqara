// Get topics due for review based on spaced repetition schedule
// Reference: PRD section 3.2 - Spaced Repetition

import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const supabase = createClient(
    config.public.supabaseUrl,
    config.supabaseServiceKey
  )

  try {
    const query = getQuery(event)
    const { userId, sessionId } = query

    if (!userId && !sessionId) {
      return {
        success: false,
        error: 'User ID or session ID required'
      }
    }

    const now = new Date().toISOString()

    // Get topics due for review (next_review <= now)
    const { data: dueTopics, error } = await supabase
      .from('student_mastery')
      .select('*, topics(*)')
      .eq(userId ? 'user_id' : 'session_id', userId || sessionId)
      .lte('next_review', now)
      .order('next_review', { ascending: true })

    if (error) {
      console.error('Error fetching due reviews:', error)
      return {
        success: false,
        error: 'Failed to fetch due reviews'
      }
    }

    return {
      success: true,
      topics: dueTopics || [],
      count: dueTopics?.length || 0
    }
  } catch (error: any) {
    console.error('Error getting due reviews:', error)
    return {
      success: false,
      error: error.message || 'Failed to get due reviews'
    }
  }
})

