// Get optimal review topics using repetition compression
// Reference: PRD Section 3.2 - Repetition compression
// Select advanced topics that implicitly review multiple prerequisites

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

    // Get all topics due for review
    const { data: dueTopics } = await supabase
      .from('student_mastery')
      .select('topic_id, mastery_level, topics(*)')
      .eq(userId ? 'user_id' : 'session_id', userId || sessionId)
      .lte('next_review', now)
      .gt('mastery_level', 0)

    if (!dueTopics || dueTopics.length === 0) {
      return {
        success: true,
        topics: [],
        compressionRatio: 0,
        prerequisitesCovered: []
      }
    }

    const dueTopicIds = dueTopics.map((t: any) => t.topic_id)

    // For each due topic, find which other due topics it encompasses
    const compressionScores = await Promise.all(
      dueTopics.map(async (topic: any) => {
        const { data: encompassed } = await supabase
          .from('topic_encompassings')
          .select('encompassed_id')
          .eq('topic_id', topic.topic_id)
          .in('encompassed_id', dueTopicIds)

        const encompassedCount = encompassed?.length || 0
        
        return {
          topicId: topic.topic_id,
          topicName: topic.topics?.name,
          masteryLevel: topic.mastery_level,
          difficulty: topic.topics?.difficulty || 1,
          encompassedTopics: encompassed?.map((e: any) => e.encompassed_id) || [],
          compressionScore: encompassedCount
        }
      })
    )

    // Sort by compression score (topics that cover the most other topics)
    compressionScores.sort((a, b) => {
      // Prioritize topics with high compression score
      if (b.compressionScore !== a.compressionScore) {
        return b.compressionScore - a.compressionScore
      }
      // Then by difficulty (harder topics first)
      return b.difficulty - a.difficulty
    })

    // Select top topics that maximize coverage
    const selectedTopics: any[] = []
    const coveredTopics = new Set<string>()

    for (const topic of compressionScores) {
      // If this topic hasn't been covered yet, add it
      if (!coveredTopics.has(topic.topicId)) {
        selectedTopics.push(topic)
        coveredTopics.add(topic.topicId)
        
        // Mark all encompassed topics as covered
        topic.encompassedTopics.forEach((id: string) => coveredTopics.add(id))
      }
      
      // Stop when we've covered all due topics or have enough selected
      if (coveredTopics.size >= dueTopicIds.length || selectedTopics.length >= 10) {
        break
      }
    }

    // Calculate compression ratio
    const compressionRatio = dueTopicIds.length > 0 
      ? selectedTopics.length / dueTopicIds.length 
      : 0

    return {
      success: true,
      topics: selectedTopics,
      compressionRatio: Math.round(compressionRatio * 100) / 100,
      prerequisitesCovered: Array.from(coveredTopics)
    }
  } catch (error: any) {
    console.error('Error getting optimal reviews:', error)
    return {
      success: false,
      error: error.message || 'Failed to get optimal reviews'
    }
  }
})

