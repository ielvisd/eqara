// Math validation utility to programmatically verify student calculations
// This prevents relying on LLM to do arithmetic correctly
import { evaluate, create, all } from 'mathjs'

// Configure mathjs to handle common patterns
const math = create(all)

export interface MathValidationResult {
  hasArithmetic: boolean
  isCorrect: boolean | null
  correctAnswer: number | null
  studentAnswer: number | null
  operation: string | null
  question: string | null
}

/**
 * Extract and validate simple arithmetic from student messages
 * Handles patterns like:
 * - "I subtracted 3 from both sides and got 2x=5" → extracts 7-3=4 (correct), student said 5 (wrong)
 * - "6" in response to "what is 8 - 3?" → extracts 8-3=5 (correct), student said 6 (wrong)
 */
export function validateMath(message: string, previousContext?: string[], conversationHistory?: Array<{role: string, content: string}>): MathValidationResult {
  const result: MathValidationResult = {
    hasArithmetic: false,
    isCorrect: null,
    correctAnswer: null,
    studentAnswer: null,
    operation: null,
    question: null
  }

  // Try to extract simple arithmetic from the message
  // Pattern 1: Direct arithmetic question response (e.g., "6" or "the answer is 6")
  const directNumberMatch = message.match(/\b(\d+)\b/)
  
  // Pattern 2: Equation result (e.g., "2x=5" or "got 2x=5")
  const equationMatch = message.match(/(\d+)x\s*=\s*(\d+)/i)
  
  // Pattern 3: Stated calculation (e.g., "I subtracted 3 and got 5")
  const calculationMatch = message.match(/(?:added|subtracted|multiplied|divided|got|equals?|is)\s+(\d+)/i)

  // Check if previous context asks an arithmetic question
  // Look at the most recent assistant message first (most likely to contain the question)
  let contextStr = previousContext?.join(' ') || ''
  
  // If we have conversation history, find the last assistant message
  if (conversationHistory && conversationHistory.length > 0) {
    for (let i = conversationHistory.length - 1; i >= 0; i--) {
      if (conversationHistory[i].role === 'assistant') {
        contextStr = conversationHistory[i].content || ''
        break
      }
    }
  }
  
  // Multiple patterns to catch arithmetic questions
  // Handle multi-line formatting like "7\n+\n5" by normalizing whitespace first
  // Also handle LaTeX formatting like "\( 7 + 5 \\)" or display math "\[ 7 + 5 \]"
  const normalizedContext = contextStr.replace(/\s+/g, ' ').trim()
  
  // Remove LaTeX markers but keep the content for pattern matching
  const contextWithoutLatex = normalizedContext
    .replace(/\\[\(\[]/g, '')
    .replace(/\\?[\)\]]/g, '')
    .replace(/\$\$/g, '')
    .replace(/\$/g, '')
  
  const arithmeticPatterns = [
    // Pattern 1: "what is 8 - 3?" or "what is 7+5?" (works with or without LaTeX)
    /(?:what is|what's|what does|calculate|compute)\s+(\d+)\s*([+\-×*÷/])\s*(\d+)/i,
    // Pattern 2: LaTeX format: "\( 8 - 3 \\)" or "\[ 7 + 5 \]" (already normalized)
    /(\d+)\s*([+\-×*÷/])\s*(\d+)\s*(?:equals?|what|for me|\?)/i,
    // Pattern 3: "8 - 3 = ?" format
    /(\d+)\s*([+\-×*÷/])\s*(\d+)\s*[=\?]/i
  ]
  
  let arithmeticQuestionMatch = null
  for (const pattern of arithmeticPatterns) {
    // Try normalized context (handles multi-line), context without LaTeX, then original
    arithmeticQuestionMatch = normalizedContext.match(pattern) || 
                              contextWithoutLatex.match(pattern) || 
                              contextStr.match(pattern)
    if (arithmeticQuestionMatch) break
  }
  
  if (arithmeticQuestionMatch && directNumberMatch) {
    // We have an arithmetic question in context, and student is answering
    const num1 = parseFloat(arithmeticQuestionMatch[1])
    const operator = arithmeticQuestionMatch[2].replace(/×/, '*').replace(/÷/, '/')
    const num2 = parseFloat(arithmeticQuestionMatch[3])
    
    // Build expression for mathjs: "2 + 3" or "10 - 5"
    const expression = `${num1} ${operator} ${num2}`
    const correctAnswer = evaluateExpression(expression)
    const studentAnswer = parseFloat(directNumberMatch[1])
    
    if (correctAnswer !== null && !isNaN(studentAnswer)) {
      result.hasArithmetic = true
      result.studentAnswer = studentAnswer
      result.correctAnswer = correctAnswer
      result.isCorrect = Math.abs(studentAnswer - correctAnswer) < 0.001 // Handle floating point
      result.operation = `${num1} ${operator} ${num2}`
      result.question = `what is ${num1} ${operator} ${num2}?`
      
      return result
    }
  }

  // Check if student states an equation result (e.g., "5x=6")
  if (equationMatch) {
    const coefficient = parseFloat(equationMatch[1])
    const studentValue = parseFloat(equationMatch[2])
    
    // Try to find the original equation from context using mathjs parsing
    let originalEquation: ParsedEquation | null = null
    let originalEqStr = ''
    
    // First, check conversation history if available
    // Look for the FIRST user message with an equation (original problem)
    if (conversationHistory && conversationHistory.length > 0) {
      // Look through conversation for the original equation (start from beginning for original problem)
      for (let i = 0; i < conversationHistory.length; i++) {
        const msg = conversationHistory[i]
        const content = msg.content || ''
        
        // Prioritize user messages for the original problem
        if (msg.role === 'user') {
          // Try to parse as equation
          originalEquation = parseEquation(content)
          if (originalEquation && originalEquation.isValid) {
            originalEqStr = content
            break
          }
        }
      }
      
      // If no user message had an equation, check all messages (including AI)
      if (!originalEquation) {
        for (let i = conversationHistory.length - 1; i >= 0; i--) {
          const msg = conversationHistory[i]
          const content = msg.content || ''
          
          // Try to parse as equation
          originalEquation = parseEquation(content)
          if (originalEquation && originalEquation.isValid) {
            originalEqStr = content
            break
          }
        }
      }
    }
    
    // Fallback to context string
    if (!originalEquation) {
      originalEquation = parseEquation(contextStr)
      if (originalEquation && originalEquation.isValid) {
        originalEqStr = contextStr
      }
    }
    
    if (originalEquation && originalEquation.isValid) {
      // Check if coefficients match (same variable)
      if (Math.abs(originalEquation.coefficient - coefficient) < 0.001) {
        // Determine what operation student likely performed based on context
        const aiMessage = conversationHistory 
          ? conversationHistory.slice().reverse().find((m: any) => m.role === 'assistant')?.content || ''
          : contextStr
        
        // Check for addition: "add", "+", "plus"
        const mentionsAdd = aiMessage.toLowerCase().includes('add') || 
                          message.toLowerCase().includes('add') ||
                          message.toLowerCase().match(/\+\s*\d+\s+from\s+both\s+sides/i) ||
                          message.toLowerCase().match(/add\s+\d+/i)
        
        // Check for subtraction: "subtract", "-", "minus", or patterns like "-3 from both sides"
        const mentionsSubtract = aiMessage.toLowerCase().includes('subtract') || 
                                message.toLowerCase().includes('subtract') ||
                                message.match(/-\s*\d+\s+from\s+both\s+sides/i) || // "-3 from both sides"
                                message.match(/^-\s*\d+/i) || // "-3" at start
                                message.toLowerCase().match(/subtract\s+\d+/i) ||
                                message.toLowerCase().match(/minus\s+\d+/i)
        
        // Calculate correct result based on operation using mathjs
        let correctValue: number | null = null
        let operationStr = ''
        
        // Priority: If student explicitly mentions an operation, use that
        // Otherwise, infer from context
        if (originalEquation.constantOp === '+' && mentionsSubtract) {
          // Original: 2x+3=11, student subtracted: should be 11-3=8
          operationStr = `${originalEquation.rightSide} - ${originalEquation.constant}`
          correctValue = evaluateExpression(operationStr)
        } else if (originalEquation.constantOp === '+' && !mentionsAdd) {
          // Original: 2x+3=11, if no add mentioned, assume subtraction (most common operation)
          // This handles cases like "-3 from both sides" where subtraction is implied
          operationStr = `${originalEquation.rightSide} - ${originalEquation.constant}`
          correctValue = evaluateExpression(operationStr)
        } else if (originalEquation.constantOp === '-' && mentionsAdd) {
          // Original: 5x-3=2, student added: should be 2+3=5
          operationStr = `${originalEquation.rightSide} + ${originalEquation.constant}`
          correctValue = evaluateExpression(operationStr)
        } else if (originalEquation.constantOp === '-' && !mentionsSubtract) {
          // Original: 5x-3=2, if no subtract mentioned, assume addition
          operationStr = `${originalEquation.rightSide} + ${originalEquation.constant}`
          correctValue = evaluateExpression(operationStr)
        }
        
        if (correctValue !== null) {
          result.hasArithmetic = true
          result.studentAnswer = studentValue
          result.correctAnswer = correctValue
          result.isCorrect = Math.abs(studentValue - correctValue) < 0.001
          result.operation = operationStr
          result.question = `what is ${operationStr}?`
          
          return result
        }
      }
    }
  }

  return result
}

/**
 * Parse equation string to extract components
 * Handles: "5x-3=2", "5x - 3 = 2", "5x-3 = 2", etc.
 */
interface ParsedEquation {
  coefficient: number
  constant: number
  constantOp: '+' | '-'
  rightSide: number
  isValid: boolean
}

function parseEquation(equationStr: string): ParsedEquation | null {
  if (!equationStr) return null
  
  // First, try to extract equation from LaTeX if present
  let normalized = equationStr
  
  // Extract from LaTeX: \( 5x - 3 = 2 \) or \[ 5x - 3 = 2 \]
  const latexMatch = normalized.match(/\\[\(\[]\s*(\d+)x\s*([+\-])\s*(\d+)\s*=\s*(\d+)\s*\\?[\)\]]/i)
  if (latexMatch) {
    normalized = `${latexMatch[1]}x${latexMatch[2]}${latexMatch[3]}=${latexMatch[4]}`
  } else {
    // Normalize spacing for regular text
    normalized = normalized.replace(/\s+/g, ' ').trim()
  }
  
  // Pattern: coefficient x [+-] constant = rightSide
  // Examples: "5x-3=2", "5x - 3 = 2", "10x+5=15"
  // Try multiple patterns to handle spacing variations
  const patterns = [
    /(\d+)x\s*([+\-])\s*(\d+)\s*=\s*(\d+)/i,  // Standard: "5x-3=2" or "5x - 3 = 2"
    /(\d+)x([+\-])(\d+)=(\d+)/i,              // No spaces: "5x-3=2"
    /(\d+)x\s*=\s*(\d+)/i                      // Simple: "5x=5" (no constant, already simplified)
  ]
  
  for (const pattern of patterns) {
    const match = normalized.match(pattern)
    if (match) {
      try {
        // Handle pattern 3 (simple form without constant)
        if (match.length === 3) {
          // This is already simplified, so we can't determine the operation
          // Return null to indicate we need the original equation
          return null
        }
        
        return {
          coefficient: parseFloat(match[1]),
          constant: parseFloat(match[3]),
          constantOp: match[2] === '+' ? '+' : '-',
          rightSide: parseFloat(match[4]),
          isValid: true
        }
      } catch {
        continue
      }
    }
  }
  
  return null
}

/**
 * Safely evaluate arithmetic expressions using mathjs
 */
function evaluateExpression(expression: string): number | null {
  try {
    // Normalize expression for mathjs
    const normalized = expression
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/\s+/g, '')
    
    const result = math.evaluate(normalized)
    return typeof result === 'number' && !isNaN(result) ? result : null
  } catch {
    return null
  }
}

/**
 * Format validation result for LLM context
 */
export function formatValidationForLLM(validation: MathValidationResult): string {
  if (!validation.hasArithmetic) {
    return ''
  }

  if (validation.isCorrect === null) {
    return ''
  }

  if (validation.isCorrect) {
    return `🚨 CRITICAL VALIDATION RESULT 🚨\n\n[STUDENT MATH CHECK: Student correctly calculated ${validation.operation} = ${validation.correctAnswer}. This is CORRECT.\n\nYOU MUST:\n- Explicitly confirm they are correct: "Yes, that's correct!" or "Exactly right!" or "Perfect!"\n- Praise them: "Great job!" or "Well done!"\n- Acknowledge the correct answer: "Yes, ${validation.operation} = ${validation.correctAnswer}"\n- Move to the next step or celebrate completion\n- DO NOT ask them to try again or explore further - they got it right!\n- Award XP and congratulate them]\n\nDO NOT ask them to recalculate or try again - they already have the correct answer!`
  } else {
    return `[STUDENT MATH CHECK: Student said ${validation.operation} = ${validation.studentAnswer}, but the correct answer is ${validation.correctAnswer}. DO NOT confirm their wrong answer. Gently guide them to discover the error using Socratic questioning. Ask them to verify: "${validation.question}" and continue guiding until they get it right.]`
  }
}

