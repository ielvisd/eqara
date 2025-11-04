// Diagnostic API: Start diagnostic session
// Reference: tasks.md - PR #10: Diagnostic & Placement Quest
// Reference: pedagogy.md - Diagnostic integrity and knowledge frontier

import { useKnowledgeGraph } from '~/composables/useKnowledgeGraph'
import { useMastery } from '~/composables/useMastery'
import { generateDiagnosticQuestion } from './utils/questionGenerator'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { userId, sessionId } = body

  if (!userId && !sessionId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Either userId or sessionId is required'
    })
  }

  try {
    const kg = useKnowledgeGraph()
    
    // Get all root topics (topics with no prerequisites) as starting points
    const allTopics = await kg.getAllTopics()
    const rootTopics: any[] = []
    
    for (const topic of allTopics) {
      const prereqs = await kg.getPrerequisites(topic.id)
      if (prereqs.length === 0) {
        rootTopics.push(topic)
      }
    }

    if (rootTopics.length === 0) {
      throw createError({
        statusCode: 500,
        statusMessage: 'No root topics found for diagnostic'
      })
    }

    // Sort root topics by difficulty
    const sortedRootTopics = rootTopics.sort((a, b) => a.difficulty - b.difficulty)
    
    // Start with the first root topic (lowest difficulty)
    const startingTopic = sortedRootTopics[0]

    // Generate a diagnostic question for this topic
    const question = await generateDiagnosticQuestion(startingTopic)
    
    const sessionId = `diagnostic_${Date.now()}`
    
    console.log('🚀 [DIAGNOSTIC START] Starting diagnostic session:', {
      sessionId,
      startingTopic: {
        id: startingTopic.id,
        name: startingTopic.name,
        difficulty: startingTopic.difficulty
      },
      rootTopicsAvailable: sortedRootTopics.length,
      rootTopicsList: sortedRootTopics.map(t => ({ id: t.id, name: t.name, difficulty: t.difficulty })),
      question: question.question
    })

    return {
      success: true,
      diagnosticSession: {
        sessionId,
        currentTopic: startingTopic,
        question,
        topicsTested: [],
        answers: [],
        rootTopicsToTest: sortedRootTopics.map(t => t.id), // Track all root topics
        testedRootTopics: [], // Track which root topics we've tested
        minQuestionsRequired: 3, // Minimum questions for accurate placement
        maxQuestions: 10 // Maximum to prevent fatigue
      }
    }
  } catch (error: any) {
    console.error('Error starting diagnostic:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Failed to start diagnostic'
    })
  }
})

