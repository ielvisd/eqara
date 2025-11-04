// Mastery API: Check if student can advance to a topic
// Reference: nuxt.com/docs/guide/directory-structure/server - API routes
// Reference: pedagogy.md - 100% mastery before advancement

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const { topicId, userId, sessionId } = query

  if (!topicId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'topicId is required'
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
    const canAdvance = await mastery.canAdvanceToTopic(
      topicId as string,
      userId as string | undefined,
      sessionId as string | undefined
    )

    // Also get prerequisite info
    const prerequisitesMastered = await mastery.arePrerequisitesMastered(
      topicId as string,
      userId as string | undefined,
      sessionId as string | undefined
    )

    const isAlreadyMastered = await mastery.isMastered(
      topicId as string,
      userId as string | undefined,
      sessionId as string | undefined
    )

    return {
      success: true,
      canAdvance,
      prerequisitesMastered,
      isAlreadyMastered,
      topicId
    }
  } catch (error: any) {
    console.error('Error checking advancement:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Failed to check advancement'
    })
  }
})

