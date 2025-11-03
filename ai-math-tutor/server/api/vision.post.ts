// Vision/OCR API endpoint for processing math problem images
// Reference: openai.com/docs/guides/vision - Vision API usage
// Reference: nuxt.com/docs/guide/directory-structure/server - Server API routes

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  
  // Get the image from the request body
  const body = await readBody(event)
  const { image, imageBase64 } = body

  if (!imageBase64 && !image) {
    throw createError({
      statusCode: 400,
      statusMessage: 'No image provided. Please provide either image URL or base64 encoded image.'
    })
  }

  // Use base64 if provided, otherwise use image URL
  const imageData = imageBase64 || image

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

