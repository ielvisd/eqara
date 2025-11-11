// Complete quiz and update mastery levels
// Reference: PRD section 3.2 - Retrieval Practice, target 80-85% accuracy

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
      quizId,
      answers,
      userId,
      sessionId
    } = body

    if (!userId && !sessionId) {
      return {
        success: false,
        error: 'User ID or session ID required'
      }
    }

    // Get quiz session and verify ownership
    let query = supabase
      .from('quiz_sessions')
      .select('*')
      .eq('id', quizId)
    
    // Verify ownership
    if (userId) {
      query = query.eq('user_id', userId)
    } else if (sessionId) {
      query = query.eq('session_id', sessionId)
    }
    
    const { data: quizData, error: quizError } = await query.single()

    if (quizError || !quizData) {
      console.error('Error fetching quiz session:', quizError)
      return {
        success: false,
        error: quizError?.message || 'Quiz session not found'
      }
    }

    // Validate answers
    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return {
        success: false,
        error: 'No answers provided. Please complete the quiz before submitting.'
      }
    }

    // Calculate results
    const totalQuestions = answers.length
    const correctAnswers = answers.filter((a: any) => a.isCorrect).length
    const accuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0

    // Calculate time spent
    const startTime = new Date(quizData.created_at)
    const endTime = new Date()
    const timeSpent = Math.floor((endTime.getTime() - startTime.getTime()) / 1000) // seconds

    // Update quiz session
    const { error: updateError } = await supabase
      .from('quiz_sessions')
      .update({
        results: JSON.stringify(answers),
        accuracy: accuracy.toFixed(2),
        time_taken_seconds: timeSpent,
        completed_at: endTime.toISOString()
      })
      .eq('id', quizId)

    if (updateError) {
      console.error('Error updating quiz session:', updateError)
    }

    // Update mastery levels based on performance
    const masteryUpdates: any[] = []
    const topicPerformance = new Map<string, { correct: number, total: number }>()

    // Aggregate performance by topic
    for (const answer of answers) {
      const current = topicPerformance.get(answer.topicId) || { correct: 0, total: 0 }
      current.total++
      if (answer.isCorrect) current.correct++
      topicPerformance.set(answer.topicId, current)
    }

    // Update mastery for each topic
    for (const [topicId, performance] of topicPerformance.entries()) {
      const topicAccuracy = (performance.correct / performance.total) * 100

      // Get current mastery
      const { data: currentMastery, error: masteryFetchError } = await supabase
        .from('student_mastery')
        .select('*, topics(*)')
        .eq(userId ? 'user_id' : 'session_id', userId || sessionId)
        .eq('topic_id', topicId)
        .maybeSingle()

      if (masteryFetchError && masteryFetchError.code !== 'PGRST116') {
        // PGRST116 is "not found" which is fine for new topics
        console.error(`Error fetching mastery for topic ${topicId}:`, masteryFetchError)
      }

      const oldMastery = currentMastery?.mastery_level || 0

      // Calculate new mastery
      let newMastery: number
      
      // If quiz accuracy is very high (≥95%), set mastery to 100%
      // This allows students to achieve mastery through excellent quiz performance
      if (topicAccuracy >= 95) {
        newMastery = 100
      } else {
        // Otherwise, use weighted average with recent performance
        // Give more weight to recent quiz (60% quiz, 40% previous)
        newMastery = Math.round(topicAccuracy * 0.6 + oldMastery * 0.4)
      }
      
      // Cap at 100, ensure non-negative
      newMastery = Math.min(100, Math.max(0, newMastery))

      // Update or insert mastery record
      const masteryRecord = {
        user_id: userId || null,
        session_id: sessionId || null,
        topic_id: topicId,
        mastery_level: newMastery,
        last_practiced: new Date().toISOString(),
        next_review: calculateNextReview(newMastery, oldMastery),
        updated_at: new Date().toISOString()
      }

      // Use proper conflict resolution based on unique constraint
      const conflictColumns = userId 
        ? 'user_id,topic_id' 
        : 'session_id,topic_id'
      
      const { error: masteryError } = await supabase
        .from('student_mastery')
        .upsert([masteryRecord], {
          onConflict: conflictColumns
        })

      if (masteryError) {
        console.error('Error updating mastery:', masteryError)
        // Continue processing other topics even if one fails
      } else {
        // Get topic name for display
        let topicName = 'Unknown Topic'
        if (currentMastery?.topics?.name) {
          topicName = currentMastery.topics.name
        } else {
          // Try to fetch topic name if not in mastery record
          const { data: topicData } = await supabase
            .from('topics')
            .select('name')
            .eq('id', topicId)
            .single()
          if (topicData?.name) {
            topicName = topicData.name
          }
        }
        
        masteryUpdates.push({
          topicId,
          topicName,
          oldMastery,
          newMastery
        })
      }
    }

    // Get unique topics reviewed
    const topicsReviewed = Array.from(topicPerformance.keys())

    return {
      success: true,
      result: {
        accuracy,
        totalQuestions,
        correctAnswers,
        topicsReviewed,
        timeSpent,
        masteryUpdates
      }
    }
  } catch (error: any) {
    console.error('Error completing quiz:', error)
    return {
      success: false,
      error: error.message || 'Failed to complete quiz'
    }
  }
})

// Calculate next review time based on mastery level
function calculateNextReview(newMastery: number, oldMastery: number): string {
  const now = new Date()
  
  // Base interval in days based on mastery level
  let daysUntilReview = 1 // Default: 1 day
  
  if (newMastery >= 90) {
    daysUntilReview = 14 // 2 weeks for high mastery
  } else if (newMastery >= 75) {
    daysUntilReview = 7 // 1 week
  } else if (newMastery >= 50) {
    daysUntilReview = 3 // 3 days
  } else if (newMastery >= 25) {
    daysUntilReview = 2 // 2 days
  }
  
  // If mastery decreased, review sooner
  if (newMastery < oldMastery) {
    daysUntilReview = Math.max(1, Math.floor(daysUntilReview / 2))
  }
  
  now.setDate(now.getDate() + daysUntilReview)
  return now.toISOString()
}

