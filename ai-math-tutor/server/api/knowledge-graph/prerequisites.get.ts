// Knowledge Graph API: Get prerequisites for a topic
// Reference: nuxt.com/docs/guide/directory-structure/server - API routes
import { useKnowledgeGraph } from '~/composables/useKnowledgeGraph'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const topicId = query.topicId as string

  if (!topicId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'topicId is required'
    })
  }

  try {
    const { getPrerequisites } = useKnowledgeGraph()
    const prerequisites = await getPrerequisites(topicId)

    return {
      success: true,
      topicId,
      prerequisites,
      count: prerequisites.length
    }
  } catch (error: any) {
    console.error('Error fetching prerequisites:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to fetch prerequisites'
    })
  }
})

