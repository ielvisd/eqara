// Diagnostic composable
// Reference: tasks.md - PR #10: Diagnostic & Placement Quest
// Reference: pedagogy.md - Diagnostic integrity and knowledge frontier

export interface DiagnosticQuestion {
  type: 'multiple_choice'
  question: string
  options: string[]
  correctAnswer: string
  explanation?: string
}

export interface DiagnosticAnswer {
  topicId: string
  answerType: 'correct' | 'incorrect' | 'idontknow'
  masteryLevel: number
  accuracy: number
}

export interface DiagnosticSession {
  sessionId: string
  currentTopic: any
  question: DiagnosticQuestion
  topicsTested: string[]
  answers: DiagnosticAnswer[]
  rootTopicsToTest?: string[]
  testedRootTopics?: string[]
  minQuestionsRequired?: number
  maxQuestions?: number
}

export interface PlacementSummary {
  totalTopicsTested: number
  topicsWithStrongUnderstanding?: number // New field for 80% mastery topics
  topicsMastered: number // Legacy field (deprecated - use topicsWithStrongUnderstanding)
  topicsUnknown: number
  topicsInProgress: number
  frontierTopics: number
  recommendedStartingPoint: any | null
  strongUnderstandingTopics?: any[] // New field for 80% mastery topic objects
  masteredTopics?: any[] // Legacy field (deprecated - use strongUnderstandingTopics)
  note?: string // Explanation about mastery levels
}

export const useDiagnostic = () => {
  // Only use useChatHistory in client context
  let getSessionId: (() => string) | undefined
  if (process.client) {
    // @ts-ignore - useChatHistory is auto-imported in client context
    const chatHistory = useChatHistory()
    getSessionId = chatHistory.getSessionId
  }

  // Start a new diagnostic session
  const startDiagnostic = async (
    userId?: string,
    sessionId?: string
  ): Promise<DiagnosticSession> => {
    try {
      if (!userId && !sessionId) {
        sessionId = process.client && getSessionId ? getSessionId() : undefined
        if (!sessionId) throw new Error('Session ID required')
      }

      const response = await $fetch<{
        success: boolean
        diagnosticSession: DiagnosticSession
      }>('/api/diagnostic/start', {
        method: 'POST',
        body: {
          userId,
          sessionId
        }
      })

      if (!response.success || !response.diagnosticSession) {
        throw new Error('Failed to start diagnostic')
      }

      return response.diagnosticSession
    } catch (error) {
      console.error('Error starting diagnostic:', error)
      throw error
    }
  }

  // Submit an answer and get next question
  const submitAnswer = async (
    diagnosticSessionId: string,
    topicId: string,
    questionId: string,
    answer: string,
    answerType: 'correct' | 'incorrect' | 'idontknow',
    topicsTested?: string[],
    rootTopicsToTest?: string[],
    testedRootTopics?: string[],
    userId?: string,
    sessionId?: string
  ): Promise<{
    nextTopic: any | null
    nextQuestion: DiagnosticQuestion | null
    isComplete: boolean
    masteryLevel: number
    accuracy: number
    topicsTested: string[]
    testedRootTopics: string[]
    questionsAsked: number
    message: string
  }> => {
    try {
      if (!userId && !sessionId) {
        sessionId = process.client && getSessionId ? getSessionId() : undefined
        if (!sessionId) throw new Error('Session ID required')
      }

      const response = await $fetch<{
        success: boolean
        answerRecorded: boolean
        nextTopic: any | null
        nextQuestion: DiagnosticQuestion | null
        isComplete: boolean
        masteryLevel: number
        accuracy: number
        topicsTested: string[]
        testedRootTopics: string[]
        questionsAsked: number
        message: string
      }>('/api/diagnostic/answer', {
        method: 'POST',
        body: {
          diagnosticSessionId,
          topicId,
          questionId,
          answer,
          answerType,
          topicsTested,
          rootTopicsToTest,
          testedRootTopics,
          userId,
          sessionId
        }
      })

      if (!response.success) {
        throw new Error('Failed to submit answer')
      }

      return {
        nextTopic: response.nextTopic,
        nextQuestion: response.nextQuestion,
        isComplete: response.isComplete,
        masteryLevel: response.masteryLevel,
        accuracy: response.accuracy,
        topicsTested: response.topicsTested,
        testedRootTopics: response.testedRootTopics,
        questionsAsked: response.questionsAsked,
        message: response.message
      }
    } catch (error) {
      console.error('Error submitting diagnostic answer:', error)
      throw error
    }
  }

  // Complete diagnostic and get placement
  const completeDiagnostic = async (
    diagnosticSessionId: string,
    results: DiagnosticAnswer[],
    userId?: string,
    sessionId?: string
  ): Promise<{
    placement: PlacementSummary
    frontier: any[]
    diagnosticResults: any[]
    message: string
  }> => {
    try {
      if (!userId && !sessionId) {
        sessionId = process.client && getSessionId ? getSessionId() : undefined
        if (!sessionId) throw new Error('Session ID required')
      }

      const response = await $fetch<{
        success: boolean
        diagnosticComplete: boolean
        placement: PlacementSummary
        frontier: any[]
        diagnosticResults: any[]
        message: string
      }>('/api/diagnostic/complete', {
        method: 'POST',
        body: {
          diagnosticSessionId,
          results,
          userId,
          sessionId
        }
      })

      if (!response.success || !response.diagnosticComplete) {
        throw new Error('Failed to complete diagnostic')
      }

      return {
        placement: response.placement,
        frontier: response.frontier,
        diagnosticResults: response.diagnosticResults,
        message: response.message
      }
    } catch (error) {
      console.error('Error completing diagnostic:', error)
      throw error
    }
  }

  return {
    startDiagnostic,
    submitAnswer,
    completeDiagnostic
  }
}

