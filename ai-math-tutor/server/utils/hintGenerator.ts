// Hint Generator - Prerequisite-aware hints for students
// Reference: pedagogy.md - Mastery Learning with scaffolding
// Reference: tasks.md - PR #4: Socratic Logic with KG Integration

import type { Topic } from '../../composables/types'

export interface HintContext {
  currentTopic: Topic
  currentTopicMastery: number
  prerequisites: Topic[]
  prerequisiteMastery: Array<{ topic: Topic; mastery: number }>
  stuckTurns: number
  problemText: string
  conversationHistory: Array<{ role: string; content: string }>
}

export interface GeneratedHint {
  hintText: string
  hintType: 'prerequisite' | 'scaffolding' | 'conceptual' | 'encouragement'
  prerequisiteReferenced?: string
  scaffoldingLevel: 'minimal' | 'moderate' | 'maximum'
}

/**
 * Generate a prerequisite-aware hint for a stuck student
 * This function analyzes the student's KG position and creates targeted hints
 */
export function generatePrerequisiteHint(context: HintContext): GeneratedHint {
  const { currentTopic, currentTopicMastery, prerequisiteMastery, stuckTurns, problemText } = context

  // Find the weakest prerequisite (lowest mastery)
  const weakPrereqs = prerequisiteMastery
    .filter(p => p.mastery < 80)
    .sort((a, b) => a.mastery - b.mastery)

  // Determine scaffolding level based on mastery
  let scaffoldingLevel: 'minimal' | 'moderate' | 'maximum' = 'moderate'
  if (currentTopicMastery >= 80) scaffoldingLevel = 'minimal'
  else if (currentTopicMastery < 40) scaffoldingLevel = 'maximum'

  // If there are weak prerequisites and student is stuck, reference them
  if (weakPrereqs.length > 0 && stuckTurns >= 2) {
    const weakestPrereq = weakPrereqs[0]
    
    return {
      hintText: buildPrerequisiteHintText(weakestPrereq.topic, currentTopic, problemText),
      hintType: 'prerequisite',
      prerequisiteReferenced: weakestPrereq.topic.name,
      scaffoldingLevel
    }
  }

  // If no weak prerequisites but stuck, provide scaffolding hint
  if (stuckTurns >= 2) {
    return {
      hintText: buildScaffoldingHint(currentTopic, scaffoldingLevel, problemText),
      hintType: 'scaffolding',
      scaffoldingLevel
    }
  }

  // Default encouragement hint
  return {
    hintText: buildEncouragementHint(stuckTurns),
    hintType: 'encouragement',
    scaffoldingLevel
  }
}

/**
 * Build hint text that explicitly references a prerequisite topic
 */
function buildPrerequisiteHintText(
  prerequisite: Topic,
  currentTopic: Topic,
  problemText: string
): string {
  const prereqName = prerequisite.name
  const prereqDomain = prerequisite.domain

  // Create domain-specific connections
  const connections: Record<string, string[]> = {
    arithmetic: [
      `Remember our foundation with ${prereqName}? Those skills are the secret key here!`,
      `This builds directly on ${prereqName}—let's use that foundation!`,
      `Think back to ${prereqName}. How did we approach similar problems there?`
    ],
    algebra: [
      `Our work with ${prereqName} gives us the tools we need here!`,
      `This is like ${prereqName}, but with an extra step. What did we learn there?`,
      `Remember the patterns from ${prereqName}? They unlock this puzzle!`
    ],
    proportions: [
      `${prereqName} taught us how to think about relationships. Let's use that here!`,
      `This reminds me of ${prereqName}—same core idea, different numbers!`,
      `Our foundation in ${prereqName} makes this much easier. What was the key insight there?`
    ],
    word_problems: [
      `This is similar to ${prereqName}. What strategy did we use to break it down?`,
      `Remember how we tackled ${prereqName}? Same approach works here!`,
      `Our experience with ${prereqName} prepared us for this! What was our first step there?`
    ]
  }

  const hints = connections[prereqDomain] || connections.arithmetic
  const randomHint = hints[Math.floor(Math.random() * hints.length)]
  
  return `🔑 **Secret Foundation Scroll**: ${randomHint}`
}

/**
 * Build scaffolding hint based on difficulty level
 */
function buildScaffoldingHint(
  currentTopic: Topic,
  scaffoldingLevel: 'minimal' | 'moderate' | 'maximum',
  problemText: string
): string {
  const topicName = currentTopic.name.toLowerCase()
  
  // Extract numbers from problem for contextual hints
  const numbers = problemText.match(/\d+/g) || []
  
  if (scaffoldingLevel === 'maximum') {
    // Very explicit, step-by-step guidance
    if (topicName.includes('equation') || topicName.includes('algebra')) {
      return `🎯 Let's break this into tiny steps:\n1. First, what operation can we do to both sides?\n2. Remember: whatever we do to one side, we do to the other!`
    }
    if (topicName.includes('percent')) {
      return `🎯 Let's tackle this step by step:\n1. What are we trying to find?\n2. Can we write this as a fraction first?`
    }
    return `🎯 Let's go super slow:\n1. What's the very first thing we need to figure out?\n2. Let's do just that one step together!`
  }
  
  if (scaffoldingLevel === 'moderate') {
    // Moderate guidance with 2-3 steps
    if (topicName.includes('equation')) {
      return `💡 Think about:\n• What's our goal? (isolate the variable)\n• What operation helps us get there?`
    }
    if (topicName.includes('percent')) {
      return `💡 Consider:\n• What does the percentage represent?\n• How can we convert this to a calculation?`
    }
    return `💡 Two key questions:\n• What's our goal here?\n• What's the first step toward that goal?`
  }
  
  // Minimal scaffolding - challenge them
  return `🤔 You've got the skills for this! What strategy might work? Think about the pattern...`
}

/**
 * Build encouragement hint when no specific guidance needed
 */
function buildEncouragementHint(stuckTurns: number): string {
  if (stuckTurns === 0) {
    return `✨ You're doing great! Keep that momentum going!`
  }
  
  const encouragements = [
    `💪 You're on the right track—keep thinking through it!`,
    `🌟 I can see your brain working! What's your next move?`,
    `🚀 You've got this! What does your math intuition tell you?`,
    `✨ Great effort! Sometimes the answer is closer than we think.`,
    `🎓 You're building mastery with every attempt! What should we try next?`
  ]
  
  return encouragements[Math.floor(Math.random() * encouragements.length)]
}

/**
 * Determine if a hint should be shown based on context
 */
export function shouldShowHint(context: HintContext): boolean {
  const { stuckTurns, prerequisiteMastery } = context
  
  // Always show hint after 2+ stuck turns
  if (stuckTurns >= 2) return true
  
  // Show hint if student has weak prerequisites (< 60% mastery)
  const hasWeakPrereqs = prerequisiteMastery.some(p => p.mastery < 60)
  if (hasWeakPrereqs && stuckTurns >= 1) return true
  
  return false
}

/**
 * Format hint for display in UI
 */
export function formatHintForUI(hint: GeneratedHint): {
  icon: string
  title: string
  message: string
  color: string
} {
  const formats = {
    prerequisite: {
      icon: '🔑',
      title: 'Foundation Reminder',
      color: 'blue'
    },
    scaffolding: {
      icon: '💡',
      title: 'Helpful Hint',
      color: 'yellow'
    },
    conceptual: {
      icon: '🎯',
      title: 'Key Insight',
      color: 'purple'
    },
    encouragement: {
      icon: '✨',
      title: 'Keep Going!',
      color: 'pink'
    }
  }
  
  const format = formats[hint.hintType]
  
  return {
    icon: format.icon,
    title: format.title,
    message: hint.hintText,
    color: format.color
  }
}

