// Schedule next review with FIRe algorithm (implicit repetition)
// Reference: PRD Section 3.2 - Spaced Repetition (FIRe Algorithm)

import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const supabase = createClient(
    config.public.supabaseUrl,
    config.supabaseServiceKey
  )

  try {
    const body = await readBody(event)
    const {
      topicId,
      masteryLevel,
      performanceAccuracy,
      userId,
      sessionId
    } = body

    if (!userId && !sessionId) {
      return {
        success: false,
        error: 'User ID or session ID required'
      }
    }

    // Calculate spacing interval using FIRe algorithm
    const intervalDays = calculateSpacingInterval(masteryLevel, performanceAccuracy)
    const nextReview = new Date()
    nextReview.setDate(nextReview.getDate() + intervalDays)

    // Update the topic's review schedule
    const { error: updateError } = await supabase
      .from('student_mastery')
      .update({
        next_review: nextReview.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq(userId ? 'user_id' : 'session_id', userId || sessionId)
      .eq('topic_id', topicId)

    if (updateError) {
      console.error('Error updating review schedule:', updateError)
      return {
        success: false,
        error: 'Failed to update review schedule'
      }
    }

    // Apply implicit repetition: update prerequisite topics
    const implicitUpdates = await applyImplicitRepetition(
      supabase,
      topicId,
      performanceAccuracy,
      userId,
      sessionId
    )

    return {
      success: true,
      nextReview: nextReview.toISOString(),
      implicitUpdates
    }
  } catch (error: any) {
    console.error('Error scheduling review:', error)
    return {
      success: false,
      error: error.message || 'Failed to schedule review'
    }
  }
})

// Calculate spacing interval based on mastery and performance
function calculateSpacingInterval(
  masteryLevel: number,
  performanceAccuracy: number
): number {
  let baseDays = 1

  // Base interval by mastery level
  if (masteryLevel >= 95) baseDays = 30
  else if (masteryLevel >= 90) baseDays = 21
  else if (masteryLevel >= 80) baseDays = 14
  else if (masteryLevel >= 70) baseDays = 10
  else if (masteryLevel >= 60) baseDays = 7
  else if (masteryLevel >= 50) baseDays = 5
  else if (masteryLevel >= 40) baseDays = 3
  else if (masteryLevel >= 25) baseDays = 2

  // Adjust by recent performance
  if (performanceAccuracy >= 90) {
    baseDays = Math.floor(baseDays * 1.5)
  } else if (performanceAccuracy >= 75) {
    // Keep as is
  } else if (performanceAccuracy >= 60) {
    baseDays = Math.floor(baseDays * 0.8)
  } else {
    baseDays = Math.floor(baseDays * 0.5)
  }

  return Math.max(1, Math.min(60, baseDays))
}

// Apply implicit repetition: update prerequisite review schedules
// When you review an advanced topic successfully, it implicitly reviews simpler topics
async function applyImplicitRepetition(
  supabase: any,
  topicId: string,
  performanceAccuracy: number,
  userId?: string,
  sessionId?: string
): Promise<any[]> {
  const implicitUpdates: any[] = []

  // Only apply if performance was good (75%+)
  if (performanceAccuracy < 75) {
    return implicitUpdates
  }

  // Get encompassed topics (simpler topics implicitly reviewed)
  const { data: encompassings } = await supabase
    .from('topic_encompassings')
    .select('encompassed_id, topics!topic_encompassings_encompassed_id_fkey(*)')
    .eq('topic_id', topicId)

  if (!encompassings || encompassings.length === 0) {
    return implicitUpdates
  }

  const encompassedIds = encompassings.map((e: any) => e.encompassed_id)

  // Get current mastery for encompassed topics
  const { data: masteryRecords } = await supabase
    .from('student_mastery')
    .select('*')
    .eq(userId ? 'user_id' : 'session_id', userId || sessionId)
    .in('topic_id', encompassedIds)

  if (!masteryRecords) return implicitUpdates

  // Update review schedules for encompassed topics
  for (const mastery of masteryRecords) {
    const oldNextReview = new Date(mastery.next_review)
    
    // Extend the review interval since it was implicitly practiced
    const currentInterval = Math.floor(
      (oldNextReview.getTime() - new Date(mastery.last_practiced).getTime()) / 
      (1000 * 60 * 60 * 24)
    )
    
    // Extend by 50% of current interval
    const extensionDays = Math.max(1, Math.floor(currentInterval * 0.5))
    const newNextReview = new Date(oldNextReview)
    newNextReview.setDate(newNextReview.getDate() + extensionDays)

    // Update the review schedule
    await supabase
      .from('student_mastery')
      .update({
        next_review: newNextReview.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', mastery.id)

    // Find topic name
    const encompassing = encompassings.find((e: any) => e.encompassed_id === mastery.topic_id)
    const topicName = encompassing?.topics?.name || 'Unknown'

    implicitUpdates.push({
      topicId: mastery.topic_id,
      topicName,
      oldNextReview: oldNextReview.toISOString(),
      newNextReview: newNextReview.toISOString(),
      reason: `Implicitly reviewed through advanced topic practice`
    })
  }

  return implicitUpdates
}

