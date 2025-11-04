// Knowledge Graph API: Get all topics or topics by domain
// Reference: nuxt.com/docs/guide/directory-structure/server - API routes

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const domain = query.domain as string | undefined

  try {
    const kg = useKnowledgeGraph()
    
    let topics
    if (domain) {
      topics = await kg.getTopicsByDomain(domain)
    } else {
      topics = await kg.getAllTopics()
    }

    return {
      success: true,
      topics,
      count: topics.length,
      domain: domain || 'all'
    }
  } catch (error: any) {
    console.error('Error fetching topics:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to fetch topics'
    })
  }
})

