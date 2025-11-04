// Chat history composable with Supabase integration
// Reference: supabase.com/docs/guides/realtime - Real-time subscriptions
// Reference: vuejs.org/guide - Composition API patterns

import type { GameState } from './useGamification'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  xpReward?: number
  steps?: string[]
}

export interface ChatSession {
  id: string
  userId?: string
  messages: ChatMessage[]
  createdAt: Date
  updatedAt: Date
}

export const useChatHistory = () => {
  const supabase = useSupabase()
  
  // Generate anonymous session ID
  const getSessionId = (): string => {
    if (process.client) {
      let sessionId = localStorage.getItem('math_tutor_session_id')
      if (!sessionId) {
        sessionId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        localStorage.setItem('math_tutor_session_id', sessionId)
      }
      return sessionId
    }
    return `anon_${Date.now()}`
  }

  // Save message to Supabase
  const saveMessage = async (message: ChatMessage, sessionId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      const { error } = await supabase
        .from('chat_history')
        .insert({
          user_id: user?.id || null,
          session_id: sessionId,
          message: message.content,
          role: message.role,
          created_at: new Date().toISOString()
        })

      if (error) {
        // 404 means table doesn't exist - this is okay for first-time setup
        if (error.code === 'PGRST116' || error.message?.includes('404')) {
          console.warn('chat_history table not found. Messages will not be persisted. Please run the SQL setup in Supabase.')
          return
        }
        console.warn('Error saving message (continuing without persistence):', error)
        // Don't throw - allow offline usage
      }

      // Award XP if this is an assistant message with XP reward
      // Note: XP is handled by the caller using useGamification
      if (message.role === 'assistant' && message.xpReward) {
        // XP will be awarded by the caller, we just save the message
      }
    } catch (error) {
      // Silently handle errors - allow app to work without database
      console.warn('Could not save message (table may not exist yet):', error)
      // Continue gracefully - don't break the chat flow
    }
  }


  // Load chat history from Supabase
  const loadChatHistory = async (sessionId: string): Promise<ChatMessage[]> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      const { data, error } = await supabase
        .from('chat_history')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })

      if (error) {
        // 404 means table doesn't exist - this is okay for first-time setup
        if (error.code === 'PGRST116' || error.message?.includes('404')) {
          console.warn('chat_history table not found. Please run the SQL setup in Supabase.')
          return []
        }
        console.error('Error loading chat history:', error)
        return []
      }

      return (data || []).map((msg: any) => ({
        id: msg.id,
        role: msg.role as 'user' | 'assistant',
        content: msg.message,
        timestamp: new Date(msg.created_at),
        xpReward: undefined // Not stored in DB, will be extracted from messages
      }))
    } catch (error) {
      // Silently handle errors - allow app to work without database
      console.warn('Could not load chat history (table may not exist yet):', error)
      return []
    }
  }

  // Set up realtime subscription for chat updates
  const subscribeToChat = (sessionId: string, callback: (message: ChatMessage) => void) => {
    const channel = supabase
      .channel(`chat:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_history',
          filter: `session_id=eq.${sessionId}`
        },
        (payload: any) => {
          const newMessage: ChatMessage = {
            id: payload.new.id,
            role: payload.new.role as 'user' | 'assistant',
            content: payload.new.message,
            timestamp: new Date(payload.new.created_at),
            xpReward: undefined
          }
          callback(newMessage)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  // Clear chat history and create a new session
  const resetSession = (): string => {
    if (process.client) {
      // Generate a new session ID
      const newSessionId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem('math_tutor_session_id', newSessionId)
      return newSessionId
    }
    return `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Optionally delete messages from Supabase for a session
  const clearChatHistory = async (sessionId: string): Promise<void> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      // Delete all messages for this session
      const { error } = await supabase
        .from('chat_history')
        .delete()
        .eq('session_id', sessionId)
        .eq('user_id', user?.id || null)

      if (error) {
        // 404 means table doesn't exist - this is okay for first-time setup
        if (error.code === 'PGRST116' || error.message?.includes('404')) {
          console.warn('chat_history table not found. Skipping database cleanup.')
          return
        }
        console.warn('Error clearing chat history (continuing anyway):', error)
        // Don't throw - allow reset to work even if DB cleanup fails
      }
    } catch (error) {
      // Silently handle errors - allow reset to work without database
      console.warn('Could not clear chat history (table may not exist yet):', error)
      // Continue gracefully - reset should work even without database
    }
  }

  return {
    getSessionId,
    saveMessage,
    loadChatHistory,
    subscribeToChat,
    resetSession,
    clearChatHistory
  }
}

