// Mastery API: Get mastery progress for a domain
// Reference: nuxt.com/docs/guide/directory-structure/server - API routes

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const { domain, userId, sessionId } = query

  if (!domain) {
    throw createError({
      statusCode: 400,
      statusMessage: 'domain is required'
    })
  }

  if (!userId && !sessionId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Either userId or sessionId is required'
    })
  }

  try {
    const mastery = useMastery()
    const domainMastery = await mastery.getDomainMastery(
      domain as string,
      userId as string | undefined,
      sessionId as string | undefined
    )

    return {
      success: true,
      domain,
      mastery: domainMastery
    }
  } catch (error: any) {
    console.error('Error fetching domain mastery:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Failed to fetch domain mastery'
    })
  }
})

