// Get topics due for review
// Reference: PRD Section 3.2 - Spaced Repetition

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
      .gt('mastery_level', 0) // Only topics that have been practiced
      .order('next_review', { ascending: true })

    if (error) {
      console.error('Error fetching due reviews:', error)
      return {
        success: false,
        error: 'Failed to fetch due reviews'
      }
    }

    // Format reviews with calculated fields
    const reviews = (dueTopics || []).map((mastery: any) => {
      const nextReview = new Date(mastery.next_review)
      const now = new Date()
      const daysOverdue = Math.floor((now.getTime() - nextReview.getTime()) / (1000 * 60 * 60 * 24))

      return {
        topicId: mastery.topic_id,
        topicName: mastery.topics?.name || 'Unknown',
        masteryLevel: mastery.mastery_level,
        lastPracticed: mastery.last_practiced,
        nextReview: mastery.next_review,
        isDue: true, // All returned topics are due
        daysUntilDue: -daysOverdue, // Negative means overdue
        reviewCount: mastery.review_count || 0
      }
    })

    return {
      success: true,
      reviews
    }
  } catch (error: any) {
    console.error('Error getting due reviews:', error)
    return {
      success: false,
      error: error.message || 'Failed to get due reviews'
    }
  }
})

