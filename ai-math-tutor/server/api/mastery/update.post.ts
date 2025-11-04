// Mastery API: Update mastery level for a topic
// Reference: nuxt.com/docs/guide/directory-structure/server - API routes
import { useMastery } from '~/composables/useMastery'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { topicId, masteryLevel, userId, sessionId } = body

  if (!topicId || masteryLevel === undefined) {
    throw createError({
      statusCode: 400,
      statusMessage: 'topicId and masteryLevel are required'
    })
  }

  if (masteryLevel < 0 || masteryLevel > 100) {
    throw createError({
      statusCode: 400,
      statusMessage: 'masteryLevel must be between 0 and 100'
    })
  }

  if (!userId && !sessionId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Either userId or sessionId is required'
    })
  }

  try {
    const { updateMastery } = useMastery()
    const mastery = await updateMastery(topicId, masteryLevel, userId, sessionId)

    if (!mastery) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to update mastery'
      })
    }

    return {
      success: true,
      mastery,
      topicId,
      masteryLevel
    }
  } catch (error: any) {
    console.error('Error updating mastery:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Failed to update mastery'
    })
  }
})

