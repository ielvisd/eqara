// Reference: vuejs.org/guide - Composition API patterns
// Reference: supabase.com/docs/guides/realtime - Real-time data patterns

export interface GameState {
  xp: number
  level: number
  badges: string[]
  currentStreak: number
}

export const useGamification = () => {
  const supabase = useSupabase()
  const gameState = ref<GameState>({
    xp: 0,
    level: 1,
    badges: [],
    currentStreak: 0
  })

  // Load gamestate from Supabase
  const loadGamestate = async (): Promise<GameState | null> => {
    try {
      if (!process.client) return null
      
      const { data: { user } } = await supabase.auth.getUser()
      const sessionId = process.client ? localStorage.getItem('math_tutor_session_id') : null
      if (!sessionId) return null
      
      let query = supabase.from('gamestate').select('*')
      
      if (user?.id) {
        query = query.eq('user_id', user.id)
      } else {
        query = query.eq('session_id', sessionId)
      }
      
      // Use maybeSingle() instead of single() to handle no rows gracefully
      const { data, error } = await query.maybeSingle()

      // 404 means table doesn't exist - this is okay for first-time setup
      if (error && (error.code === 'PGRST116' || error.message?.includes('404'))) {
        console.warn('gamestate table not found. XP will not persist. Please run the SQL setup in Supabase.')
        return null
      }

      if (data) {
        return {
          xp: data.xp || 0,
          level: data.level || 1,
          badges: data.badges || [],
          currentStreak: data.current_streak || 0
        }
      }
      return null
    } catch (error) {
      // It's okay if no gamestate exists yet or table doesn't exist
      console.warn('Could not load gamestate (table may not exist yet):', error)
      return null
    }
  }

  // Save gamestate to Supabase
  const saveGamestate = async (xpAmount: number) => {
    try {
      if (!process.client) return
      
      const { data: { user } } = await supabase.auth.getUser()
      const sessionId = process.client ? localStorage.getItem('math_tutor_session_id') : null
      if (!sessionId) return
      
      // Get current gamestate
      let query = supabase.from('gamestate').select('*')
      if (user?.id) {
        query = query.eq('user_id', user.id)
      } else {
        query = query.eq('session_id', sessionId)
      }
      
      // Use maybeSingle() instead of single() to handle no rows gracefully
      const { data: currentState } = await query.maybeSingle()

      const newXP = (currentState?.xp || 0) + xpAmount
      const newLevel = Math.floor(newXP / 100) + 1

      if (currentState) {
        // Update existing gamestate
        const { error } = await supabase
          .from('gamestate')
          .update({
            xp: newXP,
            level: newLevel,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentState.id)
        
        if (error) {
          // 404 means table doesn't exist - this is okay for first-time setup
          if (error.code === 'PGRST116' || error.message?.includes('404')) {
            console.warn('gamestate table not found. XP will not persist. Please run the SQL setup in Supabase.')
            return
          }
          console.warn('Error updating gamestate (continuing without persistence):', error)
        }
      } else {
        // Create new gamestate
        const { error } = await supabase
          .from('gamestate')
          .insert({
            user_id: user?.id || null,
            session_id: user?.id ? null : sessionId,
            xp: newXP,
            level: newLevel,
            updated_at: new Date().toISOString()
          })
        
        if (error) {
          // 404 means table doesn't exist - this is okay for first-time setup
          if (error.code === 'PGRST116' || error.message?.includes('404')) {
            console.warn('gamestate table not found. XP will not persist. Please run the SQL setup in Supabase.')
            return
          }
          console.warn('Error creating gamestate (continuing without persistence):', error)
        }
      }
    } catch (error) {
      console.error('Error saving gamestate:', error)
      // Continue gracefully
    }
  }

  // Initialize gamestate from Supabase on mount
  const initializeGamestate = async () => {
    if (!process.client) return
    
    const savedState = await loadGamestate()
    
    if (savedState) {
      gameState.value = savedState
    }
  }

  // Initialize on client-side
  if (process.client) {
    initializeGamestate()
  }

  const addXP = async (amount: number) => {
    gameState.value.xp += amount

    // Simple level calculation
    gameState.value.level = Math.floor(gameState.value.xp / 100) + 1

    // Save to Supabase (async, don't block)
    await saveGamestate(amount).catch(err => {
      console.error('Error saving XP:', err)
      // Continue even if save fails
    })
  }

  const addBadge = async (badgeName: string) => {
    if (!gameState.value.badges.includes(badgeName)) {
      gameState.value.badges.push(badgeName)
      
      // Save to Supabase
      try {
        const { data: { user } } = await supabase.auth.getUser()
        const sessionId = process.client ? localStorage.getItem('math_tutor_session_id') : null
        
        // Use maybeSingle() instead of single() to handle no rows gracefully
        const { data: currentState } = await supabase
          .from('gamestate')
          .select('*')
          .eq(user?.id ? 'user_id' : 'session_id', user?.id || sessionId)
          .maybeSingle()

        if (currentState) {
          await supabase
            .from('gamestate')
            .update({
              badges: gameState.value.badges,
              updated_at: new Date().toISOString()
            })
            .eq('id', currentState.id)
        }
      } catch (error) {
        console.error('Error saving badge:', error)
      }
    }
  }

  return {
    gameState: readonly(gameState),
    addXP,
    addBadge,
    initializeGamestate,
    loadGamestate,
    saveGamestate
  }
}
