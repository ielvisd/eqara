// Shared types for Knowledge Graph and Mastery systems
// Reference: pedagogy.md - Core types for mastery learning

export interface Topic {
  id: string
  name: string
  description: string | null
  difficulty: number
  xp_value: number
  domain: string
  created_at: string
  updated_at: string
}

export interface StudentMastery {
  id: string
  user_id: string | null
  session_id: string | null
  topic_id: string
  mastery_level: number // 0-100
  last_practiced: string | null
  next_review: string | null
  created_at: string
  updated_at: string
  topic?: Topic
}

export interface TopicPrerequisite {
  id: string
  topic_id: string
  prerequisite_id: string
  prerequisite?: Topic
}

export interface TopicEncompassing {
  id: string
  topic_id: string
  encompassed_id: string
  encompassed?: Topic
}


