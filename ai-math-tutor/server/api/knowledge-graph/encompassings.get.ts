// Knowledge Graph API: Get encompassed topics for a topic
// Reference: nuxt.com/docs/guide/directory-structure/server - API routes

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
    const { getEncompassedTopics } = useKnowledgeGraph()
    const encompassedTopics = await getEncompassedTopics(topicId)

    return {
      success: true,
      topicId,
      encompassedTopics,
      count: encompassedTopics.length
    }
  } catch (error: any) {
    console.error('Error fetching encompassed topics:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to fetch encompassed topics'
    })
  }
})

