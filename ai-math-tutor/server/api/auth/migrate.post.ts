import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig()
    const body = await readBody(event)
    const { sessionId, userId } = body

    // Validate inputs
    if (!sessionId || !userId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Both sessionId and userId are required'
      })
    }

    // Create Supabase client with service role key (bypasses RLS)
    const supabase = createClient(
      config.public.supabaseUrl as string,
      config.supabaseServiceKey as string,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    console.log(`Starting data migration for sessionId: ${sessionId} -> userId: ${userId}`)

    // Track migration results
    const results = {
      chatHistory: 0,
      gamestate: 0,
      studentMastery: 0,
      diagnosticResults: 0,
      quizSessions: 0
    }

    // 1. Migrate chat_history
    const { data: chatData, error: chatError } = await supabase
      .from('chat_history')
      .update({ user_id: userId, session_id: null })
      .eq('session_id', sessionId)
      .is('user_id', null)
      .select()

    if (chatError) {
      console.error('Chat history migration error:', chatError)
    } else {
      results.chatHistory = chatData?.length || 0
      console.log(`Migrated ${results.chatHistory} chat history records`)
    }

    // 2. Migrate gamestate (merge XP if user already has gamestate)
    const { data: existingGamestate } = await supabase
      .from('gamestate')
      .select('*')
      .eq('user_id', userId)
      .single()

    const { data: anonymousGamestate } = await supabase
      .from('gamestate')
      .select('*')
      .eq('session_id', sessionId)
      .is('user_id', null)
      .single()

    if (anonymousGamestate) {
      if (existingGamestate) {
        // Merge: add anonymous XP to existing XP, recalculate level
        const totalXP = (existingGamestate.xp || 0) + (anonymousGamestate.xp || 0)
        const newLevel = Math.floor(totalXP / 100) + 1
        const maxStreak = Math.max(existingGamestate.streak || 0, anonymousGamestate.streak || 0)

        const { error: mergeError } = await supabase
          .from('gamestate')
          .update({
            xp: totalXP,
            level: newLevel,
            streak: maxStreak
          })
          .eq('user_id', userId)

        if (!mergeError) {
          results.gamestate = 1
          console.log(`Merged gamestate: ${anonymousGamestate.xp} XP added to existing ${existingGamestate.xp} XP`)
        }

        // Delete anonymous gamestate
        await supabase
          .from('gamestate')
          .delete()
          .eq('session_id', sessionId)
          .is('user_id', null)
      } else {
        // No existing gamestate, just migrate
        const { data: gamestateData, error: gamestateError } = await supabase
          .from('gamestate')
          .update({ user_id: userId, session_id: null })
          .eq('session_id', sessionId)
          .is('user_id', null)
          .select()

        if (!gamestateError) {
          results.gamestate = gamestateData?.length || 0
          console.log(`Migrated ${results.gamestate} gamestate records`)
        }
      }
    }

    // 3. Migrate student_mastery (keep highest mastery level for conflicts)
    const { data: anonymousMastery } = await supabase
      .from('student_mastery')
      .select('*')
      .eq('session_id', sessionId)
      .is('user_id', null)

    if (anonymousMastery && anonymousMastery.length > 0) {
      for (const record of anonymousMastery) {
        // Check if user already has mastery for this topic
        const { data: existingMastery } = await supabase
          .from('student_mastery')
          .select('*')
          .eq('user_id', userId)
          .eq('topic_id', record.topic_id)
          .single()

        if (existingMastery) {
          // Keep highest mastery level
          if (record.mastery_level > existingMastery.mastery_level) {
            await supabase
              .from('student_mastery')
              .update({
                mastery_level: record.mastery_level,
                last_practiced: record.last_practiced,
                next_review: record.next_review
              })
              .eq('user_id', userId)
              .eq('topic_id', record.topic_id)
            
            results.studentMastery++
          }

          // Delete anonymous record
          await supabase
            .from('student_mastery')
            .delete()
            .eq('id', record.id)
        } else {
          // No conflict, migrate directly
          const { error: masteryError } = await supabase
            .from('student_mastery')
            .update({ user_id: userId, session_id: null })
            .eq('id', record.id)

          if (!masteryError) {
            results.studentMastery++
          }
        }
      }
      console.log(`Migrated ${results.studentMastery} student mastery records`)
    }

    // 4. Migrate diagnostic_results
    const { data: diagnosticData, error: diagnosticError } = await supabase
      .from('diagnostic_results')
      .update({ user_id: userId, session_id: null })
      .eq('session_id', sessionId)
      .is('user_id', null)
      .select()

    if (diagnosticError) {
      console.error('Diagnostic results migration error:', diagnosticError)
    } else {
      results.diagnosticResults = diagnosticData?.length || 0
      console.log(`Migrated ${results.diagnosticResults} diagnostic results`)
    }

    // 5. Migrate quiz_sessions
    const { data: quizData, error: quizError } = await supabase
      .from('quiz_sessions')
      .update({ user_id: userId, session_id: null })
      .eq('session_id', sessionId)
      .is('user_id', null)
      .select()

    if (quizError) {
      console.error('Quiz sessions migration error:', quizError)
    } else {
      results.quizSessions = quizData?.length || 0
      console.log(`Migrated ${results.quizSessions} quiz sessions`)
    }

    console.log('Migration complete:', results)

    return {
      success: true,
      message: 'Data migration completed successfully',
      results
    }
  } catch (error: any) {
    console.error('Migration error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to migrate data'
    })
  }
})

