// Generate quiz for retrieval practice
// Reference: PRD section 3.2 - Retrieval Practice (Testing Effect)
// Target: 80-85% accuracy, interleaved topics, low-stakes

import { createClient } from '@supabase/supabase-js'
import { generateQuizQuestion } from '../diagnostic/utils/questionGenerator'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const supabase = createClient(
    config.public.supabaseUrl,
    config.supabaseServiceKey
  )

  try {
    const body = await readBody(event)
    const {
      topicIds,
      numQuestions = 10,
      isTimed = false,
      timeLimit,
      difficulty,
      userId,
      sessionId
    } = body

    if (!userId && !sessionId) {
      return {
        success: false,
        error: 'User ID or session ID required'
      }
    }

    // Get student's mastery data to determine which topics to quiz
    let masteryData: any[] = []
    
    if (topicIds && topicIds.length > 0) {
      // Quiz on specific topics
      const { data: specificMastery } = await supabase
        .from('student_mastery')
        .select('*, topics(*)')
        .eq(userId ? 'user_id' : 'session_id', userId || sessionId)
        .in('topic_id', topicIds)
      
      masteryData = specificMastery || []
    } else {
      // Interleaved quiz: select mix of topics student has practiced
      const { data: allMastery } = await supabase
        .from('student_mastery')
        .select('*, topics(*)')
        .eq(userId ? 'user_id' : 'session_id', userId || sessionId)
        .gt('mastery_level', 0) // Only topics with some practice
        .order('last_practiced', { ascending: true })
        .limit(20) // Get up to 20 topics for interleaving
      
      masteryData = allMastery || []
    }

    if (masteryData.length === 0) {
      // Student hasn't practiced anything yet, get frontier topics
      try {
        const { data: frontierData, error: frontierError } = await supabase
          .rpc('get_knowledge_frontier', {
            p_user_id: userId || null,
            p_session_id: sessionId || null
          })
        
        if (frontierError) {
          console.warn('Error getting knowledge frontier:', frontierError)
        }
        
        if (frontierData && frontierData.length > 0) {
          const frontierTopicIds = frontierData.map((t: any) => t.topic_id)
          const { data: frontierTopics, error: topicsError } = await supabase
            .from('topics')
            .select('*')
            .in('id', frontierTopicIds.slice(0, 5))
          
          if (topicsError) {
            console.error('Error fetching frontier topics:', topicsError)
          } else if (frontierTopics && frontierTopics.length > 0) {
            masteryData = frontierTopics.map((topic: any) => ({
              topic_id: topic.id,
              mastery_level: 0,
              topics: topic
            }))
          }
        }
      } catch (frontierErr) {
        console.error('Error in frontier lookup:', frontierErr)
      }
    }

    if (masteryData.length === 0) {
      return {
        success: false,
        error: 'No topics available for quiz. Please complete some lessons or take the diagnostic test first!'
      }
    }

    // Generate interleaved questions
    const questions: any[] = []
    const topicsForQuiz = masteryData.slice(0, Math.min(numQuestions, masteryData.length))
    
    // Shuffle topics for interleaving
    const shuffledTopics = topicsForQuiz.sort(() => Math.random() - 0.5)
    
    // Ensure we have at least one question
    const actualNumQuestions = Math.min(numQuestions, shuffledTopics.length)
    
    for (let i = 0; i < actualNumQuestions; i++) {
      const topicIndex = i % shuffledTopics.length
      const mastery = shuffledTopics[topicIndex]
      const topic = mastery.topics
      
      if (!topic) {
        console.warn(`Topic missing for mastery record: ${mastery.topic_id}`)
        continue
      }
      
      try {
        // Generate question for this topic
        const question = await generateQuizQuestion(topic, mastery.mastery_level || 0)
        
        if (!question || !question.question) {
          console.warn(`Failed to generate question for topic: ${topic.name}`)
          continue
        }
        
        questions.push({
          id: `q${questions.length + 1}`,
          type: question.type,
          question: question.question,
          options: question.options,
          correctAnswer: question.correctAnswer,
          explanation: question.explanation,
          topicId: topic.id,
          topicName: topic.name,
          difficulty: topic.difficulty
        })
      } catch (questionError) {
        console.error(`Error generating question for topic ${topic.name}:`, questionError)
        // Continue to next topic instead of failing entire quiz
        continue
      }
    }
    
    // Validate we have at least one question
    if (questions.length === 0) {
      return {
        success: false,
        error: 'Unable to generate questions. Please try again or select different topics.'
      }
    }

    // Create quiz session in database (let database auto-generate UUID)
    const quizSession = {
      user_id: userId || null,
      session_id: sessionId || null,
      topics: questions.map(q => q.topicId),
      questions: JSON.stringify(questions),
      results: null,
      accuracy: null,
      is_timed: isTimed,
      time_taken_seconds: null,
      completed_at: null,
      created_at: new Date().toISOString()
    }

    const { data: insertedQuiz, error: insertError } = await supabase
      .from('quiz_sessions')
      .insert([quizSession])
      .select()
      .single()

    if (insertError) {
      console.error('Error creating quiz session:', insertError)
      
      // Provide helpful error messages
      if (insertError.code === '42P01') {
        // Table doesn't exist
        return {
          success: false,
          error: 'Database table not found. Please ensure the quiz_sessions table exists in your database.'
        }
      }
      
      return {
        success: false,
        error: insertError.message || 'Failed to create quiz session. Please try again.'
      }
    }

    if (!insertedQuiz || !insertedQuiz.id) {
      return {
        success: false,
        error: 'Failed to create quiz session: No ID returned. Please try again.'
      }
    }

    return {
      success: true,
      quiz: {
        id: insertedQuiz.id,
        userId,
        sessionId,
        topics: questions.map(q => q.topicId),
        questions,
        answers: [],
        isComplete: false,
        isTimed,
        timeLimit,
        startTime: new Date()
      }
    }
  } catch (error: any) {
    console.error('Error generating quiz:', error)
    return {
      success: false,
      error: error.message || 'Failed to generate quiz'
    }
  }
})

