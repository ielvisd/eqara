// Mastery API: Get mastery for a topic or all topics
// Reference: nuxt.com/docs/guide/directory-structure/server - API routes
import { useMastery } from '~/composables/useMastery'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const { topicId, userId, sessionId } = query

  if (!userId && !sessionId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Either userId or sessionId is required'
    })
  }

  try {
    const mastery = useMastery()

    if (topicId) {
      // Get mastery for specific topic
      const topicMastery = await mastery.getTopicMastery(
        topicId as string,
        userId as string | undefined,
        sessionId as string | undefined
      )

      return {
        success: true,
        mastery: topicMastery,
        topicId
      }
    } else {
      // Get all mastery records
      const allMastery = await mastery.getAllMastery(
        userId as string | undefined,
        sessionId as string | undefined
      )

      return {
        success: true,
        mastery: allMastery,
        count: allMastery.length
      }
    }
  } catch (error: any) {
    console.error('Error fetching mastery:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Failed to fetch mastery'
    })
  }
})

