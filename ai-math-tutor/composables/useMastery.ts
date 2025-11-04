// Mastery Learning composable
// Reference: pedagogy.md - Mastery Learning: 100% mastery before advancement
// Reference: supabase.com/docs/guides/database - Postgres queries

import type { Topic } from './useKnowledgeGraph'

export interface StudentMastery {
  id: string
  user_id: string | null
  session_id: string | null
  topic_id: string
  mastery_level: number // 0-100
  last_practiced: string | null
  next_review: string | null
  created_at: string
  updated_at: string
  topic?: Topic
}

export interface MasteryUpdate {
  topicId: string
  masteryLevel: number // 0-100
  lastPracticed?: Date
  nextReview?: Date
}

export const useMastery = () => {
  const supabase = useSupabase()
  const { getSessionId } = useChatHistory()

  // Get mastery for a specific topic
  const getTopicMastery = async (
    topicId: string,
    userId?: string,
    sessionId?: string
  ): Promise<StudentMastery | null> => {
    try {
      if (!userId && !sessionId) {
        sessionId = process.client ? getSessionId() : undefined
        if (!sessionId) return null
      }

      let query = supabase
        .from('student_mastery')
        .select('*, topic:topics(*)')
        .eq('topic_id', topicId)

      if (userId) {
        query = query.eq('user_id', userId)
      } else if (sessionId) {
        query = query.eq('session_id', sessionId).is('user_id', null)
      } else {
        return null
      }

      const { data, error } = await query.maybeSingle()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching topic mastery:', error)
      return null
    }
  }

  // Get all mastery records for a student
  const getAllMastery = async (
    userId?: string,
    sessionId?: string
  ): Promise<StudentMastery[]> => {
    try {
      if (!userId && !sessionId) {
        sessionId = process.client ? getSessionId() : undefined
        if (!sessionId) return []
      }

      let query = supabase
        .from('student_mastery')
        .select('*, topic:topics(*)')
        .order('updated_at', { ascending: false })

      if (userId) {
        query = query.eq('user_id', userId)
      } else if (sessionId) {
        query = query.eq('session_id', sessionId).is('user_id', null)
      } else {
        return []
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching all mastery:', error)
      return []
    }
  }

  // Get mastered topics (100% mastery)
  const getMasteredTopics = async (
    userId?: string,
    sessionId?: string
  ): Promise<StudentMastery[]> => {
    try {
      const allMastery = await getAllMastery(userId, sessionId)
      return allMastery.filter((m) => m.mastery_level >= 100)
    } catch (error) {
      console.error('Error fetching mastered topics:', error)
      return []
    }
  }

  // Update or create mastery for a topic
  const updateMastery = async (
    topicId: string,
    masteryLevel: number,
    userId?: string,
    sessionId?: string
  ): Promise<StudentMastery | null> => {
    try {
      if (!userId && !sessionId) {
        sessionId = process.client ? getSessionId() : undefined
        if (!sessionId) return null
      }

      // Clamp mastery level to 0-100
      const clampedLevel = Math.max(0, Math.min(100, masteryLevel))

      // Check if mastery record exists
      const existing = await getTopicMastery(topicId, userId, sessionId)

      const masteryData: any = {
        topic_id: topicId,
        mastery_level: clampedLevel,
        last_practiced: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      if (userId) {
        masteryData.user_id = userId
      } else if (sessionId) {
        masteryData.session_id = sessionId
      }

      let result
      if (existing) {
        // Update existing
        let updateQuery = supabase
          .from('student_mastery')
          .update(masteryData)
          .eq('id', existing.id)
          .select('*, topic:topics(*)')
          .single()

        const { data, error } = await updateQuery
        if (error) throw error
        result = data
      } else {
        // Create new
        masteryData.created_at = new Date().toISOString()
        const { data, error } = await supabase
          .from('student_mastery')
          .insert(masteryData)
          .select('*, topic:topics(*)')
          .single()

        if (error) throw error
        result = data
      }

      return result
    } catch (error) {
      console.error('Error updating mastery:', error)
      return null
    }
  }

  // Increment mastery (add to current level)
  const incrementMastery = async (
    topicId: string,
    amount: number,
    userId?: string,
    sessionId?: string
  ): Promise<StudentMastery | null> => {
    try {
      const current = await getTopicMastery(topicId, userId, sessionId)
      const currentLevel = current?.mastery_level || 0
      const newLevel = Math.min(100, currentLevel + amount)
      return await updateMastery(topicId, newLevel, userId, sessionId)
    } catch (error) {
      console.error('Error incrementing mastery:', error)
      return null
    }
  }

  // Set mastery to 100% (mastered)
  const setMastered = async (
    topicId: string,
    userId?: string,
    sessionId?: string
  ): Promise<StudentMastery | null> => {
    return await updateMastery(topicId, 100, userId, sessionId)
  }

  // Check if a topic is mastered (100%)
  const isMastered = async (
    topicId: string,
    userId?: string,
    sessionId?: string
  ): Promise<boolean> => {
    const mastery = await getTopicMastery(topicId, userId, sessionId)
    return mastery?.mastery_level >= 100 || false
  }

  // Check if all prerequisites for a topic are mastered
  const arePrerequisitesMastered = async (
    topicId: string,
    userId?: string,
    sessionId?: string
  ): Promise<boolean> => {
    try {
      const { getPrerequisites } = useKnowledgeGraph()
      const prerequisites = await getPrerequisites(topicId)

      // If no prerequisites, they're all "mastered" (none exist)
      if (prerequisites.length === 0) return true

      // Check if all prerequisites are mastered
      for (const prereq of prerequisites) {
        const prereqMastered = await isMastered(prereq.id, userId, sessionId)
        if (!prereqMastered) return false
      }

      return true
    } catch (error) {
      console.error('Error checking prerequisites:', error)
      return false
    }
  }

  // Check if student can advance to a topic (prerequisites mastered)
  const canAdvanceToTopic = async (
    topicId: string,
    userId?: string,
    sessionId?: string
  ): Promise<boolean> => {
    // Check if already mastered
    const alreadyMastered = await isMastered(topicId, userId, sessionId)
    if (alreadyMastered) return false // Already mastered, no need to advance

    // Check if prerequisites are mastered
    return await arePrerequisitesMastered(topicId, userId, sessionId)
  }

  // Calculate mastery progress for a domain
  const getDomainMastery = async (
    domain: string,
    userId?: string,
    sessionId?: string
  ): Promise<{
    total: number
    mastered: number
    inProgress: number
    notStarted: number
    percentage: number
  }> => {
    try {
      const { getTopicsByDomain } = useKnowledgeGraph()
      const topics = await getTopicsByDomain(domain)
      const allMastery = await getAllMastery(userId, sessionId)

      const masteryMap = new Map(
        allMastery.map((m) => [m.topic_id, m.mastery_level])
      )

      let mastered = 0
      let inProgress = 0
      let notStarted = 0

      for (const topic of topics) {
        const level = masteryMap.get(topic.id) || 0
        if (level >= 100) {
          mastered++
        } else if (level > 0) {
          inProgress++
        } else {
          notStarted++
        }
      }

      const total = topics.length
      const percentage = total > 0 ? Math.round((mastered / total) * 100) : 0

      return {
        total,
        mastered,
        inProgress,
        notStarted,
        percentage
      }
    } catch (error) {
      console.error('Error calculating domain mastery:', error)
      return {
        total: 0,
        mastered: 0,
        inProgress: 0,
        notStarted: 0,
        percentage: 0
      }
    }
  }

  // Update next review date (for spaced repetition)
  const updateNextReview = async (
    topicId: string,
    nextReview: Date,
    userId?: string,
    sessionId?: string
  ): Promise<boolean> => {
    try {
      if (!userId && !sessionId) {
        sessionId = process.client ? getSessionId() : undefined
        if (!sessionId) return false
      }

      const existing = await getTopicMastery(topicId, userId, sessionId)
      if (!existing) return false

      const { error } = await supabase
        .from('student_mastery')
        .update({
          next_review: nextReview.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error updating next review:', error)
      return false
    }
  }

  return {
    getTopicMastery,
    getAllMastery,
    getMasteredTopics,
    updateMastery,
    incrementMastery,
    setMastered,
    isMastered,
    arePrerequisitesMastered,
    canAdvanceToTopic,
    getDomainMastery,
    updateNextReview
  }
}

