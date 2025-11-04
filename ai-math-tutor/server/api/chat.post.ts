// Chat API endpoint with Grok LLM integration
// Reference: nuxt.com/docs/guide/directory-structure/server - Server API routes
// Reference: supabase.com/docs/guides/auth - Service key usage
// Reference: prd.md - Socratic prompt engineering guidelines

import { validateMath, formatValidationForLLM } from '../utils/mathValidator'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)
  
  const { message, chatHistory, sessionId, extractedProblem } = body

  if (!message && !extractedProblem) {
    throw createError({
      statusCode: 400,
      statusMessage: 'No message or problem provided'
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
    conversationHistory.push({
      role: 'user',
      content: message || extractedProblem
    })

    // Build Socratic system prompt (kid-friendly, Grok-style)
    let systemPrompt = `You are a fun math quest guide—like a clever sidekick helping students learn math through discovery. Your role is to guide students to solve problems themselves using the Socratic method.

CORE RULES:
- NEVER give direct answers—always ask leading questions
- Spark curiosity: "What clues sparkle here?" "What trick unlocks it?"
- If student is stuck for 2+ turns, provide a gentle hint (frame as "secret scroll")
- Always be upbeat, playful, and encouraging
- Celebrate progress with XP mentions: "+5 XP for that insight!" "+10 XP for trying!"
- Use emojis sparingly but effectively (🎓 🚀 ✨ 🎉)
- Keep responses conversational and age-appropriate (8-18 years old)
- Validate student thinking even if it's not quite right: "Nice thinking! Let's explore that further..."

CRITICAL: MATH VALIDATION
${validationContext ? validationContext + '\n\n' : 'You will receive validation results for student calculations. Follow those instructions exactly.\n\n'}
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
- Optionally provide a hint if they're stuck
- End with XP reward mention (random: +5, +10, or +15 XP)
- Keep it under 150 words

Remember: You're helping them discover the answer AND catch their own mistakes, not giving it away!`

    // Prepare messages for Grok API
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.map((msg: any) => ({
        role: msg.role,
        content: msg.content
      }))
    ]

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
        const assistantMessage = grokData.choices[0]?.message?.content || 'I apologize, but I had trouble processing that. Could you try rephrasing your question?'
        
        // Extract XP amount from response (look for +5, +10, +15 patterns)
        const xpMatch = assistantMessage.match(/\+\s*(\d+)\s*XP/i)
        const xpAmount = xpMatch ? parseInt(xpMatch[1]) : 10 // Default to 10 if not found
        
        return {
          success: true,
          message: assistantMessage,
          xpReward: xpAmount,
          provider: 'grok',
          sessionId: sessionId,
          timestamp: new Date().toISOString()
        }
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
        const assistantMessage = openaiData.choices[0]?.message?.content || 'I apologize, but I had trouble processing that. Could you try rephrasing your question?'
        
        // Extract XP amount from response
        const xpMatch = assistantMessage.match(/\+\s*(\d+)\s*XP/i)
        const xpAmount = xpMatch ? parseInt(xpMatch[1]) : 10
        
        return {
          success: true,
          message: assistantMessage,
          xpReward: xpAmount,
          provider: 'openai',
          sessionId: sessionId,
          timestamp: new Date().toISOString()
        }
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
