// Knowledge Graph composable
// Reference: pedagogy.md - Knowledge Graph structure for mastery learning
// Reference: supabase.com/docs/guides/database - Postgres queries

import type { Topic, StudentMastery, TopicPrerequisite, TopicEncompassing } from './types'
import { useSupabase } from './useSupabase'

export const useKnowledgeGraph = () => {
  const supabase = useSupabase()

  // Get all topics
  const getAllTopics = async (): Promise<Topic[]> => {
    try {
      const { data, error } = await supabase
        .from('topics')
        .select('*')
        .order('difficulty', { ascending: true })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching topics:', error)
      return []
    }
  }

  // Get topic by ID
  const getTopic = async (topicId: string): Promise<Topic | null> => {
    try {
      const { data, error } = await supabase
        .from('topics')
        .select('*')
        .eq('id', topicId)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching topic:', error)
      return null
    }
  }

  // Get prerequisites for a topic
  const getPrerequisites = async (topicId: string): Promise<Topic[]> => {
    try {
      const { data, error } = await supabase
        .from('topic_prerequisites')
        .select(`
          prerequisite_id,
          prerequisite:topics!topic_prerequisites_prerequisite_id_fkey(*)
        `)
        .eq('topic_id', topicId)

      if (error) throw error
      return (data || []).map((item: any) => item.prerequisite).filter(Boolean)
    } catch (error) {
      console.error('Error fetching prerequisites:', error)
      return []
    }
  }

  // Get topics that require this topic as a prerequisite
  const getDependentTopics = async (topicId: string): Promise<Topic[]> => {
    try {
      const { data, error } = await supabase
        .from('topic_prerequisites')
        .select(`
          topic_id,
          topic:topics!topic_prerequisites_topic_id_fkey(*)
        `)
        .eq('prerequisite_id', topicId)

      if (error) throw error
      return (data || []).map((item: any) => item.topic).filter(Boolean)
    } catch (error) {
      console.error('Error fetching dependent topics:', error)
      return []
    }
  }

  // Get encompassed topics (simpler topics that this advanced topic includes)
  const getEncompassedTopics = async (topicId: string): Promise<Topic[]> => {
    try {
      const { data, error } = await supabase
        .from('topic_encompassings')
        .select(`
          encompassed_id,
          encompassed:topics!topic_encompassings_encompassed_id_fkey(*)
        `)
        .eq('topic_id', topicId)

      if (error) throw error
      return (data || []).map((item: any) => item.encompassed).filter(Boolean)
    } catch (error) {
      console.error('Error fetching encompassed topics:', error)
      return []
    }
  }

  // Get encompassing topics (advanced topics that include this simpler topic)
  const getEncompassingTopics = async (topicId: string): Promise<Topic[]> => {
    try {
      const { data, error } = await supabase
        .from('topic_encompassings')
        .select(`
          topic_id,
          topic:topics!topic_encompassings_topic_id_fkey(*)
        `)
        .eq('encompassed_id', topicId)

      if (error) throw error
      return (data || []).map((item: any) => item.topic).filter(Boolean)
    } catch (error) {
      console.error('Error fetching encompassing topics:', error)
      return []
    }
  }

  // Get student mastery for a topic
  const getStudentMastery = async (
    topicId: string,
    userId?: string,
    sessionId?: string
  ): Promise<StudentMastery | null> => {
    try {
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
      console.error('Error fetching student mastery:', error)
      return null
    }
  }

  // Get all mastered topics for a student
  const getMasteredTopics = async (
    userId?: string,
    sessionId?: string
  ): Promise<StudentMastery[]> => {
    try {
      let query = supabase
        .from('student_mastery')
        .select('*, topic:topics(*)')
        .eq('mastery_level', 100) // 100% mastery

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
      console.error('Error fetching mastered topics:', error)
      return []
    }
  }

  // Calculate knowledge frontier: topics where all prerequisites are mastered
  // but the topic itself is not yet mastered
  const getKnowledgeFrontier = async (
    userId?: string,
    sessionId?: string
  ): Promise<Topic[]> => {
    try {
      // Get all mastered topic IDs
      // For diagnostic purposes, consider topics with 80%+ mastery as "mastered" for prerequisite checking
      // This allows diagnostic results (80%) to properly feed into the frontier calculation
      const { useMastery } = await import('./useMastery')
      const mastery = useMastery()
      const masteredTopics = await getMasteredTopics(userId, sessionId)
      const allMastery = await mastery.getAllMastery(userId, sessionId)
      const masteredTopicIds = [
        ...masteredTopics.map((m) => m.topic_id),
        ...allMastery.filter((m) => (m.mastery_level ?? 0) >= 80).map((m) => m.topic_id)
      ]
      // Remove duplicates
      const uniqueMasteredIds = [...new Set(masteredTopicIds)]

      // Get all topics
      const allTopics = await getAllTopics()

      // For each topic, check if all prerequisites are mastered
      const frontierTopics: Topic[] = []

      for (const topic of allTopics) {
        // Get prerequisites for this topic
        const prerequisites = await getPrerequisites(topic.id)

        // If no prerequisites, it's a root topic (can be learned)
        if (prerequisites.length === 0) {
          // Check if topic is not already mastered
          const mastery = await getStudentMastery(topic.id, userId, sessionId)
          if (!mastery || mastery.mastery_level < 100) {
            frontierTopics.push(topic)
          }
        } else {
          // Check if all prerequisites are mastered
          const allPrerequisitesMastered = prerequisites.every((prereq) =>
            uniqueMasteredIds.includes(prereq.id)
          )

          if (allPrerequisitesMastered) {
            // Check if topic is not already mastered
            const mastery = await getStudentMastery(topic.id, userId, sessionId)
            if (!mastery || mastery.mastery_level < 100) {
              frontierTopics.push(topic)
            }
          }
        }
      }

      return frontierTopics
    } catch (error) {
      console.error('Error calculating knowledge frontier:', error)
      return []
    }
  }

  // Get topics by domain
  const getTopicsByDomain = async (domain: string): Promise<Topic[]> => {
    try {
      const { data, error } = await supabase
        .from('topics')
        .select('*')
        .eq('domain', domain)
        .order('difficulty', { ascending: true })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching topics by domain:', error)
      return []
    }
  }

  // Get topic hierarchy (tree structure)
  const getTopicHierarchy = async (): Promise<Map<string, Topic[]>> => {
    try {
      const allTopics = await getAllTopics()
      const hierarchy = new Map<string, Topic[]>()

      // Group by domain
      for (const topic of allTopics) {
        if (!hierarchy.has(topic.domain)) {
          hierarchy.set(topic.domain, [])
        }
        hierarchy.get(topic.domain)!.push(topic)
      }

      return hierarchy
    } catch (error) {
      console.error('Error building topic hierarchy:', error)
      return new Map()
    }
  }

  return {
    getAllTopics,
    getTopic,
    getPrerequisites,
    getDependentTopics,
    getEncompassedTopics,
    getEncompassingTopics,
    getStudentMastery,
    getMasteredTopics,
    getKnowledgeFrontier,
    getTopicsByDomain,
    getTopicHierarchy
  }
}

