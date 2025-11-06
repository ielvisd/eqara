// Vision/OCR API endpoint for processing math problem images
// Reference: openai.com/docs/guides/vision - Vision API usage
// Reference: nuxt.com/docs/guide/directory-structure/server - Server API routes

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  
  // Get the image from the request body
  const body = await readBody(event)
  const { image, imageBase64, canvasSnapshot, context, analyzeDrawing } = body

  // Check if this is a whiteboard drawing analysis request
  const isWhiteboardAnalysis = analyzeDrawing === true && canvasSnapshot

  // Determine image source
  const imageData = canvasSnapshot || imageBase64 || image

  if (!imageData) {
    throw createError({
      statusCode: 400,
      statusMessage: 'No image provided. Please provide either image URL, base64 encoded image, or canvasSnapshot.'
    })
  }

  // If analyzing whiteboard drawing, use enhanced analysis
  if (isWhiteboardAnalysis) {
    return await analyzeWhiteboardDrawing(config, imageData, context)
  }

  try {
    // Try OpenAI Vision API first (most reliable for OCR)
    if (config.openaiApiKey) {
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.openaiApiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o', // GPT-4 with vision capabilities
          messages: [
            {
              role: 'system',
              content: 'You are a math problem OCR specialist. Extract the mathematical problem from the image. Return ONLY the mathematical expression or problem statement in clear, readable format. If you see handwritten or printed math, transcribe it accurately. Include any context like problem numbers or instructions.'
            },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Extract the mathematical problem from this image. Return it in a clear, readable format that can be used for solving.'
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: imageData.startsWith('data:') ? imageData : `data:image/jpeg;base64,${imageData}`
                  }
                }
              ]
            }
          ],
          max_tokens: 500
        })
      })

      if (openaiResponse.ok) {
        const openaiData = await openaiResponse.json()
        const extractedText = openaiData.choices[0]?.message?.content || 'Could not extract text from image'
        
        return {
          success: true,
          extractedProblem: extractedText.trim(),
          provider: 'openai',
          timestamp: new Date().toISOString()
        }
      }
    }

    // Fallback: Try Grok API if OpenAI fails or is not configured
    if (config.grokApiKey) {
      // Note: Grok's vision API format may differ - adjust as needed
      const grokResponse = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.grokApiKey}`
        },
        body: JSON.stringify({
          model: 'grok-beta', // Adjust model name as needed
          messages: [
            {
              role: 'system',
              content: 'You are a math problem OCR specialist. Extract the mathematical problem from the image accurately.'
            },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Extract the mathematical problem from this image.'
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: imageData.startsWith('data:') ? imageData : `data:image/jpeg;base64,${imageData}`
                  }
                }
              ]
            }
          ],
          max_tokens: 500
        })
      })

      if (grokResponse.ok) {
        const grokData = await grokResponse.json()
        const extractedText = grokData.choices[0]?.message?.content || 'Could not extract text from image'
        
        return {
          success: true,
          extractedProblem: extractedText.trim(),
          provider: 'grok',
          timestamp: new Date().toISOString()
        }
      }
    }

    // If no API keys are configured
    throw createError({
      statusCode: 500,
      statusMessage: 'No vision API configured. Please set OPENAI_API_KEY or GROK_API_KEY in environment variables.'
    })

  } catch (error: any) {
    console.error('Vision API error:', error)
    
    // Return user-friendly error
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Failed to process image. Please try again with a clearer image.'
    })
  }
})

// Enhanced analysis for whiteboard drawings
async function analyzeWhiteboardDrawing(
  config: any,
  canvasSnapshot: string,
  context?: {
    currentProblem?: string
    currentStep?: string
    expectedSolution?: string
    topic?: string
  }
) {
  const systemPrompt = `You are a math tutor analyzing a student's handwritten or drawn solution on a whiteboard. Your task is to:

1. Determine if the student's solution is CORRECT or INCORRECT
2. Identify specific errors (arithmetic mistakes, conceptual errors, step omissions)
3. Provide constructive feedback
4. Suggest next steps if incorrect, or acknowledge progress if correct

Be encouraging and pedagogical. Focus on learning, not just correctness.

Return your analysis in a structured JSON format with these fields:
- isCorrect: boolean (true if solution is correct)
- confidence: number (0-100, how confident you are in your assessment)
- errors: string[] (list of specific errors found, empty if correct)
- nextSteps: string[] (suggested next steps or corrections)
- explanation: string (brief explanation of what the student did right or wrong)
- extractedSolution: string (transcribe what you see in the drawing)

${context?.currentProblem ? `Current problem: ${context.currentProblem}` : ''}
${context?.currentStep ? `Current step: ${context.currentStep}` : ''}
${context?.expectedSolution ? `Expected solution: ${context.expectedSolution}` : ''}
${context?.topic ? `Topic: ${context.topic}` : ''}`

  const userPrompt = `Analyze this student's math drawing. Determine if it's correct and provide structured feedback.`

  try {
    // Try OpenAI Vision API first (best for structured analysis)
    if (config.openaiApiKey) {
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.openaiApiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o', // GPT-4 with vision capabilities
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: userPrompt
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: canvasSnapshot.startsWith('data:') ? canvasSnapshot : `data:image/png;base64,${canvasSnapshot}`
                  }
                }
              ]
            }
          ],
          max_tokens: 1000,
          response_format: { type: 'json_object' } // Request JSON response
        })
      })

      if (openaiResponse.ok) {
        const openaiData = await openaiResponse.json()
        const responseText = openaiData.choices[0]?.message?.content || '{}'
        
        try {
          const analysis = JSON.parse(responseText)
          
          return {
            success: true,
            isCorrect: analysis.isCorrect === true,
            confidence: analysis.confidence || 0,
            errors: analysis.errors || [],
            nextSteps: analysis.nextSteps || [],
            explanation: analysis.explanation || '',
            extractedSolution: analysis.extractedSolution || '',
            provider: 'openai',
            timestamp: new Date().toISOString()
          }
        } catch (parseError) {
          // Fallback: try to extract structured info from text response
          const explanation = responseText.trim()
          const isCorrect = /correct|right|yes|✓|✅/i.test(explanation)
          
          return {
            success: true,
            isCorrect: isCorrect,
            confidence: 70,
            errors: isCorrect ? [] : ['Unable to parse specific errors'],
            nextSteps: isCorrect ? [] : ['Review the solution steps'],
            explanation: explanation,
            extractedSolution: '',
            provider: 'openai',
            timestamp: new Date().toISOString()
          }
        }
      }
    }

    // Fallback: Try Grok API
    if (config.grokApiKey) {
      const grokResponse = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.grokApiKey}`
        },
        body: JSON.stringify({
          model: 'grok-beta',
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: userPrompt
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: canvasSnapshot.startsWith('data:') ? canvasSnapshot : `data:image/png;base64,${canvasSnapshot}`
                  }
                }
              ]
            }
          ],
          max_tokens: 1000
        })
      })

      if (grokResponse.ok) {
        const grokData = await grokResponse.json()
        const responseText = grokData.choices[0]?.message?.content || ''
        
        // Try to parse as JSON first
        try {
          const analysis = JSON.parse(responseText)
          return {
            success: true,
            isCorrect: analysis.isCorrect === true,
            confidence: analysis.confidence || 0,
            errors: analysis.errors || [],
            nextSteps: analysis.nextSteps || [],
            explanation: analysis.explanation || '',
            extractedSolution: analysis.extractedSolution || '',
            provider: 'grok',
            timestamp: new Date().toISOString()
          }
        } catch {
          // Fallback text analysis
          const isCorrect = /correct|right|yes|✓|✅/i.test(responseText)
          return {
            success: true,
            isCorrect: isCorrect,
            confidence: 70,
            errors: isCorrect ? [] : ['Unable to parse specific errors'],
            nextSteps: isCorrect ? [] : ['Review the solution steps'],
            explanation: responseText.trim(),
            extractedSolution: '',
            provider: 'grok',
            timestamp: new Date().toISOString()
          }
        }
      }
    }

    // If no API keys are configured
    throw createError({
      statusCode: 500,
      statusMessage: 'No vision API configured for whiteboard analysis. Please set OPENAI_API_KEY or GROK_API_KEY in environment variables.'
    })

  } catch (error: any) {
    console.error('Whiteboard analysis error:', error)
    
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Failed to analyze whiteboard drawing. Please try again.'
    })
  }
}

