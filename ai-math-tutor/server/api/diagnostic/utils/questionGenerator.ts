// Shared diagnostic question generator
// Reference: tasks.md - PR #10: Diagnostic & Placement Quest

// Track questions used per topic to avoid repeats
const usedQuestions = new Map<string, Set<string>>()

// Helper function to randomize array order (Fisher-Yates shuffle)
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

// Generate realistic distractors for addition problems
function generateAdditionDistractors(a: number, b: number, correctAnswer: number): string[] {
  const distractors: number[] = []
  
  // Common error: forget to carry the one (add ones digits incorrectly)
  const onesA = a % 10
  const onesB = b % 10
  const tensA = Math.floor(a / 10)
  const tensB = Math.floor(b / 10)
  
  // Error: forgot to carry - write ones digit without carrying, add tens without the carry
  // Example: 56 + 29, ones: 6+9=15, write 5 (no carry), tens: 5+2=7, result: 75 (wrong, should be 85)
  if (onesA + onesB >= 10) {
    const forgotCarry = (onesA + onesB) % 10 + (tensA + tensB) * 10
    if (forgotCarry !== correctAnswer && !distractors.includes(forgotCarry)) {
      distractors.push(forgotCarry)
    }
  }
  
  // Error: added ones digits incorrectly (e.g., 5+9 = 14 but wrote 4)
  const wrongOnes = (onesA + onesB - 10) + (tensA + tensB + 1) * 10
  if (wrongOnes !== correctAnswer && wrongOnes > 0 && !distractors.includes(wrongOnes)) {
    distractors.push(wrongOnes)
  }
  
  // Error: miscounted by 1 in either direction
  if (!distractors.includes(correctAnswer + 1)) distractors.push(correctAnswer + 1)
  if (!distractors.includes(correctAnswer - 1)) distractors.push(correctAnswer - 1)
  
  // Error: added digits incorrectly (swapped places)
  const swapped = parseInt(String(b) + String(a))
  if (swapped !== correctAnswer && swapped > 0 && !distractors.includes(swapped)) {
    distractors.push(swapped)
  }
  
  // Error: double counted a digit
  const doubleCounted = correctAnswer + (onesA + onesB)
  if (doubleCounted !== correctAnswer && !distractors.includes(doubleCounted)) {
    distractors.push(doubleCounted)
  }
  
  // Add some near-miss values
  const nearMisses = [correctAnswer + 5, correctAnswer - 5, correctAnswer + 10, correctAnswer - 10]
  nearMisses.forEach(nm => {
    if (nm > 0 && nm !== correctAnswer && !distractors.includes(nm)) {
      distractors.push(nm)
    }
  })
  
  // Convert to strings and filter duplicates, ensure we have exactly 4 distractors
  const distractorStrings = [...new Set(distractors.map(d => String(d)))]
    .filter(d => d !== String(correctAnswer))
    .slice(0, 4)
  
  // If we don't have enough, generate some more
  while (distractorStrings.length < 4) {
    const randomOffset = Math.floor(Math.random() * 20) - 10
    const candidate = correctAnswer + randomOffset
    if (candidate > 0 && candidate !== correctAnswer && !distractorStrings.includes(String(candidate))) {
      distractorStrings.push(String(candidate))
    }
  }
  
  return distractorStrings.slice(0, 4)
}

// Generate realistic distractors for subtraction problems
function generateSubtractionDistractors(a: number, b: number, correctAnswer: number): string[] {
  const distractors: number[] = []
  
  // Common error: subtract smaller from larger in wrong order
  const wrongOrder = b - a
  if (wrongOrder !== correctAnswer && wrongOrder > 0 && !distractors.includes(wrongOrder)) {
    distractors.push(wrongOrder)
  }
  
  // Error: forgot to borrow/regroup
  const onesA = a % 10
  const onesB = b % 10
  const tensA = Math.floor(a / 10)
  const tensB = Math.floor(b / 10)
  
  if (onesA < onesB) {
    // Common error: subtract ones without borrowing - try to do onesA - onesB directly
    // This results in a negative number, so students might swap: onesB - onesA
    const forgotBorrowSwap = (onesB - onesA) + (tensA - tensB) * 10
    if (forgotBorrowSwap !== correctAnswer && forgotBorrowSwap > 0 && !distractors.includes(forgotBorrowSwap)) {
      distractors.push(forgotBorrowSwap)
    }
    
    // Another common error: forget to decrease tens after borrowing
    const forgotBorrowDecrease = (onesA - onesB + 10) + (tensA - tensB) * 10
    if (forgotBorrowDecrease !== correctAnswer && forgotBorrowDecrease > 0 && !distractors.includes(forgotBorrowDecrease)) {
      distractors.push(forgotBorrowDecrease)
    }
  }
  
  // Error: off by 1
  if (!distractors.includes(correctAnswer + 1)) distractors.push(correctAnswer + 1)
  if (!distractors.includes(correctAnswer - 1)) distractors.push(correctAnswer - 1)
  
  // Error: added instead of subtracted
  const added = a + b
  if (added !== correctAnswer && !distractors.includes(added)) {
    distractors.push(added)
  }
  
  // Add near-miss values
  const nearMisses = [correctAnswer + 5, correctAnswer - 5, correctAnswer + 10, correctAnswer - 10]
  nearMisses.forEach(nm => {
    if (nm > 0 && nm !== correctAnswer && !distractors.includes(nm)) {
      distractors.push(nm)
    }
  })
  
  const distractorStrings = [...new Set(distractors.map(d => String(d)))]
    .filter(d => d !== String(correctAnswer))
    .slice(0, 4)
  
  while (distractorStrings.length < 4) {
    const randomOffset = Math.floor(Math.random() * 20) - 10
    const candidate = correctAnswer + randomOffset
    if (candidate > 0 && candidate !== correctAnswer && !distractorStrings.includes(String(candidate))) {
      distractorStrings.push(String(candidate))
    }
  }
  
  return distractorStrings.slice(0, 4)
}

// Generate realistic distractors for multiplication problems
function generateMultiplicationDistractors(a: number, b: number, correctAnswer: number): string[] {
  const distractors: number[] = []
  
  // Common error: multiplied digits separately (e.g., 8×6 = 48, but wrote 8×6 = 48 wrong)
  const onesA = a % 10
  const onesB = b % 10
  const tensA = Math.floor(a / 10)
  const tensB = Math.floor(b / 10)
  
  // Error: multiplied tens and ones separately
  if (tensA > 0 && tensB > 0) {
    const separateMultiply = (tensA * tensB * 100) + (onesA * onesB)
    if (separateMultiply !== correctAnswer && !distractors.includes(separateMultiply)) {
      distractors.push(separateMultiply)
    }
  }
  
  // Error: off by a factor
  if (!distractors.includes(correctAnswer + a)) distractors.push(correctAnswer + a)
  if (!distractors.includes(correctAnswer - a)) distractors.push(correctAnswer - a)
  if (!distractors.includes(correctAnswer + b)) distractors.push(correctAnswer + b)
  if (!distractors.includes(correctAnswer - b)) distractors.push(correctAnswer - b)
  
  // Error: added instead of multiplied
  const added = a + b
  if (added !== correctAnswer && !distractors.includes(added)) {
    distractors.push(added)
  }
  
  // Error: off by 1 or 2
  if (!distractors.includes(correctAnswer + 1)) distractors.push(correctAnswer + 1)
  if (!distractors.includes(correctAnswer - 1)) distractors.push(correctAnswer - 1)
  if (!distractors.includes(correctAnswer + 2)) distractors.push(correctAnswer + 2)
  if (!distractors.includes(correctAnswer - 2)) distractors.push(correctAnswer - 2)
  
  const distractorStrings = [...new Set(distractors.map(d => String(d)))]
    .filter(d => d !== String(correctAnswer))
    .slice(0, 4)
  
  while (distractorStrings.length < 4) {
    const randomOffset = Math.floor(Math.random() * 30) - 15
    const candidate = correctAnswer + randomOffset
    if (candidate > 0 && candidate !== correctAnswer && !distractorStrings.includes(String(candidate))) {
      distractorStrings.push(String(candidate))
    }
  }
  
  return distractorStrings.slice(0, 4)
}

// Generate realistic distractors for division problems
function generateDivisionDistractors(a: number, b: number, correctAnswer: number): string[] {
  const distractors: number[] = []
  
  // Error: divided in wrong order
  const wrongOrder = b / a
  if (wrongOrder !== correctAnswer && Number.isInteger(wrongOrder) && !distractors.includes(wrongOrder)) {
    distractors.push(wrongOrder)
  }
  
  // Error: multiplied instead of divided
  const multiplied = a * b
  if (multiplied !== correctAnswer && !distractors.includes(multiplied)) {
    distractors.push(multiplied)
  }
  
  // Error: off by 1
  if (!distractors.includes(correctAnswer + 1)) distractors.push(correctAnswer + 1)
  if (!distractors.includes(correctAnswer - 1)) distractors.push(correctAnswer - 1)
  
  // Error: remainder included
  const withRemainder = Math.floor(a / b) + 1
  if (withRemainder !== correctAnswer && !distractors.includes(withRemainder)) {
    distractors.push(withRemainder)
  }
  
  const distractorStrings = [...new Set(distractors.map(d => String(d)))]
    .filter(d => d !== String(correctAnswer))
    .slice(0, 4)
  
  while (distractorStrings.length < 4) {
    const randomOffset = Math.floor(Math.random() * 10) - 5
    const candidate = correctAnswer + randomOffset
    if (candidate > 0 && candidate !== correctAnswer && !distractorStrings.includes(String(candidate))) {
      distractorStrings.push(String(candidate))
    }
  }
  
  return distractorStrings.slice(0, 4)
}

// Generate distractors with randomization and realistic errors
function generateDistractors(
  operation: 'addition' | 'subtraction' | 'multiplication' | 'division',
  a: number,
  b: number,
  correctAnswer: number
): string[] {
  let distractors: string[]
  
  switch (operation) {
    case 'addition':
      distractors = generateAdditionDistractors(a, b, correctAnswer)
      break
    case 'subtraction':
      distractors = generateSubtractionDistractors(a, b, correctAnswer)
      break
    case 'multiplication':
      distractors = generateMultiplicationDistractors(a, b, correctAnswer)
      break
    case 'division':
      distractors = generateDivisionDistractors(a, b, correctAnswer)
      break
    default:
      distractors = []
  }
  
  // Combine correct answer with distractors and randomize
  const allOptions = [String(correctAnswer), ...distractors]
  return shuffleArray(allOptions)
}

// Dynamic question generators for arithmetic operations
function generateDynamicAdditionQuestion(): any {
  // Generate random 2-digit numbers
  const a = Math.floor(Math.random() * 90) + 10 // 10-99
  const b = Math.floor(Math.random() * 90) + 10 // 10-99
  const correctAnswer = a + b
  
  const options = generateDistractors('addition', a, b, correctAnswer)
  const correctIndex = options.indexOf(String(correctAnswer))
  
  return {
    type: 'multiple_choice',
    question: `What is ${a} + ${b}?`,
    options: options,
    correctAnswer: String(correctAnswer),
    explanation: `Add the ones place: ${a % 10} + ${b % 10} = ${(a % 10) + (b % 10)}${(a % 10) + (b % 10) >= 10 ? ' (write ' + ((a % 10) + (b % 10)) % 10 + ', carry ' + Math.floor(((a % 10) + (b % 10)) / 10) + ')' : ''}. Add the tens place: ${Math.floor(a / 10)} + ${Math.floor(b / 10)}${(a % 10) + (b % 10) >= 10 ? ' + ' + Math.floor(((a % 10) + (b % 10)) / 10) : ''} = ${Math.floor(a / 10) + Math.floor(b / 10) + (Math.floor(((a % 10) + (b % 10)) / 10))}. Answer: ${correctAnswer}`
  }
}

function generateDynamicSubtractionQuestion(): any {
  // Generate random 2-digit numbers where first is larger
  const a = Math.floor(Math.random() * 50) + 30 // 30-79
  const b = Math.floor(Math.random() * 20) + 10 // 10-29
  const correctAnswer = a - b
  
  const options = generateDistractors('subtraction', a, b, correctAnswer)
  
  return {
    type: 'multiple_choice',
    question: `What is ${a} - ${b}?`,
    options: options,
    correctAnswer: String(correctAnswer),
    explanation: `${a} - ${b} = ${correctAnswer}`
  }
}

function generateDynamicMultiplicationQuestion(): any {
  // Generate random single and double digit numbers
  const a = Math.floor(Math.random() * 13) + 1 // 1-13
  const b = Math.floor(Math.random() * 13) + 1 // 1-13
  const correctAnswer = a * b
  
  const options = generateDistractors('multiplication', a, b, correctAnswer)
  
  return {
    type: 'multiple_choice',
    question: `What is ${a} × ${b}?`,
    options: options,
    correctAnswer: String(correctAnswer),
    explanation: `${a} × ${b} = ${correctAnswer}`
  }
}

function generateDynamicDivisionQuestion(): any {
  // Generate division problem with whole number answer
  const divisor = Math.floor(Math.random() * 10) + 2 // 2-11
  const quotient = Math.floor(Math.random() * 10) + 2 // 2-11
  const dividend = divisor * quotient
  
  const options = generateDistractors('division', dividend, divisor, quotient)
  
  return {
    type: 'multiple_choice',
    question: `What is ${dividend} ÷ ${divisor}?`,
    options: options,
    correctAnswer: String(quotient),
    explanation: `${dividend} ÷ ${divisor} = ${quotient}`
  }
}

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
  
  // Check if this topic supports dynamic question generation
  const dynamicTopics: Record<string, () => any> = {
    'Basic Addition': generateDynamicAdditionQuestion,
    'Basic Subtraction': generateDynamicSubtractionQuestion,
    'Basic Multiplication': generateDynamicMultiplicationQuestion,
    'Basic Division': generateDynamicDivisionQuestion
  }
  
  // If topic supports dynamic generation, use it (no need for fixed templates)
  if (dynamicTopics[topic.name]) {
    const question = dynamicTopics[topic.name]()
    // Randomize options if not already randomized
    if (question.options && question.correctAnswer) {
      question.options = shuffleArray(question.options)
    }
    return question
  }
  
  // CCAT-aligned question templates for all 26 Knowledge Graph topics
  // Questions follow CCAT formats: multiple choice with 5 options, predictable patterns
  const topicSpecificTemplates: Record<string, any[]> = {
    // ============================================
    // ARITHMETIC FOUNDATIONS (8 topics)
    // ============================================
    // Note: Basic Addition, Subtraction, Multiplication, Division use dynamic generation above
    // Keeping empty arrays here for reference but they won't be used
    'Basic Addition': [],
    'Basic Subtraction': [],
    'Basic Multiplication': [],
    'Basic Division': [],
    'Order of Operations': [
      { type: 'multiple_choice', question: `What is 2 + 3 × 4?`, options: ['14', '16', '20', '24', '26'], correctAnswer: '14', explanation: 'Order of operations: 3 × 4 = 12, then 2 + 12 = 14' },
      { type: 'multiple_choice', question: `What is (2 + 3) × 4?`, options: ['14', '16', '20', '24', '26'], correctAnswer: '20', explanation: 'Parentheses first: 2 + 3 = 5, then 5 × 4 = 20' },
      { type: 'multiple_choice', question: `What is 10 - 2 × 3?`, options: ['4', '6', '8', '24', '26'], correctAnswer: '4', explanation: 'Multiplication first: 2 × 3 = 6, then 10 - 6 = 4' },
      { type: 'multiple_choice', question: `What is 5 + 4 × 2?`, options: ['13', '14', '18', '20', '22'], correctAnswer: '13', explanation: 'Multiplication first: 4 × 2 = 8, then 5 + 8 = 13' },
      { type: 'multiple_choice', question: `What is (10 - 3) × 2?`, options: ['12', '14', '16', '18', '20'], correctAnswer: '14', explanation: 'Parentheses first: 10 - 3 = 7, then 7 × 2 = 14' }
    ],
    'Mental Math Strategies': [
      { type: 'multiple_choice', question: `What is 25 × 4?`, options: ['90', '95', '100', '105', '110'], correctAnswer: '100', explanation: '25 × 4 = 100' },
      { type: 'multiple_choice', question: `What is 99 + 17?`, options: ['114', '115', '116', '117', '118'], correctAnswer: '116', explanation: '99 + 17 = 116' },
      { type: 'multiple_choice', question: `What is 50 × 2?`, options: ['90', '95', '100', '105', '110'], correctAnswer: '100', explanation: '50 × 2 = 100' },
      { type: 'multiple_choice', question: `What is 75 × 4?`, options: ['290', '295', '300', '305', '310'], correctAnswer: '300', explanation: '75 × 4 = 300' },
      { type: 'multiple_choice', question: `What is 48 + 52?`, options: ['98', '99', '100', '101', '102'], correctAnswer: '100', explanation: '48 + 52 = 100' }
    ],
    'Working with Integers': [
      { type: 'multiple_choice', question: `What is -5 + 8?`, options: ['-13', '-3', '3', '13', '15'], correctAnswer: '3', explanation: '-5 + 8 = 3' },
      { type: 'multiple_choice', question: `What is 12 - 15?`, options: ['-27', '-3', '3', '27', '30'], correctAnswer: '-3', explanation: '12 - 15 = -3' },
      { type: 'multiple_choice', question: `What is -7 - 3?`, options: ['-10', '-4', '4', '10', '12'], correctAnswer: '-10', explanation: '-7 - 3 = -10' },
      { type: 'multiple_choice', question: `What is -4 × 6?`, options: ['-24', '-10', '10', '24', '28'], correctAnswer: '-24', explanation: '-4 × 6 = -24' },
      { type: 'multiple_choice', question: `What is |-8|?`, options: ['-8', '-4', '4', '8', '16'], correctAnswer: '8', explanation: 'The absolute value of -8 is 8' }
    ],
    'Number Properties': [
      { type: 'multiple_choice', question: `Which property is shown: 3 + 5 = 5 + 3?`, options: ['Associative', 'Commutative', 'Distributive', 'Identity', 'Inverse'], correctAnswer: 'Commutative', explanation: 'Commutative property: order doesn\'t matter for addition' },
      { type: 'multiple_choice', question: `Which property is shown: 2 × (3 + 4) = (2 × 3) + (2 × 4)?`, options: ['Associative', 'Commutative', 'Distributive', 'Identity', 'Inverse'], correctAnswer: 'Distributive', explanation: 'Distributive property: multiplication distributes over addition' },
      { type: 'multiple_choice', question: `What is 5 × (2 + 3) using the distributive property?`, options: ['(5 × 2) + 3', '(5 × 2) + (5 × 3)', '5 × 5', '10 + 3', '25'], correctAnswer: '(5 × 2) + (5 × 3)', explanation: 'Distributive: 5 × (2 + 3) = (5 × 2) + (5 × 3) = 10 + 15 = 25' },
      { type: 'multiple_choice', question: `Which shows the associative property?`, options: ['2 + 3 = 3 + 2', '(2 + 3) + 4 = 2 + (3 + 4)', '2 × (3 + 4) = (2 × 3) + (2 × 4)', '2 + 0 = 2', '2 × 1 = 2'], correctAnswer: '(2 + 3) + 4 = 2 + (3 + 4)', explanation: 'Associative property: grouping doesn\'t change the result' },
      { type: 'multiple_choice', question: `What is 4 × (7 + 2) using the distributive property?`, options: ['(4 × 7) + 2', '(4 × 7) + (4 × 2)', '4 × 9', '28 + 2', '36'], correctAnswer: '(4 × 7) + (4 × 2)', explanation: 'Distributive: 4 × (7 + 2) = (4 × 7) + (4 × 2) = 28 + 8 = 36' }
    ],
    
    // ============================================
    // ALGEBRA FUNDAMENTALS (6 topics)
    // ============================================
    'Variables and Expressions': [
      { type: 'multiple_choice', question: `If x = 5, what is x + 7?`, options: ['10', '11', '12', '13', '14'], correctAnswer: '12', explanation: 'Substitute x = 5: 5 + 7 = 12' },
      { type: 'multiple_choice', question: `If y = 8, what is 2y?`, options: ['10', '14', '16', '18', '20'], correctAnswer: '16', explanation: 'Substitute y = 8: 2 × 8 = 16' },
      { type: 'multiple_choice', question: `If a = 6 and b = 4, what is a - b?`, options: ['1', '2', '3', '4', '5'], correctAnswer: '2', explanation: 'Substitute: 6 - 4 = 2' },
      { type: 'multiple_choice', question: `If x = 3, what is 3x + 2?`, options: ['9', '10', '11', '12', '13'], correctAnswer: '11', explanation: 'Substitute x = 3: 3(3) + 2 = 9 + 2 = 11' },
      { type: 'multiple_choice', question: `If m = 7, what is m²?`, options: ['14', '21', '42', '49', '56'], correctAnswer: '49', explanation: 'Substitute m = 7: 7² = 49' }
    ],
    'Linear Equations: One Variable': [
      { type: 'multiple_choice', question: `If x + 5 = 12, what is x?`, options: ['5', '6', '7', '8', '17'], correctAnswer: '7', explanation: 'Subtract 5 from both sides: x + 5 - 5 = 12 - 5, so x = 7' },
      { type: 'multiple_choice', question: `If 2x = 14, what is x?`, options: ['6', '7', '8', '12', '16'], correctAnswer: '7', explanation: 'Divide both sides by 2: 2x ÷ 2 = 14 ÷ 2, so x = 7' },
      { type: 'multiple_choice', question: `If x - 3 = 8, what is x?`, options: ['5', '10', '11', '12', '13'], correctAnswer: '11', explanation: 'Add 3 to both sides: x - 3 + 3 = 8 + 3, so x = 11' },
      { type: 'multiple_choice', question: `If 3x + 2 = 14, what is x?`, options: ['2', '3', '4', '5', '6'], correctAnswer: '4', explanation: 'Subtract 2: 3x = 12, then divide by 3: x = 4' },
      { type: 'multiple_choice', question: `If 5x - 7 = 18, what is x?`, options: ['3', '4', '5', '6', '7'], correctAnswer: '5', explanation: 'Add 7: 5x = 25, then divide by 5: x = 5' }
    ],
    'Linear Equations: Two Variables': [
      { type: 'multiple_choice', question: `If x + y = 10 and x = 4, what is y?`, options: ['4', '5', '6', '7', '8'], correctAnswer: '6', explanation: 'Substitute x = 4: 4 + y = 10, so y = 6' },
      { type: 'multiple_choice', question: `If 2x + y = 15 and x = 5, what is y?`, options: ['3', '4', '5', '6', '7'], correctAnswer: '5', explanation: 'Substitute x = 5: 2(5) + y = 15, so 10 + y = 15, y = 5' },
      { type: 'multiple_choice', question: `If x - y = 3 and x = 8, what is y?`, options: ['3', '4', '5', '6', '7'], correctAnswer: '5', explanation: 'Substitute x = 8: 8 - y = 3, so y = 5' },
      { type: 'multiple_choice', question: `If x + 2y = 12 and x = 4, what is y?`, options: ['3', '4', '5', '6', '7'], correctAnswer: '4', explanation: 'Substitute x = 4: 4 + 2y = 12, so 2y = 8, y = 4' },
      { type: 'multiple_choice', question: `If 3x - y = 10 and x = 4, what is y?`, options: ['1', '2', '3', '4', '5'], correctAnswer: '2', explanation: 'Substitute x = 4: 3(4) - y = 10, so 12 - y = 10, y = 2' }
    ],
    'Equation Solving Strategies': [
      { type: 'multiple_choice', question: `Solve: 4x + 6 = 22`, options: ['3', '4', '5', '6', '7'], correctAnswer: '4', explanation: 'Subtract 6: 4x = 16, then divide by 4: x = 4' },
      { type: 'multiple_choice', question: `Solve: 2x - 5 = 11`, options: ['6', '7', '8', '9', '10'], correctAnswer: '8', explanation: 'Add 5: 2x = 16, then divide by 2: x = 8' },
      { type: 'multiple_choice', question: `Solve: 3x + 4 = 19`, options: ['4', '5', '6', '7', '8'], correctAnswer: '5', explanation: 'Subtract 4: 3x = 15, then divide by 3: x = 5' },
      { type: 'multiple_choice', question: `Solve: 5x - 8 = 17`, options: ['4', '5', '6', '7', '8'], correctAnswer: '5', explanation: 'Add 8: 5x = 25, then divide by 5: x = 5' },
      { type: 'multiple_choice', question: `Solve: x/2 + 3 = 8`, options: ['8', '9', '10', '11', '12'], correctAnswer: '10', explanation: 'Subtract 3: x/2 = 5, then multiply by 2: x = 10' }
    ],
    'Simplifying Expressions': [
      { type: 'multiple_choice', question: `Simplify: 3x + 2x`, options: ['5x', '5x²', '6x', 'x', 'x²'], correctAnswer: '5x', explanation: 'Combine like terms: 3x + 2x = 5x' },
      { type: 'multiple_choice', question: `Simplify: 5y - 2y`, options: ['3y', '3y²', '7y', 'y', '10y'], correctAnswer: '3y', explanation: 'Combine like terms: 5y - 2y = 3y' },
      { type: 'multiple_choice', question: `Simplify: 2(x + 3)`, options: ['2x + 3', '2x + 5', '2x + 6', 'x + 6', '2x² + 6'], correctAnswer: '2x + 6', explanation: 'Distribute: 2(x + 3) = 2x + 6' },
      { type: 'multiple_choice', question: `Simplify: 4a + 3a - 2a`, options: ['5a', '6a', '7a', '9a', '12a'], correctAnswer: '5a', explanation: 'Combine like terms: 4a + 3a - 2a = 5a' },
      { type: 'multiple_choice', question: `Simplify: 3(2x + 1)`, options: ['6x + 1', '6x + 3', '5x + 3', '2x + 3', '6x² + 3'], correctAnswer: '6x + 3', explanation: 'Distribute: 3(2x + 1) = 6x + 3' }
    ],
    'Word Problems to Equations': [
      { type: 'multiple_choice', question: `A number increased by 7 equals 15. Which equation represents this?`, options: ['x + 7 = 15', 'x - 7 = 15', '7x = 15', 'x/7 = 15', 'x = 7 + 15'], correctAnswer: 'x + 7 = 15', explanation: '\"Increased by 7\" means add 7, so x + 7 = 15' },
      { type: 'multiple_choice', question: `Five times a number is 30. Which equation represents this?`, options: ['x + 5 = 30', 'x - 5 = 30', '5x = 30', 'x/5 = 30', '5/x = 30'], correctAnswer: '5x = 30', explanation: '\"Five times a number\" means 5x, so 5x = 30' },
      { type: 'multiple_choice', question: `A number decreased by 4 equals 12. Which equation represents this?`, options: ['x + 4 = 12', 'x - 4 = 12', '4x = 12', 'x/4 = 12', 'x = 4 - 12'], correctAnswer: 'x - 4 = 12', explanation: '\"Decreased by 4\" means subtract 4, so x - 4 = 12' },
      { type: 'multiple_choice', question: `The sum of a number and 9 is 20. Which equation represents this?`, options: ['x + 9 = 20', 'x - 9 = 20', '9x = 20', 'x/9 = 20', 'x = 9 + 20'], correctAnswer: 'x + 9 = 20', explanation: '\"Sum\" means addition, so x + 9 = 20' },
      { type: 'multiple_choice', question: `Three less than a number is 8. Which equation represents this?`, options: ['x + 3 = 8', 'x - 3 = 8', '3x = 8', 'x/3 = 8', '3 - x = 8'], correctAnswer: 'x - 3 = 8', explanation: '\"Three less than\" means subtract 3, so x - 3 = 8' }
    ],
    
    // ============================================
    // PROPORTIONS & RATIOS (6 topics)
    // ============================================
    'Understanding Fractions': [
      { type: 'multiple_choice', question: `What fraction represents 3 out of 4 equal parts?`, options: ['1/4', '2/4', '3/4', '4/3', '4/4'], correctAnswer: '3/4', explanation: '3 out of 4 parts is 3/4' },
      { type: 'multiple_choice', question: `Which fraction is equivalent to 1/2?`, options: ['2/3', '2/4', '3/4', '1/3', '2/5'], correctAnswer: '2/4', explanation: '2/4 simplifies to 1/2 (divide numerator and denominator by 2)' },
      { type: 'multiple_choice', question: `What is 2/5 written as a decimal?`, options: ['0.2', '0.25', '0.4', '0.5', '0.52'], correctAnswer: '0.4', explanation: '2 ÷ 5 = 0.4' },
      { type: 'multiple_choice', question: `Which fraction is largest?`, options: ['1/3', '1/2', '1/4', '1/5', '1/6'], correctAnswer: '1/2', explanation: '1/2 = 0.5, which is larger than the others' },
      { type: 'multiple_choice', question: `What is 3/8 written as a decimal?`, options: ['0.25', '0.3', '0.375', '0.4', '0.5'], correctAnswer: '0.375', explanation: '3 ÷ 8 = 0.375' }
    ],
    'Fraction Operations': [
      { type: 'multiple_choice', question: `What is 1/3 + 1/6?`, options: ['1/2', '2/9', '2/6', '1/9', '1/6'], correctAnswer: '1/2', explanation: 'Find common denominator (6): 2/6 + 1/6 = 3/6 = 1/2' },
      { type: 'multiple_choice', question: `What is 3/4 - 1/4?`, options: ['1/4', '1/2', '2/4', '1/3', '2/8'], correctAnswer: '1/2', explanation: '3/4 - 1/4 = 2/4 = 1/2' },
      { type: 'multiple_choice', question: `What is 2/3 × 3/4?`, options: ['5/7', '6/12', '1/2', '2/4', '3/7'], correctAnswer: '1/2', explanation: 'Multiply numerators and denominators: (2×3)/(3×4) = 6/12 = 1/2' },
      { type: 'multiple_choice', question: `What is 1/2 ÷ 1/4?`, options: ['1/8', '1/4', '1/2', '2', '4'], correctAnswer: '2', explanation: 'Dividing by 1/4 is same as multiplying by 4: 1/2 × 4 = 2' },
      { type: 'multiple_choice', question: `What is 2/5 + 1/10?`, options: ['3/10', '1/2', '3/5', '1/3', '5/10'], correctAnswer: '1/2', explanation: 'Common denominator (10): 4/10 + 1/10 = 5/10 = 1/2' }
    ],
    'Ratios and Rates': [
      { type: 'multiple_choice', question: `If there are 3 red marbles and 5 blue marbles, what is the ratio of red to blue?`, options: ['3:5', '5:3', '3:8', '5:8', '8:3'], correctAnswer: '3:5', explanation: 'Ratio of red to blue is 3:5' },
      { type: 'multiple_choice', question: `A car travels 120 miles in 2 hours. What is the rate in miles per hour?`, options: ['50', '55', '60', '65', '70'], correctAnswer: '60', explanation: 'Rate = distance ÷ time = 120 ÷ 2 = 60 mph' },
      { type: 'multiple_choice', question: `If the ratio of boys to girls is 4:3 and there are 12 boys, how many girls are there?`, options: ['8', '9', '10', '11', '12'], correctAnswer: '9', explanation: 'Ratio 4:3 means for every 4 boys, 3 girls. 12 boys = 3 groups of 4, so 3 groups × 3 = 9 girls' },
      { type: 'multiple_choice', question: `A recipe uses 2 cups of flour for every 3 cups of sugar. What is the ratio?`, options: ['2:3', '3:2', '2:5', '3:5', '5:3'], correctAnswer: '2:3', explanation: 'Ratio of flour to sugar is 2:3' },
      { type: 'multiple_choice', question: `If you can type 60 words in 2 minutes, what is your typing rate?`, options: ['25 words/min', '30 words/min', '35 words/min', '40 words/min', '45 words/min'], correctAnswer: '30 words/min', explanation: 'Rate = 60 words ÷ 2 minutes = 30 words per minute' }
    ],
    'Proportions': [
      { type: 'multiple_choice', question: `If 3 apples cost $1.50, how much do 5 apples cost?`, options: ['$2.00', '$2.25', '$2.50', '$2.75', '$3.00'], correctAnswer: '$2.50', explanation: 'Set up proportion: 3/1.50 = 5/x, so x = (5 × 1.50)/3 = 7.50/3 = $2.50' },
      { type: 'multiple_choice', question: `If 2 out of 5 students are girls, how many girls are in a class of 25?`, options: ['8', '9', '10', '11', '12'], correctAnswer: '10', explanation: 'Proportion: 2/5 = x/25, so x = (2 × 25)/5 = 50/5 = 10' },
      { type: 'multiple_choice', question: `If 4 notebooks cost $6, how much do 6 notebooks cost?`, options: ['$8', '$8.50', '$9', '$9.50', '$10'], correctAnswer: '$9', explanation: 'Proportion: 4/6 = 6/x, so x = (6 × 6)/4 = 36/4 = $9' },
      { type: 'multiple_choice', question: `If 5 cookies contain 200 calories, how many calories in 8 cookies?`, options: ['300', '310', '320', '330', '340'], correctAnswer: '320', explanation: 'Proportion: 5/200 = 8/x, so x = (8 × 200)/5 = 1600/5 = 320' },
      { type: 'multiple_choice', question: `If a map scale is 1 inch = 5 miles, how many miles is 3 inches?`, options: ['12', '13', '14', '15', '16'], correctAnswer: '15', explanation: 'Proportion: 1/5 = 3/x, so x = 3 × 5 = 15 miles' }
    ],
    'Percentages': [
      { type: 'multiple_choice', question: `What is 25% of 80?`, options: ['15', '20', '25', '30', '35'], correctAnswer: '20', explanation: '25% = 0.25, so 0.25 × 80 = 20' },
      { type: 'multiple_choice', question: `What is 30% written as a decimal?`, options: ['0.03', '0.3', '0.33', '3.0', '30'], correctAnswer: '0.3', explanation: '30% = 30/100 = 0.3' },
      { type: 'multiple_choice', question: `What is 0.6 written as a percentage?`, options: ['6%', '60%', '66%', '0.6%', '600%'], correctAnswer: '60%', explanation: '0.6 = 60/100 = 60%' },
      { type: 'multiple_choice', question: `What is 3/4 written as a percentage?`, options: ['34%', '43%', '75%', '85%', '90%'], correctAnswer: '75%', explanation: '3/4 = 0.75 = 75%' },
      { type: 'multiple_choice', question: `What is 15% of 120?`, options: ['15', '18', '20', '22', '25'], correctAnswer: '18', explanation: '15% = 0.15, so 0.15 × 120 = 18' }
    ],
    'Percentage Problems': [
      { type: 'multiple_choice', question: `A shirt costs $40. It's on sale for 20% off. What is the sale price?`, options: ['$28', '$30', '$32', '$34', '$36'], correctAnswer: '32', explanation: '20% of $40 = $8, so sale price = $40 - $8 = $32' },
      { type: 'multiple_choice', question: `If a test has 50 questions and you got 42 correct, what percentage did you get?`, options: ['80%', '82%', '84%', '86%', '88%'], correctAnswer: '84%', explanation: '42/50 = 0.84 = 84%' },
      { type: 'multiple_choice', question: `A price increased from $50 to $60. What is the percent increase?`, options: ['10%', '15%', '20%', '25%', '30%'], correctAnswer: '20%', explanation: 'Increase = $60 - $50 = $10. Percent increase = (10/50) × 100 = 20%' },
      { type: 'multiple_choice', question: `If 30% of a number is 45, what is the number?`, options: ['120', '130', '140', '150', '160'], correctAnswer: '150', explanation: '0.30x = 45, so x = 45 ÷ 0.30 = 150' },
      { type: 'multiple_choice', question: `A store marks up items by 25%. If an item costs $80 to make, what is the selling price?`, options: ['$95', '$100', '$105', '$110', '$115'], correctAnswer: '100', explanation: 'Markup = 25% of $80 = $20, so selling price = $80 + $20 = $100' }
    ],
    
    // ============================================
    // WORD PROBLEMS (6 topics)
    // ============================================
    'Problem Decomposition': [
      { type: 'multiple_choice', question: `To solve "A store has 24 apples. They sell 8 and then get 12 more. How many do they have now?", what is the first step?`, options: ['Add 24 + 8', 'Subtract 8 from 24', 'Multiply 24 × 8', 'Divide 24 ÷ 8', 'Add 8 + 12'], correctAnswer: 'Subtract 8 from 24', explanation: 'First step: subtract the apples sold: 24 - 8 = 16' },
      { type: 'multiple_choice', question: `To solve "Tom has 3 times as many marbles as Sam. Sam has 5 marbles. How many does Tom have?", what operation is needed?`, options: ['Addition', 'Subtraction', 'Multiplication', 'Division', 'Square root'], correctAnswer: 'Multiplication', explanation: 'Tom has 3 times Sam\'s marbles, so multiply: 3 × 5 = 15' },
      { type: 'multiple_choice', question: `A problem says "Divide 48 cookies equally among 6 friends." What operation solves this?`, options: ['Addition', 'Subtraction', 'Multiplication', 'Division', 'Average'], correctAnswer: 'Division', explanation: 'Dividing equally means division: 48 ÷ 6 = 8 cookies each' },
      { type: 'multiple_choice', question: `To solve "Sarah read 15 pages Monday, 20 pages Tuesday, and 25 pages Wednesday. How many total?", what operation?`, options: ['Addition', 'Subtraction', 'Multiplication', 'Division', 'Average'], correctAnswer: 'Addition', explanation: 'Finding total means addition: 15 + 20 + 25 = 60 pages' },
      { type: 'multiple_choice', question: `A problem asks "How much more does item A cost than item B?" What operation finds the answer?`, options: ['Addition', 'Subtraction', 'Multiplication', 'Division', 'Percentage'], correctAnswer: 'Subtraction', explanation: '\"How much more\" means find the difference, so subtract: A - B' }
    ],
    'Identifying Key Information': [
      { type: 'multiple_choice', question: `In "Lisa bought 3 books at $12 each and 2 pens at $3 each. How much did she spend?", what is the key information?`, options: ['3 books, 2 pens', '3 books at $12, 2 pens at $3', 'Books and pens', '$12 and $3', 'Lisa bought items'], correctAnswer: '3 books at $12, 2 pens at $3', explanation: 'Key info: quantities (3, 2) and prices ($12, $3) needed to calculate total' },
      { type: 'multiple_choice', question: `"A train travels 60 miles per hour for 3 hours. How far did it go?" What information is needed?`, options: ['Speed only', 'Time only', 'Speed and time', 'Distance only', 'Speed, time, and distance'], correctAnswer: 'Speed and time', explanation: 'Need speed (60 mph) and time (3 hours) to find distance' },
      { type: 'multiple_choice', question: `"Jake is 3 years older than his sister who is 12. How old is Jake?" What is the key number?`, options: ['3', '12', '15', '3 and 12', '12 and 15'], correctAnswer: '3 and 12', explanation: 'Key numbers: age difference (3) and sister\'s age (12)' },
      { type: 'multiple_choice', question: `"A rectangle has length 8 and width 5. What is the area?" What information is given?`, options: ['Length only', 'Width only', 'Length and width', 'Area only', 'Perimeter'], correctAnswer: 'Length and width', explanation: 'Given: length (8) and width (5) - needed to find area' },
      { type: 'multiple_choice', question: `"If 40% of students are girls and there are 30 students total, how many are girls?" What are the key numbers?`, options: ['40%', '30', '40% and 30', '40 and 30', '40%, 30, and girls'], correctAnswer: '40% and 30', explanation: 'Key info: percentage (40%) and total (30 students)' }
    ],
    'Setting Up Equations from Words': [
      { type: 'multiple_choice', question: `"A number plus 5 equals 12" translates to which equation?`, options: ['x + 5 = 12', 'x - 5 = 12', '5x = 12', 'x/5 = 12', 'x = 5 + 12'], correctAnswer: 'x + 5 = 12', explanation: '\"plus\" means addition, so x + 5 = 12' },
      { type: 'multiple_choice', question: `"Twice a number is 18" translates to which equation?`, options: ['x + 2 = 18', 'x - 2 = 18', '2x = 18', 'x/2 = 18', 'x² = 18'], correctAnswer: '2x = 18', explanation: '\"Twice\" means 2 times, so 2x = 18' },
      { type: 'multiple_choice', question: `"The sum of a number and 7 is 15" translates to which equation?`, options: ['x + 7 = 15', 'x - 7 = 15', '7x = 15', 'x/7 = 15', 'x = 7 + 15'], correctAnswer: 'x + 7 = 15', explanation: '\"Sum\" means addition, so x + 7 = 15' },
      { type: 'multiple_choice', question: `"A number decreased by 4 equals 10" translates to which equation?`, options: ['x + 4 = 10', 'x - 4 = 10', '4x = 10', 'x/4 = 10', '4 - x = 10'], correctAnswer: 'x - 4 = 10', explanation: '\"Decreased by\" means subtraction, so x - 4 = 10' },
      { type: 'multiple_choice', question: `"Half of a number is 9" translates to which equation?`, options: ['x + 2 = 9', 'x - 2 = 9', '2x = 9', 'x/2 = 9', 'x² = 9'], correctAnswer: 'x/2 = 9', explanation: '\"Half\" means divide by 2, so x/2 = 9' }
    ],
    'Solving Word Problems': [
      { type: 'multiple_choice', question: `Tom has 15 marbles. He gives away 6 and then finds 4 more. How many does he have now?`, options: ['11', '12', '13', '14', '15'], correctAnswer: '13', explanation: 'Start with 15, subtract 6: 15 - 6 = 9, then add 4: 9 + 4 = 13' },
      { type: 'multiple_choice', question: `A store has 30 shirts. They sell 12 and receive 8 more. How many shirts now?`, options: ['24', '25', '26', '27', '28'], correctAnswer: '26', explanation: 'Start with 30, subtract 12: 30 - 12 = 18, then add 8: 18 + 8 = 26' },
      { type: 'multiple_choice', question: `Sara reads 25 pages per day for 4 days. How many pages total?`, options: ['95', '98', '100', '102', '105'], correctAnswer: '100', explanation: 'Multiply: 25 × 4 = 100 pages' },
      { type: 'multiple_choice', question: `Mike has $45. He spends $18 on lunch and $12 on a book. How much is left?`, options: ['$13', '$14', '$15', '$16', '$17'], correctAnswer: '$15', explanation: 'Start with $45, subtract $18: $27, then subtract $12: $15' },
      { type: 'multiple_choice', question: `A box holds 6 rows of 8 cookies each. How many cookies total?`, options: ['46', '47', '48', '49', '50'], correctAnswer: '48', explanation: 'Multiply: 6 × 8 = 48 cookies' }
    ],
    'Multi-Step Word Problems': [
      { type: 'multiple_choice', question: `A car rental costs $30 per day plus $0.25 per mile. If you rent for 3 days and drive 200 miles, what is the total cost?`, options: ['$90', '$95', '$100', '$105', '$110'], correctAnswer: '$110', explanation: 'Daily cost: $30 × 3 = $90. Mileage: $0.25 × 200 = $50. Total: $90 + $50 = $110' },
      { type: 'multiple_choice', question: `A class has 24 students. 1/3 are girls. If 2 girls join, how many girls are there now?`, options: ['8', '9', '10', '11', '12'], correctAnswer: '10', explanation: 'Girls: 24 × 1/3 = 8. After 2 join: 8 + 2 = 10' },
      { type: 'multiple_choice', question: `Tom buys 3 shirts at $15 each and gets 20% off. What does he pay?`, options: ['$36', '$38', '$40', '$42', '$45'], correctAnswer: '$36', explanation: 'Original: 3 × $15 = $45. Discount: 20% of $45 = $9. Pay: $45 - $9 = $36' },
      { type: 'multiple_choice', question: `A recipe makes 12 cookies and needs 2 cups flour. How much flour for 30 cookies?`, options: ['4', '4.5', '5', '5.5', '6'], correctAnswer: '5', explanation: 'Proportion: 12 cookies need 2 cups, so 30 cookies need (30/12) × 2 = 2.5 × 2 = 5 cups' },
      { type: 'multiple_choice', question: `Sarah works 8 hours at $12/hour, then 4 hours at $15/hour. What is her total pay?`, options: ['$144', '$148', '$152', '$156', '$160'], correctAnswer: '$156', explanation: 'First job: 8 × $12 = $96. Second job: 4 × $15 = $60. Total: $96 + $60 = $156' }
    ],
    'Verification and Checking': [
      { type: 'multiple_choice', question: `You solved "x + 5 = 12" and got x = 7. How do you check?`, options: ['7 + 5 = 12', '7 - 5 = 12', '7 × 5 = 12', '7 ÷ 5 = 12', '5 + 7 = 12'], correctAnswer: '7 + 5 = 12', explanation: 'Substitute x = 7 back: 7 + 5 = 12. Since 12 = 12, the answer is correct' },
      { type: 'multiple_choice', question: `You found that 20% of 50 is 10. How do you verify?`, options: ['10 × 20 = 50', '10 ÷ 20 = 50', '0.20 × 50 = 10', '50 ÷ 20 = 10', '20 + 10 = 50'], correctAnswer: '0.20 × 50 = 10', explanation: 'Check: 20% = 0.20, so 0.20 × 50 = 10. Since 10 = 10, answer is correct' },
      { type: 'multiple_choice', question: `You calculated 3 × 4 + 2 = 14. How do you verify?`, options: ['3 × 6 = 14', '12 + 2 = 14', '3 × 4 = 14', '4 + 2 = 14', '3 + 8 = 14'], correctAnswer: '12 + 2 = 14', explanation: 'Check step by step: 3 × 4 = 12, then 12 + 2 = 14. Since 14 = 14, answer is correct' },
      { type: 'multiple_choice', question: `You solved "2x = 16" and got x = 8. How do you check?`, options: ['8 + 2 = 16', '8 - 2 = 16', '2 × 8 = 16', '8 ÷ 2 = 16', '2 + 8 = 16'], correctAnswer: '2 × 8 = 16', explanation: 'Substitute x = 8: 2 × 8 = 16. Since 16 = 16, answer is correct' },
      { type: 'multiple_choice', question: `You found 1/2 of 24 is 12. How do you verify?`, options: ['12 × 2 = 24', '12 ÷ 2 = 24', '12 + 12 = 24', '24 - 12 = 24', '12/24 = 24'], correctAnswer: '12 × 2 = 24', explanation: 'Check: 12 × 2 = 24. Since 24 = 24, the answer is correct. Also 1/2 × 24 = 12' }
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

  // Get topic-specific templates (all 26 topics now have templates)
  let availableTemplates = topicSpecificTemplates[topic.name] || []
  
  // Filter out already used questions for this topic
  if (availableTemplates.length > 0) {
    availableTemplates = availableTemplates.filter(t => !usedForTopic.has(t.question))
  }
  
  // If all topic-specific questions used, reset and cycle through them again
  if (availableTemplates.length === 0 && topicSpecificTemplates[topic.name]) {
    console.log('⚠️ [QUESTION GENERATOR] All questions used for topic, resetting:', topic.name)
    usedForTopic.clear()
    availableTemplates = topicSpecificTemplates[topic.name] || []
  }
  
  // If no questions available (topic not in templates), this is an error
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
  
  // Randomize the order of answer options
  if (selectedQuestion.options && selectedQuestion.correctAnswer) {
    selectedQuestion.options = shuffleArray(selectedQuestion.options)
  }
  
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

