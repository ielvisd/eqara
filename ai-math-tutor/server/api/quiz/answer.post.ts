// Submit quiz answer and get immediate feedback
// Reference: PRD section 3.2 - Retrieval Practice

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
      questionId,
      answer,
      timeSpent,
      userId,
      sessionId
    } = body

    if (!userId && !sessionId) {
      return {
        success: false,
        error: 'User ID or session ID required'
      }
    }

    // Get quiz session from database
    const { data: quizData, error: quizError } = await supabase
      .from('quiz_sessions')
      .select('*')
      .eq('id', quizId)
      .single()

    if (quizError || !quizData) {
      return {
        success: false,
        error: 'Quiz session not found'
      }
    }

    // Parse questions from stored JSON
    const questions = JSON.parse(quizData.questions as string)
    const question = questions.find((q: any) => q.id === questionId)

    if (!question) {
      return {
        success: false,
        error: 'Question not found'
      }
    }

    // Check if answer is correct
    const isCorrect = answer.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase()

    // Return immediate feedback
    return {
      success: true,
      isCorrect,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation
    }
  } catch (error: any) {
    console.error('Error submitting quiz answer:', error)
    return {
      success: false,
      error: error.message || 'Failed to submit answer'
    }
  }
})

