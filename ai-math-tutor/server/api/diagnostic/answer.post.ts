// Diagnostic API: Submit answer and get next question
// Reference: tasks.md - PR #10: Diagnostic & Placement Quest
// Implements adaptive question selection algorithm

import { useKnowledgeGraph } from '~/composables/useKnowledgeGraph'
import { useSupabase } from '~/composables/useSupabase'
import { generateDiagnosticQuestion } from './utils/questionGenerator'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { 
    diagnosticSessionId,
    topicId,
    questionId,
    answer,
    answerType, // 'correct', 'incorrect', 'idontknow'
    topicsTested, // Array of topic IDs already tested
    rootTopicsToTest, // Array of root topic IDs to potentially test
    testedRootTopics, // Array of root topic IDs already tested
    userId,
    sessionId
  } = body

  if (!diagnosticSessionId || !topicId || !answerType) {
    throw createError({
      statusCode: 400,
      statusMessage: 'diagnosticSessionId, topicId, and answerType are required'
    })
  }

  try {
    const supabase = useSupabase()
    const kg = useKnowledgeGraph()

    // Store the answer
    // In a full implementation, we'd store this in a diagnostic_session table
    // For now, we'll track it in memory/logs

    // Track tested topics
    const topicsTestedSoFar = [...(topicsTested || [])]
    const rootTopicsToTestList = rootTopicsToTest || []
    const testedRootTopicsList = [...(testedRootTopics || [])]
    
    console.log('🔍 [DIAGNOSTIC ANSWER] Current state:', {
      currentTopicId: topicId,
      answerType,
      topicsTestedSoFar_BEFORE: [...topicsTestedSoFar],
      rootTopicsToTest: rootTopicsToTestList,
      testedRootTopics: testedRootTopicsList
    })
    
    // IMPORTANT: Add current topic to tested list IMMEDIATELY to prevent repeats
    if (!topicsTestedSoFar.includes(topicId)) {
      topicsTestedSoFar.push(topicId)
      console.log('✅ Added topic to tested list:', topicId)
    } else {
      console.log('⚠️ WARNING: Topic already in tested list!', topicId)
    }
    
    // Add current topic to tested list
    const currentTopic = await kg.getTopic(topicId)
    const isRootTopic = currentTopic && (await kg.getPrerequisites(topicId)).length === 0
    
    if (isRootTopic && !testedRootTopicsList.includes(topicId)) {
      testedRootTopicsList.push(topicId)
    }
    
    // Helper function to filter out already-tested topics
    const filterTestedTopics = (topics: any[]) => {
      return topics.filter(t => !topicsTestedSoFar.includes(t.id))
    }
    
    // Determine next topic based on adaptive algorithm
    // Reference: pedagogy.md - Diagnostic integrity: test multiple topics to find frontier
    let nextTopic = null
    let isComplete = false
    const questionsAsked = topicsTestedSoFar.length
    const minQuestions = 3 // Minimum for accurate placement
    const maxQuestions = 10 // Maximum to prevent fatigue

    if (answerType === 'idontknow') {
      // Student doesn't know - mark topic as unknown (0% mastery)
      // Continue testing other root topics or prerequisites to find frontier
      if (isRootTopic) {
        // If this is a root topic, test other root topics we haven't tested yet
        const remainingRootTopics = rootTopicsToTestList.filter((id: string) => 
          !testedRootTopicsList.includes(id)
        )
        
        if (remainingRootTopics.length > 0 && questionsAsked < maxQuestions) {
          // Get next untested root topic
          const nextRootTopicId = remainingRootTopics[0]
          nextTopic = await kg.getTopic(nextRootTopicId)
        } else if (questionsAsked >= minQuestions) {
          // Tested enough root topics or ran out - we can complete
          isComplete = true
        } else {
          // Need more questions - test any remaining root topic
          const allRootTopics = await kg.getAllTopics()
          const rootTopics = []
          for (const topic of allRootTopics) {
            const prereqs = await kg.getPrerequisites(topic.id)
            if (prereqs.length === 0 && !topicsTestedSoFar.includes(topic.id)) {
              rootTopics.push(topic)
            }
          }
          if (rootTopics.length > 0) {
            nextTopic = rootTopics.sort((a, b) => a.difficulty - b.difficulty)[0]
          } else {
            isComplete = questionsAsked >= minQuestions
          }
        }
      } else {
        // Not a root topic - test prerequisites to find where they're comfortable
        const prerequisites = await kg.getPrerequisites(topicId)
        const untestedPrereqs = filterTestedTopics(prerequisites)
        if (untestedPrereqs.length > 0 && questionsAsked < maxQuestions) {
          // Test a prerequisite that hasn't been tested yet
          nextTopic = untestedPrereqs[untestedPrereqs.length - 1]
        } else if (questionsAsked >= minQuestions) {
          isComplete = true
        } else {
          // Test another root topic
          const allRootTopics = await kg.getAllTopics()
          const rootTopics = []
          for (const topic of allRootTopics) {
            const prereqs = await kg.getPrerequisites(topic.id)
            if (prereqs.length === 0 && !topicsTestedSoFar.includes(topic.id)) {
              rootTopics.push(topic)
            }
          }
          if (rootTopics.length > 0) {
            nextTopic = rootTopics.sort((a, b) => a.difficulty - b.difficulty)[0]
          } else {
            isComplete = true
          }
        }
      }
    } else if (answerType === 'correct') {
      // Student got it right - test a more advanced topic
      const dependentTopics = await kg.getDependentTopics(topicId)
      const untestedDependentTopics = filterTestedTopics(dependentTopics)
      if (untestedDependentTopics.length > 0 && questionsAsked < maxQuestions) {
        // Find the next topic with this as prerequisite that hasn't been tested
        nextTopic = untestedDependentTopics.sort((a, b) => a.difficulty - b.difficulty)[0]
      } else if (questionsAsked >= minQuestions) {
        // Tested enough or no more advanced topics
        isComplete = true
      } else {
        // Need more questions - test other root topics to get a fuller picture
        const allRootTopics = await kg.getAllTopics()
        const rootTopics = []
        for (const topic of allRootTopics) {
          const prereqs = await kg.getPrerequisites(topic.id)
          if (prereqs.length === 0 && !testedRootTopicsList.includes(topic.id)) {
            rootTopics.push(topic)
          }
        }
        if (rootTopics.length > 0) {
          nextTopic = rootTopics.sort((a, b) => a.difficulty - b.difficulty)[0]
        } else {
          isComplete = true
        }
      }
    } else {
      // Student got it wrong - test prerequisites or other root topics
      const prerequisites = await kg.getPrerequisites(topicId)
      const untestedPrereqs = filterTestedTopics(prerequisites)
      if (untestedPrereqs.length > 0 && questionsAsked < maxQuestions) {
        // Test a prerequisite topic that hasn't been tested
        nextTopic = untestedPrereqs[untestedPrereqs.length - 1]
      } else if (isRootTopic) {
        // This is a root topic and they got it wrong
        // Test other root topics to find where they ARE comfortable
        const remainingRootTopics = rootTopicsToTestList.filter((id: string) => 
          !testedRootTopicsList.includes(id)
        )
        
        if (remainingRootTopics.length > 0 && questionsAsked < maxQuestions) {
          const nextRootTopicId = remainingRootTopics[0]
          nextTopic = await kg.getTopic(nextRootTopicId)
        } else if (questionsAsked >= minQuestions) {
          // Tested enough topics
          isComplete = true
        } else {
          // Get any remaining root topic
          const allRootTopics = await kg.getAllTopics()
          const rootTopics = []
          for (const topic of allRootTopics) {
            const prereqs = await kg.getPrerequisites(topic.id)
            if (prereqs.length === 0 && !testedRootTopicsList.includes(topic.id)) {
              rootTopics.push(topic)
            }
          }
          if (rootTopics.length > 0) {
            nextTopic = rootTopics.sort((a, b) => a.difficulty - b.difficulty)[0]
          } else {
            isComplete = questionsAsked >= minQuestions
          }
        }
      } else if (questionsAsked >= minQuestions) {
        isComplete = true
      } else {
        // Test another root topic
        const allRootTopics = await kg.getAllTopics()
        const rootTopics = []
        for (const topic of allRootTopics) {
          const prereqs = await kg.getPrerequisites(topic.id)
          if (prereqs.length === 0 && !testedRootTopicsList.includes(topic.id)) {
            rootTopics.push(topic)
          }
        }
        if (rootTopics.length > 0) {
          nextTopic = rootTopics.sort((a, b) => a.difficulty - b.difficulty)[0]
        } else {
          isComplete = true
        }
      }
    }

    // Generate next question if not complete
    let nextQuestion = null
    if (!isComplete && nextTopic) {
      console.log('📝 [DIAGNOSTIC ANSWER] Selected next topic:', {
        topicId: nextTopic.id,
        topicName: nextTopic.name,
        wasInTestedList: topicsTestedSoFar.includes(nextTopic.id),
        difficulty: nextTopic.difficulty
      })
      
      nextQuestion = await generateDiagnosticQuestion(nextTopic)
      
      console.log('❓ [DIAGNOSTIC ANSWER] Generated question:', {
        question: nextQuestion.question,
        topicId: nextTopic.id,
        topicName: nextTopic.name
      })
      
      if (topicsTestedSoFar.includes(nextTopic.id)) {
        console.error('🚨 ERROR: Selected topic that was already tested!', {
          topicId: nextTopic.id,
          topicName: nextTopic.name,
          topicsTestedSoFar
        })
      }
    } else {
      console.log('✅ [DIAGNOSTIC ANSWER] Diagnostic complete or no next topic:', {
        isComplete,
        hasNextTopic: !!nextTopic,
        questionsAsked
      })
    }

    // Store diagnostic result for this topic
    // Note: Diagnostic mastery is tentative - we'll set final mastery in complete endpoint
    const masteryLevel = answerType === 'correct' ? 55 : (answerType === 'idontknow' ? 0 : 30)
    
    // Calculate overall accuracy so far (simplified)
    const accuracy = answerType === 'correct' ? 100 : 0

    const response = {
      success: true,
      answerRecorded: true,
      nextTopic,
      nextQuestion,
      isComplete,
      masteryLevel,
      accuracy,
      topicsTested: topicsTestedSoFar, // Already includes current topicId
      testedRootTopics: testedRootTopicsList,
      questionsAsked,
      message: isComplete 
        ? 'Diagnostic complete! Calculating your knowledge frontier...'
        : `Answer recorded. Question ${questionsAsked + 1} coming up!`
    }
    
    console.log('📤 [DIAGNOSTIC ANSWER] Response:', {
      topicsTested: topicsTestedSoFar.length,
      nextTopicId: nextTopic?.id,
      nextTopicName: nextTopic?.name,
      isComplete,
      questionsAsked
    })
    
    return response
  } catch (error: any) {
    console.error('Error processing diagnostic answer:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Failed to process diagnostic answer'
    })
  }
})


