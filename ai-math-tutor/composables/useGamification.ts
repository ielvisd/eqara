// Reference: vuejs.org/guide - Composition API patterns
// Reference: supabase.com/docs/guides/realtime - Real-time data patterns

export interface GameState {
  xp: number
  level: number
  badges: string[]
  currentStreak: number
}

export const useGamification = () => {
  // This will be enhanced with Supabase realtime integration
  // For now, it's a basic reactive state structure

  const gameState = ref<GameState>({
    xp: 0,
    level: 1,
    badges: [],
    currentStreak: 0
  })

  const addXP = (amount: number) => {
    gameState.value.xp += amount

    // Simple level calculation - will be enhanced
    gameState.value.level = Math.floor(gameState.value.xp / 100) + 1
  }

  const addBadge = (badgeName: string) => {
    if (!gameState.value.badges.includes(badgeName)) {
      gameState.value.badges.push(badgeName)
    }
  }

  return {
    gameState: readonly(gameState),
    addXP,
    addBadge
  }
}
