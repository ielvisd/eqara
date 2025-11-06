// Chat API endpoint with Grok LLM integration
// Reference: nuxt.com/docs/guide/directory-structure/server - Server API routes
// Reference: supabase.com/docs/guides/auth - Service key usage
// Reference: prd.md - Socratic prompt engineering guidelines

import { validateMath, formatValidationForLLM } from '../utils/mathValidator'
import { createClient } from '@supabase/supabase-js'

// Helper function to get KG context for a student
async function getKGContext(sessionId: string, problemText: string) {
  const config = useRuntimeConfig()
  const supabaseUrl = config.public.supabaseUrl
  // Use service role key for server-side queries (bypasses RLS)
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || config.supabaseServiceKey

  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('Supabase not configured, skipping KG context. Set SUPABASE_SERVICE_ROLE_KEY in .env')
    return null
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    // Enhanced topic detection with pattern matching
    const problemLower = problemText.toLowerCase()
    let detectedTopicId: string | null = null
    let bestMatchScore = 0

    // Try to find matching topic based on keywords and patterns
    const { data: topics } = await supabase
      .from('topics')
      .select('id, name, domain, difficulty')
      .limit(50)

    if (topics && topics.length > 0) {
      // Enhanced pattern matching with scoring
      for (const topic of topics) {
        let score = 0
        const topicNameLower = topic.name.toLowerCase()
        const domainLower = topic.domain.toLowerCase()

        // Exact name match (highest priority)
        if (problemLower.includes(topicNameLower)) {
          score += 10
        }

        // Domain match
        if (problemLower.includes(domainLower)) {
          score += 5
        }

        // Pattern-based detection for common math types
        // Algebra patterns: variables, equations, solve for x
        if (domainLower === 'algebra' || topicNameLower.includes('algebra') || topicNameLower.includes('equation')) {
          if (/\b([xyz]|[a-z])\s*[=+\-*\/]/.test(problemText) || 
              /solve\s+for/.test(problemLower) ||
              /[xyz]/.test(problemText)) {
            score += 8
          }
        }

        // Arithmetic patterns: basic operations, numbers only
        // BUT exclude if it contains percentage indicators (percentages should win)
        const hasPercentagePattern = /%/.test(problemText) || /percent/i.test(problemText) || /\b(what|find|calculate|is)\s+.*%\s+(of|from)/i.test(problemText)
        
        if ((domainLower === 'arithmetic' || topicNameLower.includes('arithmetic') || topicNameLower.includes('addition') || topicNameLower.includes('subtraction') || topicNameLower.includes('multiplication') || topicNameLower.includes('division')) 
            && !hasPercentagePattern) {
          if (/^\d+\s*[+\-*\/]\s*\d+/.test(problemText) ||
              /add|subtract|multiply|divide|sum|difference|product/i.test(problemLower)) {
            score += 7
          }
        }
        
        // Order of Operations (PEMDAS/BODMAS) - but exclude if percentage pattern
        if ((topicNameLower.includes('order of operations') || topicNameLower.includes('pemdas') || topicNameLower.includes('bodmas'))
            && !hasPercentagePattern) {
          if (/pemdas|bodmas|order\s+of\s+operations/i.test(problemLower) ||
              /[\(\)\[\]]/.test(problemText) && /\d+\s*[+\-*\/]\s*\d+/.test(problemText)) {
            score += 8
          }
        }

        // Proportions/Ratios patterns
        if (domainLower === 'proportions' || topicNameLower.includes('proportion') || topicNameLower.includes('ratio') || topicNameLower.includes('percent')) {
          // Check for percentage patterns (higher priority for percentage questions)
          if (topicNameLower.includes('percent')) {
            // Strong percentage indicators
            if (/%/.test(problemText) || 
                /percent/i.test(problemText) ||
                /\b(what|find|calculate|is)\s+.*%\s+(of|from)/i.test(problemText)) {
              score += 12 // Higher score for percentage-specific topics
            }
          }
          // General proportion/ratio patterns
          if (/ratio|proportion|%|:\s*/.test(problemText) ||
              /\d+\s*:\s*\d+/.test(problemText)) {
            score += 8
          }
        }

        // Word problems patterns
        if (domainLower === 'word_problems' || topicNameLower.includes('word problem')) {
          // Longer text, contains words like "how many", "if", "then", etc.
          if (problemText.length > 30 && 
              (/\b(how many|how much|if|then|when|what|who|where)\b/i.test(problemText) ||
               /\b(has|have|had|was|were|is|are)\b/i.test(problemText))) {
            score += 7
          }
        }

        // Linear equations specific
        if (topicNameLower.includes('linear') || topicNameLower.includes('linear equation')) {
          if (/[xyz]\s*[+\-]\s*\d+\s*=\s*\d+/.test(problemText) ||
              /\d+[xyz]\s*=\s*\d+/.test(problemText)) {
            score += 9
          }
        }

        // Update best match
        if (score > bestMatchScore) {
          bestMatchScore = score
          detectedTopicId = topic.id
        }
      }

      // Only use detection if we have a reasonable match (score >= 5)
      if (bestMatchScore < 5) {
        detectedTopicId = null
      }
    }

    // Get student mastery data
    const { data: allMastery } = await supabase
      .from('student_mastery')
      .select('*, topic:topics(*)')
      .eq('session_id', sessionId)
      .is('user_id', null)

    const masteryMap = new Map<string, number>()
    if (allMastery) {
      for (const mastery of allMastery) {
        masteryMap.set(mastery.topic_id, mastery.mastery_level || 0)
      }
    }

    // Get knowledge frontier
    const { data: allTopics } = await supabase
      .from('topics')
      .select('id, name, domain, difficulty')

    const masteredTopicIds = Array.from(masteryMap.entries())
      .filter(([_, level]) => level >= 80)
      .map(([topicId, _]) => topicId)

    // Get prerequisites for detected topic
    let prerequisites: any[] = []
    let currentTopic: any = null

    if (detectedTopicId) {
      const { data: topicData } = await supabase
        .from('topics')
        .select('*')
        .eq('id', detectedTopicId)
        .single()

      currentTopic = topicData

      const { data: prereqData } = await supabase
        .from('topic_prerequisites')
        .select('prerequisite_id, prerequisite:topics!topic_prerequisites_prerequisite_id_fkey(*)')
        .eq('topic_id', detectedTopicId)

      if (prereqData) {
        prerequisites = prereqData.map((p: any) => p.prerequisite).filter(Boolean)
      }
    }

    // Calculate frontier topics (topics where all prerequisites are mastered)
    const frontierTopics: any[] = []
    if (allTopics) {
      for (const topic of allTopics) {
        const { data: prereqData } = await supabase
          .from('topic_prerequisites')
          .select('prerequisite_id')
          .eq('topic_id', topic.id)

        const prereqIds = prereqData?.map((p: any) => p.prerequisite_id) || []
        
        if (prereqIds.length === 0 || prereqIds.every((id: string) => masteredTopicIds.includes(id))) {
          const mastery = masteryMap.get(topic.id) || 0
          if (mastery < 100) {
            frontierTopics.push(topic)
          }
        }
      }
    }

    return {
      currentTopic,
      currentTopicMastery: detectedTopicId ? (masteryMap.get(detectedTopicId) || 0) : null,
      prerequisites,
      prerequisiteMastery: prerequisites.map((p: any) => ({
        topic: p,
        mastery: masteryMap.get(p.id) || 0
      })),
      frontierTopics,
      masteryMap
    }
  } catch (error) {
    console.error('Error fetching KG context:', error)
    return null
  }
}

// Count stuck turns (student keeps saying they don't know or giving non-progress responses)
function countStuckTurns(conversationHistory: any[]): number {
  let stuckCount = 0
  // Look for patterns of: user stuck response -> assistant help -> user still stuck
  // Count consecutive assistant messages at the end (indicates we've been helping repeatedly)
  // But also check if user responses indicate they're stuck
  
  // Count from the end backwards
  let consecutiveAssistant = 0
  let consecutiveUserStuck = 0
  
  for (let i = conversationHistory.length - 1; i >= 0; i--) {
    const msg = conversationHistory[i]
    
    if (msg.role === 'assistant') {
      consecutiveAssistant++
    } else if (msg.role === 'user') {
      // Check if user message indicates they're stuck
      const content = (msg.content || '').toLowerCase()
      const isStuckResponse = 
        /(don'?t know|dunno|idk|not sure|unsure|cannot|can'?t|confused|stuck|help|no idea|have no idea)/i.test(content) ||
        content.length < 5 // Very short responses often indicate confusion
      
      if (isStuckResponse) {
        consecutiveUserStuck++
      } else {
        // User gave a real answer or progress - reset stuck count
        break
      }
    }
  }
  
  // Stuck turns = number of times we've had to help (assistant messages)
  // OR number of consecutive "I don't know" type responses
  // Use whichever is higher to catch different stuck patterns
  return Math.max(consecutiveAssistant, consecutiveUserStuck)
}

// Calculate scaffolding level based on mastery (adaptive difficulty)
function calculateScaffoldingLevel(masteryLevel: number | null): {
  level: 'minimal' | 'moderate' | 'maximum'
  description: string
  guidance: string
} {
  if (masteryLevel === null) {
    // New topic - start with moderate scaffolding
    return {
      level: 'moderate',
      description: 'Moderate scaffolding (new topic)',
      guidance: 'Break problems into 2-3 steps. Provide some guidance but encourage discovery.'
    }
  }

  if (masteryLevel >= 80) {
    // High mastery - minimal scaffolding, more challenge
    return {
      level: 'minimal',
      description: 'Minimal scaffolding (high mastery: 80-100%)',
      guidance: 'Challenge student with more complex questions. Minimal hints - let them work through multi-step problems independently. Ask open-ended questions that require deeper thinking.'
    }
  } else if (masteryLevel >= 40) {
    // Medium mastery - moderate scaffolding
    return {
      level: 'moderate',
      description: 'Moderate scaffolding (medium mastery: 40-79%)',
      guidance: 'Break problems into 2-3 manageable steps. Provide some guidance but encourage discovery. Ask questions that help them connect concepts.'
    }
  } else {
    // Low mastery - maximum scaffolding
    return {
      level: 'maximum',
      description: 'Maximum scaffolding (low mastery: 0-39%)',
      guidance: 'Break problems into very small steps (4-5 steps). Provide more explicit guidance and worked examples. Use visual aids and concrete examples. Check understanding frequently with simple verification questions.'
    }
  }
}

// Track lesson failures and detect remediation needs
async function checkRemediationStatus(
  supabase: any,
  sessionId: string,
  topicId: string | null,
  conversationHistory: any[],
  mathValidation: any
): Promise<{
  needsRemediation: boolean
  failureCount: number
  remediationPrerequisites: any[]
  inRemediation: boolean
}> {
  if (!topicId) {
    return { needsRemediation: false, failureCount: 0, remediationPrerequisites: [], inRemediation: false }
  }

  try {
    // Check for lesson attempts table (we'll use a simple JSONB approach)
    // For now, track failures in memory/session - in production, use a proper table
    const stuckTurns = countStuckTurns(conversationHistory)
    const hasWrongAnswer = !mathValidation.isValid && mathValidation.hasAttempt
    
    // Count failures: stuck for 3+ turns OR multiple wrong answers indicates a lesson failure
    // A "lesson" is considered failed if:
    // 1. Student gets stuck for 3+ consecutive turns (can't progress)
    // 2. Multiple wrong answers in sequence (indicates misunderstanding)
    
    // Simple failure detection: count wrong answers in recent history
    let wrongAnswerCount = 0
    let lastCorrectIndex = -1
    
    for (let i = conversationHistory.length - 1; i >= 0; i--) {
      const msg = conversationHistory[i]
      if (msg.role === 'user') {
        // Check if this was a wrong answer (we'd need to track this better)
        // For now, assume wrong answers if we have stuck turns
        if (i < conversationHistory.length - 3 && stuckTurns >= 3) {
          wrongAnswerCount++
        }
      }
    }
    
    // Check if we need remediation (2 failures = stuck twice or multiple wrong attempts)
    const failureCount = stuckTurns >= 3 ? 1 : 0 // Simplified: 3+ stuck turns = 1 failure
    const needsRemediation = failureCount >= 2 || (stuckTurns >= 6) // 6+ stuck turns = 2 failures
    
    // Get prerequisites for remediation if needed
    let remediationPrerequisites: any[] = []
    if (needsRemediation) {
      const { data: prereqData } = await supabase
        .from('topic_prerequisites')
        .select('prerequisite_id, prerequisite:topics!topic_prerequisites_prerequisite_id_fkey(*)')
        .eq('topic_id', topicId)
      
      if (prereqData) {
        remediationPrerequisites = prereqData.map((p: any) => p.prerequisite).filter(Boolean)
      }
    }
    
    // Check if currently in remediation (check mastery for prerequisite topics)
    const { data: masteryData } = await supabase
      .from('student_mastery')
      .select('topic_id, mastery_level')
      .eq('session_id', sessionId)
      .is('user_id', null)
      .in('topic_id', remediationPrerequisites.map((p: any) => p.id))
    
    const inRemediation = needsRemediation && masteryData && masteryData.length > 0
    
    return {
      needsRemediation,
      failureCount,
      remediationPrerequisites,
      inRemediation
    }
  } catch (error) {
    console.error('Error checking remediation status:', error)
    return { needsRemediation: false, failureCount: 0, remediationPrerequisites: [], inRemediation: false }
  }
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)
  
  const { message, chatHistory, sessionId, userId, extractedProblem, drawingAnalysis } = body

  // Prefer userId if authenticated, otherwise use sessionId
  const userIdentifier = userId || sessionId

  if (!message && !extractedProblem && !drawingAnalysis) {
    throw createError({
      statusCode: 400,
      statusMessage: 'No message, problem, or drawing analysis provided'
    })
  }
  
  if (!userIdentifier) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Either userId or sessionId is required'
    })
  }

  try {
    // Build conversation history for context
    const conversationHistory = chatHistory || []
    
    // Validate student's math if they provided a calculation
    const previousMessages = conversationHistory.map((msg: any) => msg.content || '')
    const mathValidation = validateMath(message || '', previousMessages, conversationHistory)
    const validationContext = formatValidationForLLM(mathValidation)
    
    // If there's an extracted problem from vision, add it as the first user message
    if (extractedProblem && conversationHistory.length === 0) {
      conversationHistory.push({
        role: 'user',
        content: `I need help with this problem: ${extractedProblem}`
      })
    }

    // Add current user message
    // If there's drawing analysis, format it as context for the user message
    let userMessageContent = message || extractedProblem || '📝 [Drawing submitted]'
    
    if (drawingAnalysis) {
      // Keep the message simple - the analysis details go in the system prompt
      userMessageContent = '📝 [Drawing submitted]'
    }
    
    conversationHistory.push({
      role: 'user',
      content: userMessageContent
    })

    // Get Knowledge Graph context
    // If current message doesn't contain a math problem, look for the original problem in conversation history
    let problemText = message || extractedProblem || ''
    
    // If current message is a drawing submission or "I don't know" or similar, find the original problem from history
    const isStuckResponse = /(don'?t know|dunno|idk|not sure|unsure|cannot|can'?t|confused|stuck|help|no idea|have no idea)/i.test(problemText) || problemText.length < 10
    const isDrawingSubmission = /\[Drawing submitted\]|drawing|📝/i.test(problemText) || !!drawingAnalysis
    
    if ((isStuckResponse || isDrawingSubmission) && conversationHistory.length > 0) {
      // Look backwards through conversation for the original problem
      for (let i = conversationHistory.length - 1; i >= 0; i--) {
        const msg = conversationHistory[i]
        if (msg.role === 'user') {
          const content = msg.content || ''
          // Check if this looks like a math problem (has numbers, equations, etc.)
          if (/\d/.test(content) && (/\b([xyz]|[a-z])\s*[=+\-*\/]/.test(content) || 
              /solve|calculate|find|what|how many/i.test(content) ||
              /[+\-*\/=]/.test(content))) {
            problemText = content
            break
          }
        }
      }
    }
    
    // If we have drawing analysis, use the extracted solution to help identify the problem
    if (drawingAnalysis && drawingAnalysis.extractedSolution && problemText.length < 20) {
      problemText = drawingAnalysis.extractedSolution
    }
    
    const kgContext = sessionId ? await getKGContext(sessionId, problemText) : null
    const stuckTurns = countStuckTurns(conversationHistory.slice(0, -1)) // Exclude current message
    
    // Debug logging (remove in production)
    if (process.env.NODE_ENV === 'development') {
      const weakPrereqs = kgContext?.prerequisiteMastery?.filter((p: any) => p.mastery < 80) || []
      console.log('[KG Debug]', {
        topicDetected: kgContext?.currentTopic?.name || 'none',
        topicDomain: kgContext?.currentTopic?.domain || 'none',
        mastery: kgContext?.currentTopicMastery ?? 'null',
        stuckTurns,
        hasPrerequisites: kgContext?.prerequisites?.length || 0,
        weakPrerequisites: weakPrereqs.map((p: any) => p.topic.name),
        shouldTriggerHint: stuckTurns >= 2 && weakPrereqs.length > 0,
        problemText: problemText.substring(0, 50) // First 50 chars for debugging
      })
    }

    // Check remediation status if we have a topic and session
    let remediationStatus = null
    if (sessionId && kgContext?.currentTopic) {
      const config = useRuntimeConfig()
      const supabaseUrl = config.public.supabaseUrl
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || config.supabaseServiceKey
      
      if (supabaseUrl && supabaseServiceKey) {
        const supabase = createClient(supabaseUrl, supabaseServiceKey)
        remediationStatus = await checkRemediationStatus(
          supabase,
          sessionId,
          kgContext.currentTopic.id,
          conversationHistory,
          mathValidation
        )
      }
    }

    // Build KG context string for prompt
    let kgContextString = ''
    if (kgContext) {
      const { currentTopic, currentTopicMastery, prerequisites, prerequisiteMastery, frontierTopics } = kgContext
      
      kgContextString = '\n\nKNOWLEDGE GRAPH CONTEXT (Mastery Learning System):\n'
      
      if (currentTopic) {
        const masteryLevel = currentTopicMastery ?? 0
        kgContextString += `- Current Topic: "${currentTopic.name}" (Domain: ${currentTopic.domain}, Difficulty: ${currentTopic.difficulty}/10)\n`
        kgContextString += `- Current Topic Mastery: ${masteryLevel}% ${masteryLevel >= 100 ? '✅ MASTERED' : masteryLevel >= 80 ? '🟡 In Progress' : '🔴 Needs Work'}\n`
        
        if (prerequisites && prerequisites.length > 0) {
          kgContextString += `- Prerequisites for this topic:\n`
          for (const prereq of prerequisiteMastery) {
            const status = prereq.mastery >= 100 ? '✅ Mastered' : prereq.mastery >= 80 ? '🟡 Partial' : '🔴 Needs Review'
            kgContextString += `  • ${prereq.topic.name}: ${prereq.mastery}% ${status}\n`
          }
          
          // Check for weak prerequisites
          const weakPrereqs = prerequisiteMastery.filter((p: any) => p.mastery < 80)
          if (weakPrereqs.length > 0 && stuckTurns >= 2) {
            kgContextString += `\n🚨 CRITICAL: Student is stuck (${stuckTurns} stuck turns). Weak prerequisites detected - MUST reference these in your response:\n`
            for (const weak of weakPrereqs) {
              kgContextString += `  • ${weak.topic.name} (${weak.mastery}% mastery) - MENTION THIS TOPIC BY NAME in your hint\n`
            }
            kgContextString += `\n💡 REQUIRED PREREQUISITE-AWARE HINT: You MUST mention at least one of these prerequisite topics by name.`
            kgContextString += ` Example: "Remember when we learned about ${weakPrereqs[0]?.topic.name}? That foundation helps us here..."`
            kgContextString += ` Frame it as a "secret scroll" or "foundation reminder" that connects the prerequisite to the current problem.\n`
          } else if (stuckTurns >= 2 && prerequisites.length > 0) {
            kgContextString += `\n⚠️ STUDENT IS STUCK: ${stuckTurns} stuck turns detected. Reference prerequisite topics to help them.\n`
            kgContextString += `Available prerequisites: ${prerequisites.map((p: any) => p.name).join(', ')}\n`
          } else if (stuckTurns >= 2) {
            kgContextString += `\n⚠️ STUDENT IS STUCK: ${stuckTurns} stuck turns detected. Provide a gentle hint.\n`
          }
        }
      }
      
      // Add remediation context if needed
      if (remediationStatus?.needsRemediation) {
        kgContextString += `\n🚨 REMEDIATION REQUIRED: Lesson failed ${remediationStatus.failureCount} time(s)\n`
        kgContextString += `- Student needs to review prerequisite topics before re-attempting this lesson\n`
        if (remediationStatus.remediationPrerequisites.length > 0) {
          kgContextString += `- Prerequisites to review:\n`
          for (const prereq of remediationStatus.remediationPrerequisites) {
            kgContextString += `  • ${prereq.name} - focus on building this foundation\n`
          }
        }
        if (remediationStatus.inRemediation) {
          kgContextString += `- Currently in remediation phase - guide student to review prerequisites\n`
        } else {
          kgContextString += `- Suggest a consolidation break, then guide to prerequisite review\n`
        }
      }
      
      if (frontierTopics && frontierTopics.length > 0) {
        kgContextString += `\n- Knowledge Frontier: ${frontierTopics.length} topics ready to learn (all prerequisites mastered)\n`
        kgContextString += `  Example: ${frontierTopics.slice(0, 3).map((t: any) => t.name).join(', ')}\n`
      }
      
      // Calculate scaffolding level based on mastery
      const scaffolding = calculateScaffoldingLevel(currentTopicMastery ?? null)
      
      kgContextString += '\nPEDAGOGICAL GUIDANCE:\n'
      kgContextString += '- If student struggles, identify which prerequisite topics need review\n'
      kgContextString += `- ADAPTIVE SCAFFOLDING: ${scaffolding.description}\n`
      kgContextString += `  ${scaffolding.guidance}\n`
      kgContextString += '- Only serve lessons at knowledge frontier (topics where prerequisites are mastered)\n'
      if (remediationStatus?.needsRemediation) {
        kgContextString += '- REMEDIATION MODE: If lesson failed twice, guide student to review prerequisites before re-attempt\n'
        kgContextString += '- Suggest a brief consolidation break, then focus on prerequisite topics\n'
      }
      if (currentTopicMastery !== null && currentTopicMastery < 100) {
        kgContextString += `- Student needs to reach 100% mastery on "${currentTopic?.name}" before advancing\n`
      }
    }

    // Build hint guidance line based on stuck turns
    let hintGuidanceLine: string
    if (stuckTurns >= 2 && kgContext) {
      hintGuidanceLine = '- Provide a hint based on prerequisite knowledge gaps identified in KG context'
    } else {
      hintGuidanceLine = '- Optionally provide a hint if they\'re stuck'
    }

    let stuckGuidanceLine: string
    if (stuckTurns >= 2) {
      stuckGuidanceLine = `- 🚨 STUDENT IS STUCK (${stuckTurns} turns): You MUST reference prerequisite topics by name in your hint. This is REQUIRED when stuckTurns >= 2.`
    } else {
      stuckGuidanceLine = '- If student is stuck for 2+ turns, provide a gentle hint based on prerequisite knowledge gaps (frame as "secret scroll")'
    }

    // Build validation context string
    const validationContextStr = validationContext
      ? validationContext + '\n\n'
      : 'You will receive validation results for student calculations. Follow those instructions exactly.\n\n'

    // Build drawing analysis context if present
    let drawingContextStr = ''
    if (drawingAnalysis) {
      drawingContextStr = `\n\nDRAWING ANALYSIS CONTEXT:
The student has submitted a drawing of their work. Here's what the analysis found:
- Is Correct: ${drawingAnalysis.isCorrect ? 'YES' : 'NO'}
- Confidence: ${drawingAnalysis.confidence}%
- Extracted Solution: ${drawingAnalysis.extractedSolution || 'Could not extract clearly'}
- Explanation: ${drawingAnalysis.explanation || 'No explanation provided'}
${drawingAnalysis.errors && drawingAnalysis.errors.length > 0 ? `- Errors Found: ${drawingAnalysis.errors.join(', ')}` : ''}
${drawingAnalysis.nextSteps && drawingAnalysis.nextSteps.length > 0 ? `- Suggested Next Steps: ${drawingAnalysis.nextSteps.join(', ')}` : ''}

CRITICAL: When responding to drawing submissions, you MUST:
1. **First, describe what the student drew** in detail so they know you saw their work:
   * GOOD: "You showed the division: 2x/2 = 8/2, which gives us x = 4! Perfect! 🎉"
   * GOOD: "I see you wrote 2x = 8 and then divided both sides by 2 to get x = 4. Excellent work!"
   * BAD: "Now, let's check your drawing. What do you think we should do next?" (doesn't describe what they drew)
   
2. **Then, use Socratic questioning for the NEXT step** (if needed):
   * If they completed the problem correctly, celebrate and don't ask for more steps
   * If there's a next step, ask them what they think (but NEVER suggest specific operations)
   
3. **NEVER suggest specific operations in question form:**
   * BAD: "What happens if we subtract 3 from both sides?" (too direct)
   * BAD: "What if we divide by 2?" (telling them what to do)
   * GOOD: "What number is being multiplied with x?" (helps them notice the 2)
   * GOOD: "What operation undoes multiplication?" (helps them discover division)
   
4. **For correct work, acknowledge the specific operation they performed:**
   * GOOD: "Great job dividing both sides by 2! That isolated x perfectly. 🎉"
   * GOOD: "You subtracted 3 from both sides correctly, giving us 2x = 8!"
   * BAD: "Nice work! What should we do next?" (doesn't acknowledge what they did)

Remember: Describe their work first, THEN guide them to the next step with questions (not direct instructions).

`
    }

    // Build Socratic system prompt (kid-friendly, Grok-style with KG integration)
    let systemPrompt = `You are a fun math quest guide grounded in mastery learning—like a clever sidekick who knows exactly what students need to learn next based on their Knowledge Graph position. You guide students through Knowledge Points (tiny steps) at their knowledge frontier, ensuring they master each topic before advancing.

CORE RULES:
- NEVER give direct answers—always ask leading questions
- NEVER suggest specific operations, even in question form
  * BAD: "What happens if we subtract 3 from both sides?" (too direct - gives away the answer)
  * BAD: "Let's try subtracting 3" (telling them what to do)
  * GOOD: "What number is being added to 2x?" (helps them notice the +3)
  * GOOD: "How can we get rid of that number?" (guides them to think about operations)
  * GOOD: "What operation undoes addition?" (helps them discover subtraction)
- Spark curiosity: "What clues sparkle here?" "What trick unlocks it?"
${stuckGuidanceLine}
- Always be upbeat, playful, and encouraging
- Celebrate progress with XP mentions: "+5 XP for that insight!" "+10 XP for trying!"
- Use emojis sparingly but effectively (🎓 🚀 ✨ 🎉)
- Keep responses conversational and age-appropriate (8-18 years old)
- Validate student thinking even if it's not quite right: "Nice thinking! Let's explore that further..."

PROBLEM PACING:
- When a student completes a problem correctly, CELEBRATE their success with enthusiasm and XP
- Tell them to check out their solution in the Steps panel: "Take a look at your step-by-step solution! 👀"
- DO NOT automatically present a new problem
- Instead, say something like: "When you're ready for another challenge, just let me know!" or "Want to try another one?"
- Wait for the student to explicitly ask for a new problem before presenting one
- This gives them time to review and feel satisfied with their completed work

${kgContextString}

${drawingContextStr}

CRITICAL: MATH VALIDATION
${validationContextStr}
- If math is CORRECT: Praise them, confirm the equation, award XP (+10 XP), and move to next step
- If math is WRONG: Gently guide them to discover the error using Socratic questioning
  - NEVER confirm incorrect answers
  - NEVER say "Excellent!" or "Great!" for wrong answers
  - Ask them to verify the calculation step
  - Use clear counting guidance: "Let's count backwards: 8 (start), 7 (1 away), 6 (2 away), 5 (3 away). So 8 - 3 = ?"
  - Alternative: Use inverse thinking: "What number plus 3 equals 8?"
- When they get the verification question RIGHT: Immediately praise and continue
- When they get it WRONG: Continue guiding, don't ask again yet

GUIDANCE PATTERNS:
- For subtraction: Count backwards showing ALL steps clearly: "8 (start), 7 (1 away), 6 (2 away), 5 (3 away). So 8 - 3 = ?"
- For addition: Count forward showing ALL steps: "9 (start), 10 (1 more), 11 (2 more), 12 (3 more), 13 (4 more), 14 (5 more). So 9 + 5 = ?"
- Alternative: Use inverse thinking: "What number plus 3 equals 8?" or "What number minus 5 equals 7?"
- NEVER use vague counting like "8, 7, 6... what comes after 6?" (too ambiguous!)
- NEVER give the answer directly - always guide them to discover it

RESPONSE FORMAT:
- Start with encouragement or acknowledgment
- If error detected: Gently question the calculation step (don't state it's wrong directly)
- Ask 1-2 open-ended questions to guide them to discover the error
- If correct: Ask next step questions
${hintGuidanceLine}
${stuckTurns >= 2 && kgContext && kgContext.prerequisites && kgContext.prerequisites.length > 0 ? `\n🚨 CRITICAL REMINDER: Student has been stuck for ${stuckTurns} turns. You MUST mention at least one prerequisite topic by name in your response. Look at the KG context above for the specific prerequisite topics to reference. Example: "Remember our foundation with [PREREQUISITE TOPIC NAME]? That helps us here..."\n` : ''}
- ADAPTIVE DIFFICULTY: Adjust your questioning based on mastery level:
  * Low mastery (0-39%): Break into very small steps, provide more explicit guidance
  * Medium mastery (40-79%): Moderate steps, balanced guidance and discovery
  * High mastery (80-100%): Challenge with complex questions, minimal hints
- End with XP reward mention (random: +5, +10, or +15 XP)
- Keep it under 150 words

WHITEBOARD DRAWING CAPABILITY:
- If you want to show a visual explanation, you can include drawing commands in your response
- Format: Use JSON structure like this at the end of your message:
  {"whiteboard": {"commands": [{"type": "draw", "tool": "line", "from": [100, 100], "to": [200, 200], "color": "#ec4899", "strokeWidth": 3}]}}
- Available tools: "line", "circle", "rectangle", "text"
- Colors: Use hex codes matching app theme (pink: #ec4899, purple: #a855f7, cyan: #06b6d4)
- Text tool: {"type": "text", "content": "x = 5", "position": [100, 100], "color": "#ec4899", "fontSize": 20}
- Only include whiteboard commands when a visual diagram would significantly help understanding
- Keep drawing commands simple and focused on the key concept

Remember: You're helping them discover the answer AND catch their own mistakes, not giving it away!`

    // Prepare messages for Grok API
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.map((msg: any) => ({
        role: msg.role,
        content: msg.content
      }))
    ]
    
    // Debug: Log if prerequisite hint should be triggered
    if (process.env.NODE_ENV === 'development' && stuckTurns >= 2 && kgContext && kgContext.prerequisites && kgContext.prerequisites.length > 0) {
      const weakPrereqs = kgContext.prerequisiteMastery?.filter((p: any) => p.mastery < 80) || []
      console.log('[Hint Trigger]', {
        stuckTurns,
        weakPrerequisites: weakPrereqs.map((p: any) => `${p.topic.name} (${p.mastery}%)`),
        systemPromptIncludesHint: systemPrompt.includes('CRITICAL') || systemPrompt.includes('MUST mention'),
        systemPromptLength: systemPrompt.length
      })
    }

    // Try Grok API first
    if (config.grokApiKey) {
      const grokResponse = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.grokApiKey}`
        },
        body: JSON.stringify({
          model: 'grok-beta', // Adjust model name as needed
          messages: messages,
          temperature: 0.7,
          max_tokens: 500,
          stream: false
        })
      })

      if (grokResponse.ok) {
        const grokData = await grokResponse.json()
        let assistantMessage = grokData.choices[0]?.message?.content || 'I apologize, but I had trouble processing that. Could you try rephrasing your question?'
        
        // Extract whiteboard commands if present
        let whiteboardCommands = null
        try {
          const whiteboardMatch = assistantMessage.match(/\{"whiteboard":\s*\{[^}]+\}\}/)
          if (whiteboardMatch) {
            const whiteboardData = JSON.parse(whiteboardMatch[0])
            whiteboardCommands = whiteboardData.whiteboard
            // Remove whiteboard JSON from message
            assistantMessage = assistantMessage.replace(/\{"whiteboard":\s*\{[^}]+\}\}/, '').trim()
          }
        } catch (e) {
          // Ignore parsing errors
        }
        
        // Extract XP amount from response (look for +5, +10, +15 patterns)
        const xpMatch = assistantMessage.match(/\+\s*(\d+)\s*XP/i)
        const xpAmount = xpMatch ? parseInt(xpMatch[1]) : 10 // Default to 10 if not found
        
        const response: any = {
          success: true,
          message: assistantMessage,
          xpReward: xpAmount,
          provider: 'grok',
          sessionId: sessionId,
          timestamp: new Date().toISOString()
        }
        
        if (whiteboardCommands) {
          response.whiteboard = whiteboardCommands
        }
        
        return response
      }
    }

    // Fallback to OpenAI if Grok is not available
    if (config.openaiApiKey) {
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.openaiApiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini', // Cost-effective option
          messages: messages,
          temperature: 0.7,
          max_tokens: 500
        })
      })

      if (openaiResponse.ok) {
        const openaiData = await openaiResponse.json()
        let assistantMessage = openaiData.choices[0]?.message?.content || 'I apologize, but I had trouble processing that. Could you try rephrasing your question?'
        
        // Extract whiteboard commands if present
        let whiteboardCommands = null
        try {
          const whiteboardMatch = assistantMessage.match(/\{"whiteboard":\s*\{[^}]+\}\}/)
          if (whiteboardMatch) {
            const whiteboardData = JSON.parse(whiteboardMatch[0])
            whiteboardCommands = whiteboardData.whiteboard
            // Remove whiteboard JSON from message
            assistantMessage = assistantMessage.replace(/\{"whiteboard":\s*\{[^}]+\}\}/, '').trim()
          }
        } catch (e) {
          // Ignore parsing errors
        }
        
        // Extract XP amount from response
        const xpMatch = assistantMessage.match(/\+\s*(\d+)\s*XP/i)
        const xpAmount = xpMatch ? parseInt(xpMatch[1]) : 10
        
        const response: any = {
          success: true,
          message: assistantMessage,
          xpReward: xpAmount,
          provider: 'openai',
          sessionId: sessionId,
          timestamp: new Date().toISOString()
        }
        
        if (whiteboardCommands) {
          response.whiteboard = whiteboardCommands
        }
        
        return response
      }
    }

    // If no API keys are configured
    throw createError({
      statusCode: 500,
      statusMessage: 'No LLM API configured. Please set GROK_API_KEY or OPENAI_API_KEY in environment variables.'
    })

  } catch (error: any) {
    console.error('Chat API error:', error)
    
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Failed to process chat message. Please try again.'
    })
  }
})
