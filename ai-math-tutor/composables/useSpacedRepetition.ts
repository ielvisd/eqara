// Spaced Repetition (FIRe Algorithm) Composable
// Reference: PRD Section 3.2 - Spaced Repetition (FIRe Algorithm)
// Reference: tasks.md - PR #11: Spaced Repetition (FIRe) Quest
// 
// FIRe = Fractional Implicit Repetition
// Key concepts:
// 1. Implicit Repetition: Reviews on advanced topics update prerequisite review schedules
// 2. Repetition Compression: Select advanced reviews that "knock out" multiple prerequisites
// 3. Calibration: Spacing calibrated per student-topic (learning speed ratio)
// 4. Fuzzy Memory: Reviews scheduled when memory is slightly "fuzzy" for optimal consolidation

export interface ReviewSchedule {
  topicId: string
  topicName: string
  masteryLevel: number
  lastPracticed: Date
  nextReview: Date
  isDue: boolean
  daysUntilDue: number
  reviewCount: number
}

export interface ImplicitUpdate {
  topicId: string
  topicName: string
  oldNextReview: Date
  newNextReview: Date
  reason: string
}

export const useSpacedRepetition = () => {
  // Get session ID from chat history
  let getSessionId: (() => string) | undefined
  if (process.client) {
    // @ts-ignore - useChatHistory is auto-imported in client context
    const chatHistory = useChatHistory()
    getSessionId = chatHistory.getSessionId
  }

  // Get all topics due for review
  const getDueReviews = async (
    userId?: string,
    sessionId?: string
  ): Promise<ReviewSchedule[]> => {
    try {
      const sid = sessionId || (process.client && getSessionId ? getSessionId() : undefined)
      if (!userId && !sid) {
        throw new Error('Session ID required')
      }

      const response = await $fetch<{
        success: boolean
        reviews: ReviewSchedule[]
      }>('/api/spaced-repetition/reviews', {
        method: 'GET',
        query: {
          userId,
          sessionId: sid
        }
      })

      if (!response.success) {
        throw new Error('Failed to fetch due reviews')
      }

      return response.reviews
    } catch (error) {
      console.error('Error fetching due reviews:', error)
      throw error
    }
  }

  // Schedule next review for a topic (with FIRe algorithm)
  const scheduleReview = async (
    topicId: string,
    masteryLevel: number,
    performanceAccuracy: number,
    userId?: string,
    sessionId?: string
  ): Promise<{
    nextReview: Date
    implicitUpdates: ImplicitUpdate[]
  }> => {
    try {
      const sid = sessionId || (process.client && getSessionId ? getSessionId() : undefined)
      if (!userId && !sid) {
        throw new Error('Session ID required')
      }

      const response = await $fetch<{
        success: boolean
        nextReview: string
        implicitUpdates: ImplicitUpdate[]
      }>('/api/spaced-repetition/schedule', {
        method: 'POST',
        body: {
          topicId,
          masteryLevel,
          performanceAccuracy,
          userId,
          sessionId: sid
        }
      })

      if (!response.success) {
        throw new Error('Failed to schedule review')
      }

      return {
        nextReview: new Date(response.nextReview),
        implicitUpdates: response.implicitUpdates.map(u => ({
          ...u,
          oldNextReview: new Date(u.oldNextReview),
          newNextReview: new Date(u.newNextReview)
        }))
      }
    } catch (error) {
      console.error('Error scheduling review:', error)
      throw error
    }
  }

  // Get optimal review topics (repetition compression)
  // Selects advanced topics that implicitly review multiple prerequisites
  const getOptimalReviewTopics = async (
    userId?: string,
    sessionId?: string
  ): Promise<{
    topics: any[]
    compressionRatio: number
    prerequisitesCovered: string[]
  }> => {
    try {
      const sid = sessionId || (process.client && getSessionId ? getSessionId() : undefined)
      if (!userId && !sid) {
        throw new Error('Session ID required')
      }

      const response = await $fetch<{
        success: boolean
        topics: any[]
        compressionRatio: number
        prerequisitesCovered: string[]
      }>('/api/spaced-repetition/optimal-reviews', {
        method: 'GET',
        query: {
          userId,
          sessionId: sid
        }
      })

      if (!response.success) {
        throw new Error('Failed to get optimal review topics')
      }

      return {
        topics: response.topics,
        compressionRatio: response.compressionRatio,
        prerequisitesCovered: response.prerequisitesCovered
      }
    } catch (error) {
      console.error('Error getting optimal review topics:', error)
      throw error
    }
  }

  // Calculate optimal spacing interval based on mastery and performance
  const calculateSpacingInterval = (
    masteryLevel: number,
    performanceAccuracy: number,
    previousInterval?: number
  ): number => {
    // Base intervals in days based on mastery level
    let baseDays = 1

    if (masteryLevel >= 95) {
      baseDays = 30 // Monthly for near-perfect mastery
    } else if (masteryLevel >= 90) {
      baseDays = 21 // 3 weeks
    } else if (masteryLevel >= 80) {
      baseDays = 14 // 2 weeks
    } else if (masteryLevel >= 70) {
      baseDays = 10 // 10 days
    } else if (masteryLevel >= 60) {
      baseDays = 7 // 1 week
    } else if (masteryLevel >= 50) {
      baseDays = 5 // 5 days
    } else if (masteryLevel >= 40) {
      baseDays = 3 // 3 days
    } else if (masteryLevel >= 25) {
      baseDays = 2 // 2 days
    }

    // Adjust based on recent performance accuracy
    if (performanceAccuracy >= 90) {
      // Excellent performance - extend interval
      baseDays = Math.floor(baseDays * 1.5)
    } else if (performanceAccuracy >= 75) {
      // Good performance - keep interval
      baseDays = baseDays
    } else if (performanceAccuracy >= 60) {
      // Moderate performance - slightly reduce interval
      baseDays = Math.floor(baseDays * 0.8)
    } else {
      // Poor performance - significantly reduce interval
      baseDays = Math.floor(baseDays * 0.5)
    }

    // If we have a previous interval, apply spacing effect
    // (Each successful review extends the interval)
    if (previousInterval && performanceAccuracy >= 75) {
      baseDays = Math.floor(previousInterval * 2) // Double the interval
    }

    // Minimum 1 day, maximum 60 days
    return Math.max(1, Math.min(60, baseDays))
  }

  // Check if a topic is due for review
  const isTopicDueForReview = (nextReview: Date): boolean => {
    const now = new Date()
    return nextReview <= now
  }

  // Get days until review is due
  const getDaysUntilReview = (nextReview: Date): number => {
    const now = new Date()
    const diffMs = nextReview.getTime() - now.getTime()
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
    return Math.max(0, diffDays)
  }

  return {
    getDueReviews,
    scheduleReview,
    getOptimalReviewTopics,
    calculateSpacingInterval,
    isTopicDueForReview,
    getDaysUntilReview
  }
}

