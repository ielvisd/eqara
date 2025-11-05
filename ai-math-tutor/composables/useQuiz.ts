// Quiz composable for retrieval practice
// Reference: tasks.md - PR #13: Retrieval Practice System Quest
// Reference: prd.md - Section 3.2: Retrieval Practice (Testing Effect)

export interface QuizQuestion {
  id: string
  type: 'multiple_choice' | 'short_answer'
  question: string
  options?: string[]
  correctAnswer: string
  explanation?: string
  topicId: string
  topicName: string
  difficulty: number
}

export interface QuizAnswer {
  questionId: string
  topicId: string
  answer: string
  isCorrect: boolean
  timeSpent?: number
}

export interface QuizSession {
  id: string
  userId?: string
  sessionId?: string
  topics: string[]
  questions: QuizQuestion[]
  answers: QuizAnswer[]
  isComplete: boolean
  isTimed: boolean
  timeLimit?: number
  startTime: Date
  endTime?: Date
}

export interface QuizResult {
  accuracy: number
  totalQuestions: number
  correctAnswers: number
  topicsReviewed: string[]
  timeSpent?: number
  masteryUpdates: Array<{
    topicId: string
    topicName: string
    oldMastery: number
    newMastery: number
  }>
}

export const useQuiz = () => {
  // Get session ID from chat history
  let getSessionId: (() => string) | undefined
  if (process.client) {
    // @ts-ignore - useChatHistory is auto-imported in client context
    const chatHistory = useChatHistory()
    getSessionId = chatHistory.getSessionId
  }

  // Generate a quiz session with interleaved topics
  const generateQuiz = async (options: {
    topicIds?: string[]
    numQuestions?: number
    isTimed?: boolean
    timeLimit?: number
    difficulty?: number
    userId?: string
    sessionId?: string
  }): Promise<QuizSession> => {
    try {
      const sessionId = options.sessionId || (process.client && getSessionId ? getSessionId() : undefined)
      if (!options.userId && !sessionId) {
        throw new Error('Session ID required')
      }

      const response = await $fetch<{
        success: boolean
        quiz: QuizSession
      }>('/api/quiz/generate', {
        method: 'POST',
        body: {
          ...options,
          sessionId
        }
      })

      if (!response.success || !response.quiz) {
        throw new Error('Failed to generate quiz')
      }

      return response.quiz
    } catch (error) {
      console.error('Error generating quiz:', error)
      throw error
    }
  }

  // Submit a single quiz answer
  const submitAnswer = async (
    quizId: string,
    questionId: string,
    answer: string,
    timeSpent?: number,
    userId?: string,
    sessionId?: string
  ): Promise<{
    isCorrect: boolean
    correctAnswer: string
    explanation?: string
  }> => {
    try {
      const sid = sessionId || (process.client && getSessionId ? getSessionId() : undefined)
      if (!userId && !sid) {
        throw new Error('Session ID required')
      }

      const response = await $fetch<{
        success: boolean
        isCorrect: boolean
        correctAnswer: string
        explanation?: string
      }>('/api/quiz/answer', {
        method: 'POST',
        body: {
          quizId,
          questionId,
          answer,
          timeSpent,
          userId,
          sessionId: sid
        }
      })

      if (!response.success) {
        throw new Error('Failed to submit answer')
      }

      return {
        isCorrect: response.isCorrect,
        correctAnswer: response.correctAnswer,
        explanation: response.explanation
      }
    } catch (error) {
      console.error('Error submitting quiz answer:', error)
      throw error
    }
  }

  // Complete quiz and get results
  const completeQuiz = async (
    quizId: string,
    answers: QuizAnswer[],
    userId?: string,
    sessionId?: string
  ): Promise<QuizResult> => {
    try {
      const sid = sessionId || (process.client && getSessionId ? getSessionId() : undefined)
      if (!userId && !sid) {
        throw new Error('Session ID required')
      }

      const response = await $fetch<{
        success: boolean
        result: QuizResult
      }>('/api/quiz/complete', {
        method: 'POST',
        body: {
          quizId,
          answers,
          userId,
          sessionId: sid
        }
      })

      if (!response.success || !response.result) {
        throw new Error('Failed to complete quiz')
      }

      return response.result
    } catch (error) {
      console.error('Error completing quiz:', error)
      throw error
    }
  }

  // Get due reviews based on spaced repetition schedule
  const getDueReviews = async (
    userId?: string,
    sessionId?: string
  ): Promise<{
    topics: any[]
    count: number
  }> => {
    try {
      const sid = sessionId || (process.client && getSessionId ? getSessionId() : undefined)
      if (!userId && !sid) {
        throw new Error('Session ID required')
      }

      const response = await $fetch<{
        success: boolean
        topics: any[]
        count: number
      }>('/api/quiz/due-reviews', {
        method: 'GET',
        query: {
          userId,
          sessionId: sid
        }
      })

      if (!response.success) {
        throw new Error('Failed to get due reviews')
      }

      return {
        topics: response.topics,
        count: response.count
      }
    } catch (error) {
      console.error('Error getting due reviews:', error)
      throw error
    }
  }

  return {
    generateQuiz,
    submitAnswer,
    completeQuiz,
    getDueReviews
  }
}

