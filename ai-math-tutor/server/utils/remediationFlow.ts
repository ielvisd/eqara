// Remediation Flow - Guide students to review prerequisites when struggling
// Reference: pedagogy.md - Remediation: lesson failed twice → prerequisite review
// Reference: tasks.md - PR #4: Socratic Logic with KG Integration

import type { Topic } from '../../composables/types'
import { createClient } from '@supabase/supabase-js'

export interface RemediationContext {
  topicId: string
  sessionId: string
  userId?: string
  stuckTurns: number
  conversationHistory: Array<{ role: string; content: string }>
  currentMastery: number
}

export interface RemediationStatus {
  needsRemediation: boolean
  failureCount: number
  remediationPrerequisites: Topic[]
  inRemediation: boolean
  remediationPhase: 'none' | 'consolidation' | 'prerequisite_review' | 'ready_to_retry'
  message?: string
}

/**
 * Track lesson attempts and failures for remediation
 * In production, this should be stored in a dedicated table
 * For now, we'll use a simple in-memory approach with Supabase as backup
 */
const lessonAttempts = new Map<string, {
  topicId: string
  sessionId: string
  attempts: number
  failures: number
  lastAttempt: Date
  stuckTurnsHistory: number[]
}>()

/**
 * Check if student needs remediation based on performance
 */
export async function checkRemediationStatus(
  context: RemediationContext,
  supabaseUrl?: string,
  supabaseKey?: string
): Promise<RemediationStatus> {
  const { topicId, sessionId, userId, stuckTurns, currentMastery } = context
  
  // Get or create attempt tracking
  const attemptKey = `${sessionId}-${topicId}`
  let attemptData = lessonAttempts.get(attemptKey)
  
  if (!attemptData) {
    attemptData = {
      topicId,
      sessionId,
      attempts: 0,
      failures: 0,
      lastAttempt: new Date(),
      stuckTurnsHistory: []
    }
    lessonAttempts.set(attemptKey, attemptData)
  }
  
  // Update stuck turns history
  attemptData.stuckTurnsHistory.push(stuckTurns)
  attemptData.attempts++
  
  // Determine if this is a "failure"
  // A lesson fails if:
  // 1. Student stuck for 4+ turns (can't make progress)
  // 2. Mastery hasn't improved after multiple attempts (< 40% after 3+ attempts)
  // 3. Explicit "I give up" or similar responses
  
  const isStuckFailure = stuckTurns >= 4
  const isMasteryFailure = attemptData.attempts >= 3 && currentMastery < 40
  const hasGivenUp = checkForGiveUpResponse(context.conversationHistory)
  
  if (isStuckFailure || isMasteryFailure || hasGivenUp) {
    attemptData.failures++
  }
  
  const failureCount = attemptData.failures
  const needsRemediation = failureCount >= 2
  
  // Get prerequisites if remediation is needed
  let remediationPrerequisites: Topic[] = []
  let inRemediation = false
  let remediationPhase: 'none' | 'consolidation' | 'prerequisite_review' | 'ready_to_retry' = 'none'
  
  if (needsRemediation && supabaseUrl && supabaseKey) {
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Get prerequisite topics for review
    const { data: prereqData } = await supabase
      .from('topic_prerequisites')
      .select('prerequisite_id, prerequisite:topics!topic_prerequisites_prerequisite_id_fkey(*)')
      .eq('topic_id', topicId)
    
    if (prereqData) {
      remediationPrerequisites = prereqData.map((p: any) => p.prerequisite).filter(Boolean)
    }
    
    // Check if already working on prerequisites (in remediation)
    if (remediationPrerequisites.length > 0) {
      const { data: masteryData } = await supabase
        .from('student_mastery')
        .select('topic_id, mastery_level, updated_at')
        .eq('session_id', sessionId)
        .is('user_id', userId ? undefined : null)
        .in('topic_id', remediationPrerequisites.map((p: any) => p.id))
        .order('updated_at', { ascending: false })
      
      // Check if prerequisites are being actively reviewed (updated recently)
      const recentActivity = masteryData?.some((m: any) => {
        const updatedAt = new Date(m.updated_at)
        const hoursSince = (Date.now() - updatedAt.getTime()) / (1000 * 60 * 60)
        return hoursSince < 24 // Active in last 24 hours
      })
      
      // Determine phase
      if (failureCount === 2 && !recentActivity) {
        remediationPhase = 'consolidation' // Just failed, needs break
      } else if (recentActivity) {
        remediationPhase = 'prerequisite_review' // Currently reviewing prerequisites
        inRemediation = true
      } else if (masteryData && masteryData.every((m: any) => m.mastery_level >= 80)) {
        remediationPhase = 'ready_to_retry' // Prerequisites reviewed, ready to retry
      } else {
        remediationPhase = 'prerequisite_review'
        inRemediation = true
      }
    }
  }
  
  // Generate appropriate message
  let message: string | undefined
  
  if (needsRemediation) {
    if (remediationPhase === 'consolidation') {
      message = `Hey, you've been working really hard on this topic! 🌟 Sometimes our brains need a little break to let everything sink in. Let's take a moment, then we'll strengthen some foundations that'll make this easier.`
    } else if (remediationPhase === 'prerequisite_review') {
      const prereqNames = remediationPrerequisites.slice(0, 2).map(p => p.name).join(' and ')
      message = `I notice this topic is tricky right now. Let's level up our ${prereqNames} skills first—that'll make this much easier! 🎯`
    } else if (remediationPhase === 'ready_to_retry') {
      message = `Great work on those foundation topics! 🎉 You've built the skills you need. Ready to tackle the original challenge with your new knowledge?`
    }
  }
  
  return {
    needsRemediation,
    failureCount,
    remediationPrerequisites,
    inRemediation,
    remediationPhase,
    message
  }
}

/**
 * Check conversation history for "give up" responses
 */
function checkForGiveUpResponse(history: Array<{ role: string; content: string }>): boolean {
  const recentUserMessages = history
    .filter(msg => msg.role === 'user')
    .slice(-3) // Last 3 user messages
  
  const giveUpPhrases = [
    /i give up/i,
    /i quit/i,
    /this is too hard/i,
    /i can'?t do this/i,
    /i'?m done/i,
    /forget it/i,
    /never mind/i,
    /too difficult/i
  ]
  
  return recentUserMessages.some(msg => 
    giveUpPhrases.some(phrase => phrase.test(msg.content))
  )
}

/**
 * Reset remediation tracking (call when student successfully completes topic)
 */
export function resetRemediationTracking(sessionId: string, topicId: string): void {
  const attemptKey = `${sessionId}-${topicId}`
  lessonAttempts.delete(attemptKey)
}

/**
 * Get current attempt count for a topic
 */
export function getAttemptCount(sessionId: string, topicId: string): number {
  const attemptKey = `${sessionId}-${topicId}`
  return lessonAttempts.get(attemptKey)?.attempts || 0
}

/**
 * Get failure count for a topic
 */
export function getFailureCount(sessionId: string, topicId: string): number {
  const attemptKey = `${sessionId}-${topicId}`
  return lessonAttempts.get(attemptKey)?.failures || 0
}

/**
 * Generate remediation guidance for LLM prompt
 */
export function generateRemediationGuidance(status: RemediationStatus): string {
  if (!status.needsRemediation) return ''
  
  let guidance = '\n\n🚨 REMEDIATION MODE ACTIVE:\n'
  
  if (status.remediationPhase === 'consolidation') {
    guidance += '- Student has failed this lesson twice (stuck pattern detected)\n'
    guidance += '- Recommend a brief consolidation break (5-10 minutes)\n'
    guidance += '- Then guide to prerequisite review before re-attempting\n'
    guidance += '- Be encouraging: "Great effort! Let\'s strengthen foundations first."\n'
  } else if (status.remediationPhase === 'prerequisite_review') {
    guidance += '- Guide student to review prerequisite topics:\n'
    status.remediationPrerequisites.slice(0, 3).forEach((prereq) => {
      guidance += `  • ${prereq.name} (${prereq.domain})\n`
    })
    guidance += '- Focus on building confidence with simpler problems\n'
    guidance += '- Once prerequisites reach 80%+ mastery, can retry original topic\n'
  } else if (status.remediationPhase === 'ready_to_retry') {
    guidance += '- Prerequisites have been reviewed successfully!\n'
    guidance += '- Student is ready to retry the original topic\n'
    guidance += '- Start with confidence-building: "You\'ve got the tools now!"\n'
    guidance += '- Provide maximum scaffolding on first retry\n'
  }
  
  if (status.message) {
    guidance += `\nREMEDIATION MESSAGE TO STUDENT: "${status.message}"\n`
  }
  
  return guidance
}

/**
 * Store remediation attempt in database (for persistent tracking)
 */
export async function storeRemediationAttempt(
  context: RemediationContext,
  status: RemediationStatus,
  supabaseUrl: string,
  supabaseKey: string
): Promise<boolean> {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Store in a simple JSONB column (in production, use dedicated table)
    const attemptData = {
      topic_id: context.topicId,
      session_id: context.sessionId,
      user_id: context.userId || null,
      failure_count: status.failureCount,
      remediation_phase: status.remediationPhase,
      stuck_turns: context.stuckTurns,
      current_mastery: context.currentMastery,
      timestamp: new Date().toISOString()
    }
    
    // Could store in diagnostic_results or a custom remediation_tracking table
    // For now, just log it (in production, implement proper storage)
    console.log('[Remediation Tracking]', attemptData)
    
    return true
  } catch (error) {
    console.error('Error storing remediation attempt:', error)
    return false
  }
}

