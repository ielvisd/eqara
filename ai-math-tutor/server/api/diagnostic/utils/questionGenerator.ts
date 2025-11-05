// Shared diagnostic question generator
// Reference: tasks.md - PR #10: Diagnostic & Placement Quest

// Track questions used per topic to avoid repeats
const usedQuestions = new Map<string, Set<string>>()

export async function generateDiagnosticQuestion(topic: any): Promise<any> {
  console.log('📝 [QUESTION GENERATOR] Generating question for topic:', {
    topicId: topic.id,
    topicName: topic.name,
    domain: topic.domain
  })
  
  // Get or create used questions set for this topic
  if (!usedQuestions.has(topic.id)) {
    usedQuestions.set(topic.id, new Set())
  }
  const usedForTopic = usedQuestions.get(topic.id)!
  
  // Simple question templates based on topic name and domain
  // TODO: Enhance with LLM generation for more varied questions
  const topicSpecificTemplates: Record<string, any[]> = {
    'Basic Addition': [
      { type: 'multiple_choice', question: `What is 15 + 27?`, options: ['40', '42', '43', '45', '52'], correctAnswer: '42', explanation: 'Add the ones place: 5 + 7 = 12 (write 2, carry 1). Add the tens place: 1 + 2 + 1 = 4. Answer: 42' },
      { type: 'multiple_choice', question: `What is 23 + 19?`, options: ['40', '41', '42', '43', '44'], correctAnswer: '42', explanation: '23 + 19 = 42' },
      { type: 'multiple_choice', question: `What is 34 + 28?`, options: ['60', '61', '62', '63', '64'], correctAnswer: '62', explanation: '34 + 28 = 62' }
    ],
    'Basic Subtraction': [
      { type: 'multiple_choice', question: `What is 35 - 17?`, options: ['16', '17', '18', '19', '20'], correctAnswer: '18', explanation: '35 - 17 = 18' },
      { type: 'multiple_choice', question: `What is 42 - 19?`, options: ['21', '22', '23', '24', '25'], correctAnswer: '23', explanation: '42 - 19 = 23' },
      { type: 'multiple_choice', question: `What is 56 - 28?`, options: ['26', '27', '28', '29', '30'], correctAnswer: '28', explanation: '56 - 28 = 28' }
    ],
    'Basic Multiplication': [
      { type: 'multiple_choice', question: `What is 8 × 6?`, options: ['46', '48', '50', '52', '54'], correctAnswer: '48', explanation: '8 × 6 = 48' },
      { type: 'multiple_choice', question: `What is 7 × 9?`, options: ['61', '62', '63', '64', '65'], correctAnswer: '63', explanation: '7 × 9 = 63' },
      { type: 'multiple_choice', question: `What is 12 × 4?`, options: ['46', '47', '48', '49', '50'], correctAnswer: '48', explanation: '12 × 4 = 48' }
    ],
    'Basic Division': [
      { type: 'multiple_choice', question: `What is 24 ÷ 3?`, options: ['6', '7', '8', '9', '10'], correctAnswer: '8', explanation: '24 ÷ 3 = 8' },
      { type: 'multiple_choice', question: `What is 36 ÷ 4?`, options: ['7', '8', '9', '10', '11'], correctAnswer: '9', explanation: '36 ÷ 4 = 9' },
      { type: 'multiple_choice', question: `What is 42 ÷ 6?`, options: ['6', '7', '8', '9', '10'], correctAnswer: '7', explanation: '42 ÷ 6 = 7' }
    ],
    'Order of Operations': [
      { type: 'multiple_choice', question: `What is 2 + 3 × 4?`, options: ['14', '16', '20', '24', '26'], correctAnswer: '14', explanation: 'Order of operations: 3 × 4 = 12, then 2 + 12 = 14' },
      { type: 'multiple_choice', question: `What is (2 + 3) × 4?`, options: ['14', '16', '20', '24', '26'], correctAnswer: '20', explanation: 'Parentheses first: 2 + 3 = 5, then 5 × 4 = 20' },
      { type: 'multiple_choice', question: `What is 10 - 2 × 3?`, options: ['4', '6', '8', '24', '26'], correctAnswer: '4', explanation: 'Multiplication first: 2 × 3 = 6, then 10 - 6 = 4' }
    ],
    'Mental Math Strategies': [
      { type: 'multiple_choice', question: `What is 25 × 4?`, options: ['90', '95', '100', '105', '110'], correctAnswer: '100', explanation: '25 × 4 = 100' },
      { type: 'multiple_choice', question: `What is 99 + 17?`, options: ['114', '115', '116', '117', '118'], correctAnswer: '116', explanation: '99 + 17 = 116' },
      { type: 'multiple_choice', question: `What is 50 × 2?`, options: ['90', '95', '100', '105', '110'], correctAnswer: '100', explanation: '50 × 2 = 100' }
    ]
  }
  
  const templates: Record<string, any[]> = {
    arithmetic: [
      {
        type: 'multiple_choice',
        question: `What is 15 + 27?`,
        options: ['40', '42', '43', '45', '52'],
        correctAnswer: '42',
        explanation: 'Add the ones place: 5 + 7 = 12 (write 2, carry 1). Add the tens place: 1 + 2 + 1 = 4. Answer: 42'
      },
      {
        type: 'multiple_choice',
        question: `What is 8 × 6?`,
        options: ['46', '48', '50', '52', '54'],
        correctAnswer: '48',
        explanation: '8 × 6 = 48'
      },
      {
        type: 'multiple_choice',
        question: `What is 24 ÷ 3?`,
        options: ['6', '7', '8', '9', '10'],
        correctAnswer: '8',
        explanation: '24 ÷ 3 = 8'
      },
      {
        type: 'multiple_choice',
        question: `What is 35 - 17?`,
        options: ['16', '17', '18', '19', '20'],
        correctAnswer: '18',
        explanation: '35 - 17 = 18'
      }
    ],
    algebra: [
      {
        type: 'multiple_choice',
        question: `If x + 5 = 12, what is x?`,
        options: ['5', '6', '7', '8', '17'],
        correctAnswer: '7',
        explanation: 'Subtract 5 from both sides: x + 5 - 5 = 12 - 5, so x = 7'
      },
      {
        type: 'multiple_choice',
        question: `If 2x = 14, what is x?`,
        options: ['6', '7', '8', '12', '16'],
        correctAnswer: '7',
        explanation: 'Divide both sides by 2: 2x ÷ 2 = 14 ÷ 2, so x = 7'
      },
      {
        type: 'multiple_choice',
        question: `If x - 3 = 8, what is x?`,
        options: ['5', '10', '11', '12', '13'],
        correctAnswer: '11',
        explanation: 'Add 3 to both sides: x - 3 + 3 = 8 + 3, so x = 11'
      }
    ],
    proportions: [
      {
        type: 'multiple_choice',
        question: `If 3 out of 5 students passed, what percentage passed?`,
        options: ['50%', '55%', '60%', '65%', '70%'],
        correctAnswer: '60%',
        explanation: '3/5 = 0.6 = 60%'
      },
      {
        type: 'multiple_choice',
        question: `If a recipe calls for 2 cups of flour for 4 servings, how many cups for 8 servings?`,
        options: ['3', '4', '5', '6', '8'],
        correctAnswer: '4',
        explanation: 'Double the servings: 2 × 2 = 4 cups'
      }
    ],
    word_problems: [
      {
        type: 'multiple_choice',
        question: `A group of 3 numbers has an average of 17. The first two numbers are 12 and 19. What is the third number?`,
        options: ['17', '19', '20', '23', '30'],
        correctAnswer: '20',
        explanation: 'If average is 17, sum is 17 × 3 = 51. First two sum to 12 + 19 = 31. Third number is 51 - 31 = 20'
      }
    ]
  }

  // Try topic-specific templates first
  let availableTemplates = topicSpecificTemplates[topic.name] || []
  
  // Filter out already used questions for this topic
  if (availableTemplates.length > 0) {
    availableTemplates = availableTemplates.filter(t => !usedForTopic.has(t.question))
  }
  
  // If all topic-specific questions used, reset and cycle through them again
  // DO NOT fall back to domain templates - they may contain questions from other topics
  if (availableTemplates.length === 0) {
    console.log('⚠️ [QUESTION GENERATOR] All questions used for topic, resetting:', topic.name)
    usedForTopic.clear()
    availableTemplates = topicSpecificTemplates[topic.name] || []
  }
  
  // If still no questions available (topic not in templates), this is an error
  if (availableTemplates.length === 0) {
    console.error('🚨 [QUESTION GENERATOR] No questions available for topic:', topic.name)
    throw new Error(`No questions available for topic: ${topic.name}. Please add questions to topicSpecificTemplates.`)
  }
  
  const randomIndex = Math.floor(Math.random() * availableTemplates.length)
  const selectedQuestion = availableTemplates[randomIndex]
  
  // Validate that the selected question matches the topic
  // Check if question contains topic-specific keywords or operations
  const topicNameLower = topic.name.toLowerCase()
  const questionText = selectedQuestion.question.toLowerCase()
  
  // Basic validation: ensure question type matches topic
  const isValid = validateQuestionTopicMatch(topicNameLower, questionText, selectedQuestion.question)
  
  if (!isValid) {
    console.warn('⚠️ [QUESTION GENERATOR] Question may not match topic:', {
      topic: topic.name,
      question: selectedQuestion.question
    })
  }
  
  // Mark this question as used for this topic
  usedForTopic.add(selectedQuestion.question)
  
  console.log('✅ [QUESTION GENERATOR] Selected question:', {
    topicName: topic.name,
    question: selectedQuestion.question,
    usedCount: usedForTopic.size,
    isValid
  })
  
  return selectedQuestion
}

// Helper function to validate question matches topic
function validateQuestionTopicMatch(topicName: string, questionText: string, questionFull: string): boolean {
  // Check for topic-specific keywords
  if (topicName.includes('addition') || topicName.includes('add')) {
    return questionText.includes('+') || questionFull.includes('+')
  }
  if (topicName.includes('subtraction') || topicName.includes('subtract')) {
    return questionText.includes('-') || questionFull.includes('-')
  }
  if (topicName.includes('multiplication') || topicName.includes('multiply')) {
    return questionText.includes('×') || questionText.includes('*') || questionFull.includes('×') || questionFull.includes('*')
  }
  if (topicName.includes('division') || topicName.includes('divide')) {
    return questionText.includes('÷') || questionText.includes('/') || questionFull.includes('÷') || questionFull.includes('/')
  }
  if (topicName.includes('order of operations')) {
    return questionText.includes('×') || questionText.includes('+') || questionText.includes('-') || questionText.includes('(')
  }
  // For other topics, assume valid if we got here (from topic-specific templates)
  return true
}

// Generate quiz question (reuse diagnostic logic with adjusted difficulty)
export async function generateQuizQuestion(topic: any, masteryLevel: number): Promise<any> {
  // For quiz questions, we can reuse the diagnostic question generator
  // but adjust difficulty based on mastery level
  const baseQuestion = await generateDiagnosticQuestion(topic)
  
  // Could enhance this to adjust question difficulty based on mastery
  // For now, use the same questions as diagnostic
  return baseQuestion
}

