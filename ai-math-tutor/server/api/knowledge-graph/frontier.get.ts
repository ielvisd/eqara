// Knowledge Graph API: Get knowledge frontier topics
// Reference: nuxt.com/docs/guide/directory-structure/server - API routes
// Reference: pedagogy.md - Knowledge Frontier: boundary between known/unknown

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const userId = query.userId as string | undefined
  const sessionId = query.sessionId as string | undefined

  if (!userId && !sessionId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Either userId or sessionId is required'
    })
  }

  try {
    const { getKnowledgeFrontier } = useKnowledgeGraph()
    const frontierTopics = await getKnowledgeFrontier(userId, sessionId)

    return {
      success: true,
      frontierTopics,
      count: frontierTopics.length,
      userId: userId || null,
      sessionId: sessionId || null
    }
  } catch (error: any) {
    console.error('Error calculating knowledge frontier:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to calculate knowledge frontier'
    })
  }
})

