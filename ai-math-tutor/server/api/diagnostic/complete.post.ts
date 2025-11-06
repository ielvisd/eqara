// Diagnostic API: Complete diagnostic and calculate placement
// Reference: tasks.md - PR #10: Diagnostic & Placement Quest
// Implements placement algorithm that identifies knowledge frontier

import { useKnowledgeGraph } from '~/composables/useKnowledgeGraph'
import { useMastery } from '~/composables/useMastery'
import { useSupabase } from '~/composables/useSupabase'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const {
    diagnosticSessionId,
    results, // Array of { topicId, answerType, masteryLevel }
    userId,
    sessionId
  } = body

  if (!results || !Array.isArray(results)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Results array is required'
    })
  }

  if (!userId && !sessionId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Either userId or sessionId is required'
    })
  }

  try {
    const supabase = useSupabase()
    const mastery = useMastery()
    const kg = useKnowledgeGraph()

    // Store diagnostic results
    const diagnosticResults: any[] = []
    for (const diagnosticResult of results) {
      const { topicId, answerType, masteryLevel, accuracy } = diagnosticResult

      // Store in diagnostic_results table
      const diagnosticData: any = {
        topic_id: topicId,
        performance_data: {
          answerType,
          masteryLevel,
          accuracy
        },
        accuracy: accuracy || (answerType === 'correct' ? 100 : answerType === 'idontknow' ? 0 : 50)
      }

      if (userId) {
        diagnosticData.user_id = userId
      } else {
        diagnosticData.session_id = sessionId
      }

      // Check if result already exists
      let query: any = supabase
        .from('diagnostic_results')
        .select('*')
        .eq('topic_id', topicId)

      if (userId) {
        query = query.eq('user_id', userId).is('session_id', null)
      } else {
        query = query.eq('session_id', sessionId).is('user_id', null)
      }

      const { data: existing } = await query.maybeSingle()

      let storedResult: any = null
      if (existing) {
        // Update existing
        const { data, error } = await supabase
          .from('diagnostic_results')
          .update(diagnosticData)
          .eq('id', existing.id)
          .select()
          .single()

        if (error && error.code !== '23505') {
          console.error('Error updating diagnostic result:', error)
        }
        storedResult = data
      } else {
        // Insert new
        const { data, error } = await supabase
          .from('diagnostic_results')
          .insert(diagnosticData)
          .select()
          .single()

        if (error && error.code !== '23505') {
          console.error('Error storing diagnostic result:', error)
        }
        storedResult = data
      }

      if (storedResult) {
        diagnosticResults.push(storedResult)
      }

      // Set initial mastery level based on diagnostic
      // Note: Diagnostic answers are tentative - one correct answer doesn't mean 100% mastery
      // We set mastery conservatively: correct = 55% (needs more practice), incorrect = 30% (partial knowledge), idontknow = 0%
      const diagnosticMasteryLevel = answerType === 'correct' 
        ? 55  // Moderate indication but not 100% - needs verification through practice
        : answerType === 'idontknow' 
          ? 0   // Unknown - no mastery
          : 30  // Partial knowledge - got it wrong but might have some understanding
      
      await mastery.updateMastery(topicId, diagnosticMasteryLevel, userId, sessionId)
    }

    // Calculate knowledge frontier based on results
    // The frontier is where student knows prerequisites but not the topic itself
    console.log('🔍 [DIAGNOSTIC COMPLETE] Starting frontier calculation:', {
      resultsCount: results.length,
      results: results.map(r => ({
        topicId: r.topicId,
        answerType: r.answerType,
        masteryLevel: r.masteryLevel
      }))
    })
    
    const frontier = await kg.getKnowledgeFrontier(userId, sessionId)
    
    console.log('📊 [DIAGNOSTIC COMPLETE] Frontier calculated:', {
      frontierCount: frontier.length,
      frontierTopics: frontier.map(t => ({
        id: t.id,
        name: t.name,
        difficulty: t.difficulty
      }))
    })

    // Get tested topic IDs and mastery levels
    const testedTopicIds = results.map(r => r.topicId)
    const allMastery = await mastery.getAllMastery(userId, sessionId)
    const masteryMap = new Map(allMastery.map(m => [m.topic_id, m.mastery_level || 0]))
    
    console.log('✅ [DIAGNOSTIC COMPLETE] Tested topic IDs:', testedTopicIds)
    
    // Sort frontier to prioritize:
    // 1. Topics with 50-60% mastery (need completion to 100%) - HIGHEST PRIORITY
    // 2. Untested root topics (no prerequisites) - foundational starting points
    // 3. Other untested frontier topics
    // 4. Topics with lower difficulty within same priority group
    const sortedFrontier = await Promise.all(
      frontier.map(async (topic) => {
        const wasTested = testedTopicIds.includes(topic.id)
        const masteryLevel = masteryMap.get(topic.id) || 0
        const isNearlyMastered = masteryLevel >= 50 && masteryLevel < 100
        const prerequisites = await kg.getPrerequisites(topic.id)
        const isRootTopic = prerequisites.length === 0
        return {
          topic,
          wasTested,
          isRootTopic,
          isNearlyMastered,
          masteryLevel,
          difficulty: topic.difficulty || 999
        }
      })
    )
    
    // Sort: Nearly mastered (50-60%) topics first, then untested root topics, then other untested, then by difficulty
    sortedFrontier.sort((a, b) => {
      // Priority 1: Nearly mastered topics (50% < 100%) come first
      if (a.isNearlyMastered && !b.isNearlyMastered) return -1
      if (!a.isNearlyMastered && b.isNearlyMastered) return 1
      
      // If both are nearly mastered, prefer higher mastery level (closer to 100%)
      if (a.isNearlyMastered && b.isNearlyMastered) {
        return b.masteryLevel - a.masteryLevel
      }
      
      // Priority 2: Untested root topics
      if (!a.wasTested && a.isRootTopic && (b.wasTested || !b.isRootTopic)) return -1
      if (!b.wasTested && b.isRootTopic && (a.wasTested || !a.isRootTopic)) return 1
      
      // Priority 3: Other untested topics
      if (!a.wasTested && b.wasTested) return -1
      if (a.wasTested && !b.wasTested) return 1
      
      // Within same priority, sort by difficulty
      return a.difficulty - b.difficulty
    })
    
    // Get recommended topic with mastery level
    const topFrontierItem = sortedFrontier.length > 0 ? sortedFrontier[0] : null
    const recommendedTopic = topFrontierItem ? {
      ...topFrontierItem.topic,
      masteryLevel: topFrontierItem.masteryLevel
    } : null
    
    console.log('🎯 [DIAGNOSTIC COMPLETE] Recommendation logic:', {
      sortedFrontierCount: sortedFrontier.length,
      topRecommendations: sortedFrontier.slice(0, 5).map(sf => ({
        name: sf.topic.name,
        wasTested: sf.wasTested,
        isRootTopic: sf.isRootTopic,
        isNearlyMastered: sf.isNearlyMastered,
        masteryLevel: sf.masteryLevel,
        difficulty: sf.difficulty
      })),
      recommendedTopic: recommendedTopic ? {
        id: recommendedTopic.id,
        name: recommendedTopic.name,
        difficulty: recommendedTopic.difficulty,
        masteryLevel: recommendedTopic.masteryLevel
      } : null
    })

    // Get topics with strong understanding (topics answered correctly = 55% mastery) with full topic details
    const strongUnderstandingResults = results.filter(r => r.answerType === 'correct')
    const strongUnderstandingTopics = await Promise.all(
      strongUnderstandingResults.map(async (result) => {
        const topic = await kg.getTopic(result.topicId)
        return topic ? {
          id: topic.id,
          name: topic.name,
          difficulty: topic.difficulty,
          domain: topic.domain,
          masteryLevel: 55 // Diagnostic mastery level - needs practice to reach 100%
        } : null
      })
    )
    const strongUnderstandingTopicsList = strongUnderstandingTopics.filter(t => t !== null)

    // Calculate placement summary
    // Note: Topics with "Strong Understanding" are at 55% mastery from diagnostic, not 100%
    // True mastery (100%) requires practice and verification per pedagogy.md
    const placementSummary = {
      totalTopicsTested: results.length,
      topicsWithStrongUnderstanding: strongUnderstandingResults.length,
      topicsUnknown: results.filter(r => r.answerType === 'idontknow').length,
      topicsInProgress: results.filter(r => r.answerType === 'incorrect').length,
      frontierTopics: frontier.length,
      recommendedStartingPoint: recommendedTopic,
      strongUnderstandingTopics: strongUnderstandingTopicsList, // Array of topic objects with 55% mastery
      // Legacy field for backwards compatibility (deprecated - use strongUnderstandingTopics)
      topicsMastered: strongUnderstandingResults.length,
      masteredTopics: strongUnderstandingTopicsList,
      note: 'Topics with "Strong Understanding" are at 50-60% mastery from diagnostic. Complete these to 100% mastery before advancing to new topics (per mastery learning principles).'
    }

    return {
      success: true,
      diagnosticComplete: true,
      placement: placementSummary,
      frontier,
      diagnosticResults,
      message: `Diagnostic complete! Your knowledge frontier has ${frontier.length} topics ready to learn.`
    }
  } catch (error: any) {
    console.error('Error completing diagnostic:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Failed to complete diagnostic'
    })
  }
})

