import { ref, computed } from 'vue'

export type StudentState = 'new' | 'learning' | 'review-due' | 'completed'

export interface StudentContext {
  state: StudentState
  currentTopic?: {
    id: string
    title: string
    mastery: number
    lessonsCompleted: number
    totalLessons: number
  }
  nextTopic?: {
    id: string
    title: string
  }
  dueReviews: number
  domainProgress: Record<string, {
    domain: string
    totalTopics: number
    totalMastered: number
    totalAvailable: number
    inProgress: number
    percentComplete: number
  }>
  hasCompletedDiagnostic: boolean
}

export const useStudentState = () => {
  const context = ref<StudentContext>({
    state: 'new',
    dueReviews: 0,
    domainProgress: {},
    hasCompletedDiagnostic: false
  })

  const loading = ref(false)
  const error = ref<string | null>(null)

  // Fetch student context
  const fetchStudentContext = async (userId?: string, sessionId?: string): Promise<void> => {
    loading.value = true
    error.value = null

    // Skip if no userId or sessionId provided
    if (!userId && !sessionId) {
      console.warn('No userId or sessionId provided to fetchStudentContext')
      context.value = {
        state: 'new',
        dueReviews: 0,
        domainProgress: {},
        hasCompletedDiagnostic: false
      }
      loading.value = false
      return
    }

    try {
      // Fetch mastery domain data (handle errors gracefully)
      // Note: This endpoint needs a specific domain, so we'll skip it for now
      // and rely on the frontier topics to determine progress
      let domainProgress = {}

      // Fetch due reviews (handle errors gracefully)
      let dueReviews = 0
      try {
        const reviewsResponse = await $fetch<any>('/api/quiz/due-reviews', {
          method: 'GET',
          query: { userId, sessionId }
        })
        dueReviews = reviewsResponse?.topics?.length || 0
      } catch (reviewErr) {
        console.warn('Failed to fetch due reviews:', reviewErr)
      }

      // Check if diagnostic is complete by checking for ANY mastery data
      // A new user will have zero mastery records until they complete the diagnostic
      let hasCompletedDiagnostic = false
      let allMasteryData: any[] = []
      try {
        const masteryResponse = await $fetch<any>('/api/mastery/get', {
          method: 'GET',
          query: { userId, sessionId }
        })
        allMasteryData = masteryResponse?.mastery || []
        hasCompletedDiagnostic = allMasteryData.length > 0
      } catch (masteryErr) {
        console.warn('Failed to fetch mastery data:', masteryErr)
      }

      // Fetch frontier topics to find current learning topic (only if diagnostic complete)
      let frontierTopics: any[] = []
      if (hasCompletedDiagnostic) {
        try {
          const frontierResponse = await $fetch<any>('/api/knowledge-graph/frontier', {
            method: 'GET',
            query: { userId, sessionId }
          })
          frontierTopics = frontierResponse?.frontierTopics || []
        } catch (frontierErr) {
          console.warn('Failed to fetch frontier topics:', frontierErr)
        }
      }

      // Determine student state
      let state: StudentState = 'new'
      let currentTopic
      let nextTopic

      if (!hasCompletedDiagnostic) {
        state = 'new'
      } else if (frontierTopics.length > 0) {
        // Find first in-progress topic
        const inProgressTopic = frontierTopics.find((t: any) => t.mastery_level > 0 && t.mastery_level < 100)
        
        if (inProgressTopic) {
          state = dueReviews > 0 ? 'review-due' : 'learning'
          currentTopic = {
            id: inProgressTopic.id,
            title: inProgressTopic.title,
            mastery: inProgressTopic.mastery_level,
            lessonsCompleted: Math.floor((inProgressTopic.mastery_level / 100) * 5), // Estimate
            totalLessons: 5 // Estimate
          }
          // Find next topic (first unstarted frontier topic)
          const nextFrontier = frontierTopics.find((t: any) => t.mastery_level === 0)
          if (nextFrontier) {
            nextTopic = {
              id: nextFrontier.id,
              title: nextFrontier.title
            }
          }
        } else {
          // All frontier topics are either not started or completed
          // Check if any topics have mastery > 0 (completed topics)
          const hasCompletedTopics = frontierTopics.every((t: any) => t.mastery_level === 100)
          
          if (hasCompletedTopics && frontierTopics.length > 0) {
            // All topics are completed
            state = 'completed'
          } else {
            // Topics exist but none started yet - stay in 'new' state with diagnostic completed
            // This allows the UI to show "Ready to Practice" instead of forcing "Continue Learning"
            state = 'new'
            const firstFrontier = frontierTopics[0]
            if (firstFrontier) {
              currentTopic = {
                id: firstFrontier.id,
                title: firstFrontier.title,
                mastery: firstFrontier.mastery_level,
                lessonsCompleted: 0,
                totalLessons: 5
              }
            }
          }
        }
      } else {
        // No frontier topics - needs diagnostic
        state = 'new'
      }

      context.value = {
        state,
        currentTopic,
        nextTopic,
        dueReviews,
        domainProgress,
        hasCompletedDiagnostic
      }
    } catch (err: any) {
      console.error('Failed to fetch student context:', err)
      // Don't show error to user, just default to new user state
      // error.value = err.message || 'Failed to load student data'
      context.value = {
        state: 'new',
        dueReviews: 0,
        domainProgress: {},
        hasCompletedDiagnostic: false
      }
    } finally {
      loading.value = false
    }
  }

  // Computed properties for easy access
  const isNew = computed(() => context.value.state === 'new')
  const isLearning = computed(() => context.value.state === 'learning')
  const hasReviewsDue = computed(() => context.value.state === 'review-due')
  const isCompleted = computed(() => context.value.state === 'completed')

  // Get primary action for current state
  const primaryAction = computed(() => {
    switch (context.value.state) {
      case 'new':
        return {
          label: 'Take Placement Test',
          icon: 'i-lucide-target',
          color: 'pink',
          route: '/diagnostic'
        }
      case 'learning':
        return {
          label: 'Continue Learning',
          icon: 'i-lucide-graduation-cap',
          color: 'pink',
          route: '/'
        }
      case 'review-due':
        return {
          label: 'Start Review Session',
          icon: 'i-lucide-refresh-cw',
          color: 'blue',
          action: 'review'
        }
      case 'completed':
        return {
          label: 'Explore Knowledge Graph',
          icon: 'i-lucide-brain',
          color: 'purple',
          action: 'kg'
        }
    }
  })

  return {
    context,
    loading,
    error,
    fetchStudentContext,
    isNew,
    isLearning,
    hasReviewsDue,
    isCompleted,
    primaryAction
  }
}

