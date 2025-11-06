// KaTeX composable for rendering LaTeX math
import katex from 'katex'
import 'katex/dist/katex.min.css'

// Extract all steps with operations for visual step-by-step display
export interface Step {
  equation: string
  operation: string | null
  operationSymbol: string | null
  operationValue: number | null
  isCorrect: boolean // All steps shown should be correct (AI-confirmed)
}

export const useKaTeX = () => {
  // Render LaTeX string to HTML
  const renderMath = (text: string, displayMode: boolean = false): string => {
    try {
      // Replace \( and \) with $ for inline math
      // Replace \[ and \] with $$ for display math
      let processed = text
      
      // Handle display math \[ ... \]
      processed = processed.replace(/\\\[([\s\S]*?)\\\]/g, (match, content) => {
        try {
          return katex.renderToString(content.trim(), { displayMode: true, throwOnError: false })
        } catch {
          return match
        }
      })
      
      // Handle inline math \( ... \)
      processed = processed.replace(/\\\(([\s\S]*?)\\\)/g, (match, content) => {
        try {
          return katex.renderToString(content.trim(), { displayMode: false, throwOnError: false })
        } catch {
          return match
        }
      })
      
      // Handle $ ... $ for inline
      processed = processed.replace(/\$([^\$]+)\$/g, (match, content) => {
        try {
          return katex.renderToString(content.trim(), { displayMode: false, throwOnError: false })
        } catch {
          return match
        }
      })
      
      // Handle $$ ... $$ for display
      processed = processed.replace(/\$\$([\s\S]*?)\$\$/g, (match, content) => {
        try {
          return katex.renderToString(content.trim(), { displayMode: true, throwOnError: false })
        } catch {
          return match
        }
      })
      
      return processed
    } catch (error) {
      console.warn('KaTeX rendering error:', error)
      return text
    }
  }

  // Find the start index of the current problem (most recent user message with an equation)
  const findCurrentProblemStart = (messages: Array<{role: string, content: string} | any>): number => {
    if (messages.length === 0) return 0
    
    // Look backwards through messages to find the most recent problem start
    // This could be a user message with an equation OR an AI message presenting a practice problem
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i]
      const content = msg.content || ''
      
      if (msg.role === 'user') {
        // Check for learning requests that might precede an AI-generated problem
        const learningRequest = content.match(/(?:i want to learn|practice|give me a problem|can you give me)/i)
        if (learningRequest && i + 1 < messages.length && messages[i + 1].role === 'assistant') {
          // Check if the next message (AI response) contains a problem
          const nextContent = messages[i + 1].content || ''
          if (nextContent.match(/(?:problem|equation|solve|calculate|what is)/i)) {
            return i + 1 // Start from the AI's problem presentation
          }
        }
        
        // Skip equations that appear in step descriptions (not new problems)
        // Look for indicators that this is describing a step, not stating a new problem
        // Check for phrases that indicate the equation is a result of an operation
        const isStepDescription = /(?:to get|we have|now we have|so we have|which gives|resulting in|we get|gives us|(?:subtract|add|multiply|divide).*(?:from|to) both sides)/i.test(content)
        
        // Check for equation patterns: "4x-2 = 10", "4x+2 = 12", "2x+7=3", etc.
        // Pattern matches: coefficient*x +/- constant = number
        const equationMatch = content.match(/(\d+x\s*[+\-]\s*\d+\s*=\s*\d+)/i)
        if (equationMatch && !isStepDescription) {
          return i
        }
        
        // Also match simpler forms: "4x = 10", "2x=5", etc.
        // But skip if it's in a step description context
        const simpleMatch = content.match(/(\d+x\s*=\s*\d+)/i)
        if (simpleMatch && !isStepDescription) {
          return i
        }
        
        // Look for LaTeX equations in user messages
        const latexMatch = content.match(/\\[\(\[]([^\)\]]*?[+\-].*?=.*?)\\?[\)\]]/)
        if (latexMatch) {
          return i
        }
        
        // Match basic arithmetic: "8-3", "15+7", "12*4", "20/5", etc.
        // This should be a short expression (to avoid matching random numbers in text)
        const arithmeticMatch = content.match(/^\s*(\d+\s*[\+\-\*\/×÷]\s*\d+)\s*(?:=\s*\??)?\s*$/)
        if (arithmeticMatch) {
          return i
        }
      }
      
      // Check for AI-generated arithmetic problems like "Here's an equation: 7 + 4 = ?" or "What is 7+5?"
      if (msg.role === 'assistant') {
        // Pattern 1: "What is 7+5?" or "What is 7 + 5?"
        const whatIsMatch = content.match(/(?:what is|what's|calculate|compute)\s+(\d+\s*[\+\-\*\/×÷]\s*\d+)/i)
        if (whatIsMatch) {
          return i
        }
        // Pattern 2: "7 + 4 = ?" format
        const aiArithmeticMatch = content.match(/(\d+\s*[\+\-\*\/×÷]\s*\d+\s*=\s*\?)/)
        if (aiArithmeticMatch) {
          return i
        }
        // Pattern 3: LaTeX format with arithmetic "\( 7 + 5 \\)" in question context
        const latexArithmeticMatch = content.match(/\\[\(\[]\s*(\d+\s*[\+\-\*\/×÷]\s*\d+)\s*\\?[\)\]]/)
        if (latexArithmeticMatch && /what is|what's|calculate|compute|problem|practice/i.test(content)) {
          return i
        }
      }
    }
    
    // Fallback: if no equation found, return 0 (show all messages)
    return 0
  }

  // Extract current equation from messages (should be the ORIGINAL problem)
  const extractCurrentEquation = (messages: Array<{role: string, content: string} | any>): string | null => {
    // First, look for the FIRST user message with an equation (original problem)
    // This is typically the first math problem stated
    for (let i = 0; i < Math.min(messages.length, 5); i++) {
      const msg = messages[i]
      
      // Prioritize user messages for the original problem
      if (msg.role === 'user') {
        // Skip equations that appear in step descriptions (not original problems)
        // Look for indicators that this is describing a step, not stating a new problem
        // Check for phrases that indicate the equation is a result of an operation
        const isStepDescription = /(?:to get|we have|now we have|so we have|which gives|resulting in|we get|gives us|(?:subtract|add|multiply|divide).*(?:from|to) both sides)/i.test(msg.content)
        
        // Look for equation patterns: "4x-2 = 10", "4x+2 = 12", etc.
        // Pattern matches: coefficient*x +/- constant = number
        const equationMatch = msg.content.match(/(\d+x\s*[+\-]\s*\d+\s*=\s*\d+)/i)
        if (equationMatch && !isStepDescription) {
          return equationMatch[1]
        }
        
        // Also match simpler forms: "4x = 10" if it's in the first message
        // But only if it's not a step description
        if (i === 0 && !isStepDescription) {
          const simpleMatch = msg.content.match(/(\d+x\s*=\s*\d+)/i)
          if (simpleMatch) {
            return simpleMatch[1]
          }
        }
        
        // Look for LaTeX equations in user messages
        const latexMatch = msg.content.match(/\\[\(\[]([^\)\]]*?[+\-].*?=.*?)\\?[\)\]]/)
        if (latexMatch) {
          return `\\( ${latexMatch[1]} \\)`
        }
        
        // Match basic arithmetic: "8-3", "15+7", "12*4", "20/5", "7 + 4 = ?", etc.
        const arithmeticMatch = msg.content.match(/^\s*(\d+\s*[\+\-\*\/×÷]\s*\d+)\s*(?:=\s*\??)?\s*$/)
        if (arithmeticMatch) {
          return arithmeticMatch[1]
        }
      }
      
      // Check for AI-generated arithmetic problems like "Here's an equation: 7 + 4 = ?" or "What is 7+5?"
      if (msg.role === 'assistant') {
        // Pattern 1: "What is 7+5?" - extract the arithmetic expression
        const whatIsMatch = msg.content.match(/(?:what is|what's|calculate|compute)\s+(\d+\s*[\+\-\*\/×÷]\s*\d+)/i)
        if (whatIsMatch) {
          return whatIsMatch[1]
        }
        // Pattern 2: "7 + 4 = ?" format
        const aiArithmeticMatch = msg.content.match(/(\d+\s*[\+\-\*\/×÷]\s*\d+)\s*=\s*\?/)
        if (aiArithmeticMatch) {
          return aiArithmeticMatch[1]
        }
        // Pattern 3: LaTeX format "\( 7 + 5 \\)" in question context
        const latexMatch = msg.content.match(/\\[\(\[]\s*(\d+\s*[\+\-\*\/×÷]\s*\d+)\s*\\?[\)\]]/)
        if (latexMatch && /what is|what's|calculate|compute|problem|practice/i.test(msg.content)) {
          return latexMatch[1]
        }
      }
    }
    
    // Fallback: look for any equation (but this shouldn't be needed if user starts with problem)
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i]
      const equationMatch = msg.content.match(/(\d+x\s*[+\-]\s*\d+\s*=\s*\d+)/i)
      if (equationMatch) {
        return equationMatch[1]
      }
    }
    
    return null
  }

  // Extract current step - should be the most recent COMPLETE equation state
  const extractCurrentStep = (messages: Array<{role: string, content: string} | any>): string | null => {
    if (messages.length === 0) return null
    
    // Look through recent messages (last 5) to find the most recent equation state
    for (let i = messages.length - 1; i >= Math.max(0, messages.length - 5); i--) {
      const msg = messages[i]
      
      // Prioritize complete equations with equals signs
      // Pattern 1: Display equations with equals: \[ 3x = 12 \] or $$ 3x = 12 $$
      const displayEqMatch = msg.content.match(/\\\[([\s\S]*?[=\s]\d+[\s\S]*?)\\\]|\$\$([\s\S]*?[=\s]\d+[\s\S]*?)\$\$/)
      if (displayEqMatch) {
        const eq = (displayEqMatch[1] || displayEqMatch[2]).trim()
        // Only return if it's a complete equation (has equals sign and variable)
        if (eq.includes('=') && (eq.includes('x') || eq.match(/\d+x/))) {
          return eq
        }
      }
      
      // Pattern 2: Inline equations with equals: \( 3x = 12 \)
      const inlineEqMatch = msg.content.match(/\\\(([\s\S]*?[=\s]\d+[\s\S]*?)\\\)/)
      if (inlineEqMatch) {
        const eq = inlineEqMatch[1].trim()
        // Only return if it's a complete equation
        if (eq.includes('=') && (eq.includes('x') || eq.match(/\d+x/))) {
          return eq
        }
      }
      
      // Pattern 3: Plain text equations: "we have 3x=12" or "3x = 12"
      // Look for patterns like: "we have/have/now have/got/equals" followed by equation
      const textEqMatch = msg.content.match(/(?:we have|have|now have|got|equals?|is|so)\s+(\d+x\s*=\s*\d+)/i)
      if (textEqMatch) {
        return textEqMatch[1]
      }
      
      // Pattern 4: Direct equation in text (without "we have" prefix)
      const directEqMatch = msg.content.match(/(\d+x\s*=\s*\d+)/i)
      if (directEqMatch && directEqMatch.index !== undefined) {
        // Only use if it's in a sentence context (not just a number)
        const context = msg.content.substring(Math.max(0, directEqMatch.index - 20), Math.min(msg.content.length, directEqMatch.index + 30))
        if (context.includes('=') || context.includes('have') || context.includes('now') || context.includes('so')) {
          return directEqMatch[1]
        }
      }
    }
    
    // Fallback: Look for any recent equation state in user messages too
    for (let i = messages.length - 1; i >= Math.max(0, messages.length - 3); i--) {
      const msg = messages[i]
      if (msg.role === 'user') {
        const userEqMatch = msg.content.match(/(\d+x\s*=\s*\d+)/i)
        if (userEqMatch) {
          return userEqMatch[1]
        }
      }
    }
    
    return null
  }

  // Extract the last operation performed (e.g., "add 2 to both sides")
  const extractLastOperation = (messages: Array<{role: string, content: string} | any>): string | null => {
    if (messages.length === 0) return null
    
    // Look through recent messages for operation mentions
    for (let i = messages.length - 1; i >= Math.max(0, messages.length - 5); i--) {
      const msg = messages[i]
      
      // Look for operation patterns in AI messages
      if (msg.role === 'assistant') {
        // Pattern: "add X to both sides" or "subtract X from both sides"
        const addMatch = msg.content.match(/(?:add|adding|added)\s+(\d+)\s+to\s+both\s+sides?/i)
        if (addMatch) {
          return `+ ${addMatch[1]} to both sides`
        }
        
        const subtractMatch = msg.content.match(/(?:subtract|subtracting|subtracted)\s+(\d+)\s+from\s+both\s+sides?/i)
        if (subtractMatch) {
          return `- ${subtractMatch[1]} from both sides`
        }
        
        // Pattern: "multiply both sides by X" or "divide both sides by X"
        const multiplyMatch = msg.content.match(/(?:multiply|multiplying|multiplied)\s+both\s+sides?\s+by\s+(\d+)/i)
        if (multiplyMatch) {
          return `× ${multiplyMatch[1]} to both sides`
        }
        
        const divideMatch = msg.content.match(/(?:divide|dividing|divided)\s+both\s+sides?\s+by\s+(\d+)/i)
        if (divideMatch) {
          return `÷ ${divideMatch[1]} from both sides`
        }
      }
      
      // Also check user messages for operation descriptions
      if (msg.role === 'user') {
        const userAddMatch = msg.content.match(/(?:add|adding|added)\s+(\d+)/i)
        const userSubtractMatch = msg.content.match(/(?:subtract|subtracting|subtracted)\s+(\d+)/i)
        
        if (userAddMatch) {
          return `+ ${userAddMatch[1]} to both sides`
        } else if (userSubtractMatch) {
          return `- ${userSubtractMatch[1]} from both sides`
        }
      }
    }
    
    return null
  }

  const extractAllSteps = (messages: Array<{role: string, content: string} | any>, startIndex: number = 0): Step[] => {
    const steps: Step[] = []
    
    if (messages.length === 0) return steps
    
    // Only process messages from startIndex onward (current problem only)
    const currentProblemMessages = messages.slice(startIndex)
    if (currentProblemMessages.length === 0) return steps
    
    // Find original equation from current problem messages
    const originalEq = extractCurrentEquation(currentProblemMessages)
    if (originalEq) {
      steps.push({
        equation: originalEq,
        operation: null,
        operationSymbol: null,
        operationValue: null,
        isCorrect: true // Original problem is always shown
      })
    }
    
    // Detect if this is an arithmetic problem (no 'x' variable) vs algebraic equation
    const isArithmetic = originalEq && !originalEq.toLowerCase().includes('x')
    
    // Track equation transformations through the conversation
    let currentEq = originalEq
    let lastOperation: string | null = null
    
    // Look through messages chronologically to build step history (starting from startIndex)
    for (let i = 0; i < currentProblemMessages.length; i++) {
      const msg = currentProblemMessages[i]
      
      // For arithmetic problems, check for user answers that are confirmed
      if (isArithmetic && msg.role === 'user') {
        // Check if user provided a simple number answer
        const answerMatch = msg.content.match(/^\s*(\d+)\s*$/)
        if (answerMatch && originalEq) {
          // Try to validate the answer programmatically by calculating the original equation
          // Extract arithmetic expression from originalEq (e.g., "7+5" or "7 + 5")
          const arithmeticMatch = originalEq.match(/(\d+)\s*([+\-×*÷/])\s*(\d+)/)
          if (arithmeticMatch) {
            const num1 = parseFloat(arithmeticMatch[1])
            const operator = arithmeticMatch[2].replace(/×/, '*').replace(/÷/, '/')
            const num2 = parseFloat(arithmeticMatch[3])
            const studentAnswer = parseFloat(answerMatch[1])
            
            // Calculate correct answer
            let correctAnswer: number | null = null
            try {
              if (operator === '+') correctAnswer = num1 + num2
              else if (operator === '-') correctAnswer = num1 - num2
              else if (operator === '*') correctAnswer = num1 * num2
              else if (operator === '/') correctAnswer = num1 / num2
            } catch {
              correctAnswer = null
            }
            
            // If answer is correct, add it even if AI hasn't confirmed yet
            // (this handles cases where AI response hasn't arrived or validation detected it)
            if (correctAnswer !== null && Math.abs(studentAnswer - correctAnswer) < 0.001) {
              // Check if next message exists and rejects it
              if (i + 1 < currentProblemMessages.length) {
                const nextMsg = currentProblemMessages[i + 1]
                if (nextMsg.role === 'assistant') {
                  const nextContent = nextMsg.content.toLowerCase()
                  // Only add if not explicitly rejected (be specific - don't reject on "explore" or "verify")
                  const isRejected = /not quite|try again|almost|close but|incorrect|wrong|that'?s not right|no, that'?s not|that'?s not correct/i.test(nextContent)
                  // If answer is programmatically correct and not explicitly rejected, add it
                  if (!isRejected) {
                    // Add the answer as a final step
                    steps.push({
                      equation: answerMatch[1],
                      operation: null,
                      operationSymbol: null,
                      operationValue: null,
                      isCorrect: true
                    })
                    break // Done with this problem
                  }
                }
              } else {
                // No next message yet, but answer is correct - add it anyway
                // (this will be updated when AI responds)
                steps.push({
                  equation: answerMatch[1],
                  operation: null,
                  operationSymbol: null,
                  operationValue: null,
                  isCorrect: true
                })
                break
              }
            }
          }
        }
      }
      
      // Check for operation mentions - from user messages AND AI descriptions of drawings
      if (!isArithmetic) {
        // Check user messages for explicit operation descriptions
        if (msg.role === 'user') {
          // User patterns: "subtract 2 from each side", "divide both sides by 2", "divide by 2", etc.
          // Also handle "to get" patterns: "-3 both sides to get 2x=8"
          const userSubtractMatch = msg.content.match(/(?:subtract|subtracting)\s+(\d+)\s+from\s+(?:each|both)\s+side/i) ||
                                    msg.content.match(/^-\s*(\d+)\s+(?:from\s+)?both\s+sides/i) || // "-3 both sides" or "-3 from both sides"
                                    msg.content.match(/-\s*(\d+)\s+(?:from\s+)?both\s+sides\s+to\s+get/i) // "-3 both sides to get" or "-3 from both sides to get"
          const userAddMatch = msg.content.match(/(?:add|adding)\s+(\d+)\s+to\s+(?:each|both)\s+side/i) ||
                               msg.content.match(/^\+\s*(\d+)\s+(?:to\s+)?both\s+sides/i) || // "+3 both sides" or "+3 to both sides"
                               msg.content.match(/\+\s*(\d+)\s+(?:to\s+)?both\s+sides\s+to\s+get/i) // "+3 both sides to get"
          // Try full pattern first, then simpler pattern
          const userDivideMatchFull = msg.content.match(/(?:divide|dividing)\s+(?:both\s+sides?\s+by|each\s+side\s+by)\s+(\d+)/i) ||
                                      msg.content.match(/÷\s*(\d+)\s+(?:from\s+)?both\s+sides\s+to\s+get/i) || // "÷2 both sides to get"
                                      msg.content.match(/divide\s+(?:by\s+)?(\d+)\s+to\s+get/i) // "divide by 2 to get" or "divide 2 to get"
          const userDivideMatchSimple = msg.content.match(/(?:divide|dividing)\s+by\s+(\d+)/i) ||
                                       msg.content.match(/(?:divide|dividing)\s+(\d+)/i) // "divide 2" or "dividing 2"
          const userDivideMatch = userDivideMatchFull || userDivideMatchSimple
          const userMultiplyMatch = msg.content.match(/(?:multiply|multiplying)\s+(?:both\s+sides?\s+by|each\s+side\s+by)\s+(\d+)/i) ||
                                   msg.content.match(/×\s*(\d+)\s+(?:to\s+)?both\s+sides\s+to\s+get/i) // "×2 both sides to get"
          
          if (userAddMatch) {
            const value = userAddMatch[1]
            lastOperation = `+ ${value} to both sides`
          } else if (userSubtractMatch) {
            const value = userSubtractMatch[1]
            lastOperation = `- ${value} from both sides`
          } else if (userMultiplyMatch) {
            const value = userMultiplyMatch[1]
            lastOperation = `× ${value} to both sides`
          } else if (userDivideMatch) {
            const value = userDivideMatch[1]
            lastOperation = `÷ ${value} from both sides`
          }
        }
        
        // Check AI messages for operations described in drawing analysis
        // Pattern: "showed the next step as 2x/2 = 8/2" or "divided both sides by 2"
        if (msg.role === 'assistant') {
          // Look for division operations in AI descriptions of drawings
          const aiDivideMatch = msg.content.match(/(?:divide|dividing|divided)\s+(?:both\s+sides?\s+by|each\s+side\s+by)\s+(\d+)/i) ||
                               msg.content.match(/(?:showed|showing|wrote|written).*?(?:divide|dividing|divided).*?by\s+(\d+)/i)
          
          // Look for division in intermediate step format: "2x/2 = 8/2" or "2x ÷ 2 = 8 ÷ 2"
          const intermediateDivideMatch = msg.content.match(/(\d+x)\s*[\/÷]\s*(\d+)\s*=\s*(\d+)\s*[\/÷]\s*(\d+)/i)
          
          if (aiDivideMatch && aiDivideMatch[1]) {
            const value = aiDivideMatch[1]
            lastOperation = `÷ ${value} from both sides`
          } else if (intermediateDivideMatch) {
            // Extract the divisor (should be the same on both sides)
            const divisor = intermediateDivideMatch[2] || intermediateDivideMatch[4]
            if (divisor) {
              lastOperation = `÷ ${divisor} from both sides`
            }
          }
          
          // Also check for other operations in AI descriptions
          const aiSubtractMatch = msg.content.match(/(?:subtract|subtracting|subtracted)\s+(\d+)\s+from\s+(?:both\s+sides?|each\s+side)/i)
          const aiAddMatch = msg.content.match(/(?:add|adding|added)\s+(\d+)\s+to\s+(?:both\s+sides?|each\s+side)/i)
          const aiMultiplyMatch = msg.content.match(/(?:multiply|multiplying|multiplied)\s+(?:both\s+sides?\s+by|each\s+side\s+by)\s+(\d+)/i)
          
          if (aiAddMatch && aiAddMatch[1] && !lastOperation) {
            lastOperation = `+ ${aiAddMatch[1]} to both sides`
          } else if (aiSubtractMatch && aiSubtractMatch[1] && !lastOperation) {
            lastOperation = `- ${aiSubtractMatch[1]} from both sides`
          } else if (aiMultiplyMatch && aiMultiplyMatch[1] && !lastOperation) {
            lastOperation = `× ${aiMultiplyMatch[1]} to both sides`
          }
        }
      }
      
      // Check for new equation states - ONLY from AI confirmed responses
      // Don't capture student's incorrect guesses - only AI-confirmed correct steps
      
      if (msg.role === 'assistant') {
        // Check for rejection words in the message - don't capture equations from rejected answers
        const msgContentLower = msg.content.toLowerCase()
        const hasRejection = msgContentLower.includes('nice try') ||
                            msgContentLower.includes('but let\'s') ||
                            msgContentLower.includes('let\'s double-check') ||
                            msgContentLower.includes('let\'s check') ||
                            msgContentLower.includes('double-check') ||
                            msgContentLower.includes('hmm') ||
                            msgContentLower.includes('that\'s close but') ||
                            msgContentLower.includes('not quite') ||
                            msgContentLower.includes('almost') ||
                            msgContentLower.includes('close but') ||
                            msgContentLower.includes('try again') ||
                            (msgContentLower.includes('but') && (
                              msgContentLower.includes('let\'s') ||
                              msgContentLower.includes('check') ||
                              msgContentLower.includes('verify')
                            ))
        
        // Priority 1: AI messages with LaTeX equations (both display and inline)
        // Skip LaTeX extraction if message contains rejection language (but still check confirmation patterns)
        if (!hasRejection) {
          // Display math: \[ ... \] or $$ ... $$
          const displayLatexMatch = msg.content.match(/\\\[([\s\S]*?)\\\]|\$\$([\s\S]*?)\$\$/)
          if (displayLatexMatch) {
            const eq = (displayLatexMatch[1] || displayLatexMatch[2]).trim()
            // Extract equation from LaTeX (handles both "2x=2" and "x=1" formats)
            const eqInLatex = eq.match(/([\d]*x\s*=\s*\d+)/i)
            if (eqInLatex && eqInLatex[1] !== currentEq) {
              const newEq = eqInLatex[1]
              steps.push({
                equation: newEq,
                operation: lastOperation,
                operationSymbol: lastOperation?.match(/^([+\-×÷])/)?.[1] || null,
                operationValue: lastOperation ? parseFloat(lastOperation.match(/(\d+)/)?.[1] || '0') : null,
                isCorrect: true // LaTeX equations from AI are always correct
              })
              currentEq = newEq
              lastOperation = null
              continue
            }
          }
          
          // Inline math: \( ... \) or $ ... $
          const inlineLatexMatch = msg.content.match(/\\\(([\s\S]*?)\\\)|\$([^\$]+)\$/g)
          if (inlineLatexMatch) {
            for (const latexStr of inlineLatexMatch) {
              // Extract content from LaTeX
              const contentMatch = latexStr.match(/\\\(([\s\S]*?)\\\)|\$([^\$]+)\$/)
              if (contentMatch) {
                const eq = (contentMatch[1] || contentMatch[2]).trim()
                // Handles both "2x=2" and "x=1" formats
                const eqInLatex = eq.match(/([\d]*x\s*=\s*\d+)/i)
                if (eqInLatex && eqInLatex[1] !== currentEq) {
                  const newEq = eqInLatex[1]
                  steps.push({
                    equation: newEq,
                    operation: lastOperation,
                    operationSymbol: lastOperation?.match(/^([+\-×÷])/)?.[1] || null,
                    operationValue: lastOperation ? parseFloat(lastOperation.match(/(\d+)/)?.[1] || '0') : null,
                    isCorrect: true // LaTeX equations from AI are always correct
                  })
                  currentEq = newEq
                  lastOperation = null
                  continue
                }
              }
            }
          }
        }
        
        // Priority 2: AI explicitly confirming an equation with various phrasings
        // Patterns: "so now we have 2x=2", "the equation should be 2x=2", "now we have 2x=2", etc.
        // Also handles final solutions like "x=1" or "x=4"
        // Also handles "You ended up with x=4" or "you found x=4"
        const confirmPatterns = [
          /(?:so|now|we have|you have|the equation is|should be|equals?|becomes?|is|got|ended up with|found|got to|arrived at)\s+(?:the\s+)?(?:equation\s+)?([\d]*x\s*=\s*\d+)/i,
          /([\d]*x\s*=\s*\d+)\s*(?:is\s+correct|\.|!|$)/i,  // Direct equation at end of sentence
          /(?:you\s+)?(?:ended up with|found|got|arrived at)\s+([\d]*x\s*=\s*\d+)/i,  // "You ended up with x=4"
          /(?:now that you have|you have)\s+([\d]*x\s*=\s*\d+)/i  // "Now that you have 2x=8"
        ]
        
        for (const pattern of confirmPatterns) {
          const confirmMatch = msg.content.match(pattern)
          if (confirmMatch && confirmMatch[1] && confirmMatch[1] !== currentEq) {
            const newEq = confirmMatch[1].trim()
            // Only add if it's a valid equation format (handles both "2x=2" and "x=1")
            // Also verify the AI message contains positive confirmation words AND no rejection words
            const msgContentLower = msg.content.toLowerCase()
            
            // Check for REJECTION words first (these indicate the answer is wrong)
            // More comprehensive rejection detection
            const isRejected = msgContentLower.includes('nice try') ||
                              msgContentLower.includes('but let\'s') ||
                              msgContentLower.includes('let\'s double-check') ||
                              msgContentLower.includes('let\'s check') ||
                              msgContentLower.includes('double-check') ||
                              msgContentLower.includes('hmm') ||
                              msgContentLower.includes('that\'s close but') ||
                              msgContentLower.includes('not quite') ||
                              msgContentLower.includes('almost') ||
                              msgContentLower.includes('close but') ||
                              msgContentLower.includes('try again') ||
                              msgContentLower.includes('but') && (
                                msgContentLower.includes('let\'s') ||
                                msgContentLower.includes('check') ||
                                msgContentLower.includes('verify')
                              ) ||
                              // Check for phrases that suggest correction/rejection
                              (msgContentLower.includes('but') && msgContentLower.includes('what do you get')) ||
                              (msgContentLower.includes('calculate') && msgContentLower.includes('again'))
            
            // Only confirm if there are NO rejection words AND explicit positive confirmation
            // Require strong confirmation words to avoid false positives
            // But also accept if AI acknowledges the equation (like "now that you have 2x=8")
            const hasStrongConfirmation = msgContentLower.includes('yes') ||
                                        msgContentLower.includes('correct') ||
                                        msgContentLower.includes('exactly') ||
                                        msgContentLower.includes('that\'s it') ||
                                        msgContentLower.includes('right') ||
                                        msgContentLower.includes('bingo') ||
                                        msgContentLower.includes('perfect') ||
                                        msgContentLower.includes('excellent') ||
                                        msgContentLower.includes('that\'s right') ||
                                        msgContentLower.includes('you got it') ||
                                        msgContentLower.includes('yes, that\'s it') ||
                                        msgContentLower.includes('nice') ||
                                        msgContentLower.includes('good') ||
                                        msgContentLower.includes('great') ||
                                        msgContentLower.includes('awesome') ||
                                        // Accept if AI acknowledges the equation (like "now that you have 2x=8")
                                        msgContentLower.includes('now that you have') ||
                                        // Only allow "should be", "we have", "now" if no rejection AND explicit confirmation
                                        (!isRejected && (
                                          confirmMatch[0].includes('should be') ||
                                          confirmMatch[0].includes('we have') ||
                                          confirmMatch[0].includes('now')
                                        ))
            
            const hasPositiveConfirmation = !isRejected && hasStrongConfirmation
            
            if (newEq.match(/[\d]*x\s*=\s*\d+/i) && hasPositiveConfirmation) {
              steps.push({
                equation: newEq,
                operation: lastOperation,
                operationSymbol: lastOperation?.match(/^([+\-×÷])/)?.[1] || null,
                operationValue: lastOperation ? parseFloat(lastOperation.match(/(\d+)/)?.[1] || '0') : null,
                isCorrect: true // Only add if AI confirms it
              })
              currentEq = newEq
              lastOperation = null
              break // Found a match, move to next message
            }
          }
        }
      }
      
      // IMPORTANT: Check user messages with "to get" pattern FIRST, before AI processing
      // This prevents the AI confirmation from consuming the operation before we can attach it
      // Handle when user provides both operation and equation in one message
      if (msg.role === 'user' && i > 0) {
        // Check if user message contains both operation and equation with "to get" pattern
        // Example: "-3 from both sides to get 2x=8" or "subtract 7 from both sides to get 3x = 15"
        const hasToGetPattern = msg.content.toLowerCase().includes('to get')
        const userEqMatch = msg.content.match(/([\d]*x\s*=\s*\d+)/i)
        
        if (hasToGetPattern && userEqMatch && userEqMatch[1] !== currentEq) {
          // User provided both operation and equation in one message
          // Check if AI's next response is positive (not rejecting it)
          const nextMsg = i + 1 < currentProblemMessages.length ? currentProblemMessages[i + 1] : null
          
          if (nextMsg && nextMsg.role === 'assistant') {
            const nextContent = nextMsg.content.toLowerCase()
            
            // Check for REJECTION words
            const isRejected = nextContent.includes('nice try') ||
                              nextContent.includes('but let\'s') ||
                              nextContent.includes('let\'s double-check') ||
                              nextContent.includes('hmm') ||
                              nextContent.includes('not quite') ||
                              nextContent.includes('almost') ||
                              nextContent.includes('close but') ||
                              nextContent.includes('try again')
            
            // If not rejected, accept it (even if AI asks for verification)
            // Use lastOperation if it's set, otherwise this step won't have an operation label
            if (!isRejected) {
              steps.push({
                equation: userEqMatch[1],
                operation: lastOperation,  // This should be set from earlier operation extraction
                operationSymbol: lastOperation?.match(/^([+\-×÷])/)?.[1] || null,
                operationValue: lastOperation ? parseFloat(lastOperation.match(/(\d+)/)?.[1] || '0') : null,
                isCorrect: true
              })
              currentEq = userEqMatch[1]
              lastOperation = null
              continue
            }
          }
        }
        
        // Original logic: Check if the previous AI message was asking for the equation
        if (i > 0 && currentProblemMessages[i - 1]?.role === 'assistant') {
          const prevAiMsg = currentProblemMessages[i - 1].content || ''
          const isAskingForEquation = prevAiMsg.toLowerCase().includes('what does the equation') || 
                                       prevAiMsg.toLowerCase().includes('can you write that down') ||
                                       prevAiMsg.toLowerCase().includes('show me') ||
                                       prevAiMsg.toLowerCase().includes('what do you get')
          
          if (isAskingForEquation && userEqMatch && userEqMatch[1] !== currentEq) {
            // CRITICAL: Check if next AI message confirms it (to avoid adding wrong guesses)
            // If there's no next message yet, or if it's not from assistant, DON'T ADD
            const nextMsg = i + 1 < currentProblemMessages.length ? currentProblemMessages[i + 1] : null
            if (!nextMsg || nextMsg.role !== 'assistant') {
              // No confirmation yet - don't add user's guess
              continue
            }
            
            const nextContent = nextMsg.content.toLowerCase()
            
            // Check for REJECTION words first (these indicate the answer is wrong)
            // More comprehensive rejection detection
            const isRejected = nextContent.includes('nice try') ||
                              nextContent.includes('but let\'s') ||
                              nextContent.includes('let\'s double-check') ||
                              nextContent.includes('let\'s check') ||
                              nextContent.includes('double-check') ||
                              nextContent.includes('hmm') ||
                              nextContent.includes('that\'s close but') ||
                              nextContent.includes('not quite') ||
                              nextContent.includes('almost') ||
                              nextContent.includes('close but') ||
                              nextContent.includes('try again') ||
                              (nextContent.includes('but') && (
                                nextContent.includes('let\'s') ||
                                nextContent.includes('check') ||
                                nextContent.includes('verify')
                              )) ||
                              // Check for phrases that suggest correction/rejection
                              (nextContent.includes('but') && nextContent.includes('what do you get')) ||
                              (nextContent.includes('calculate') && nextContent.includes('again'))
            
            // Only confirm if there are NO rejection words AND explicit positive confirmation
            // Require strong confirmation words to avoid false positives
            const hasStrongConfirmation = nextContent.includes('yes') ||
                                        nextContent.includes('correct') ||
                                        nextContent.includes('exactly') ||
                                        nextContent.includes('that\'s it') ||
                                        nextContent.includes('right') ||
                                        nextContent.includes('bingo') ||
                                        nextContent.includes('perfect') ||
                                        nextContent.includes('excellent') ||
                                        nextContent.includes('that\'s right') ||
                                        nextContent.includes('you got it') ||
                                        nextContent.includes('yes, that\'s it') ||
                                        nextContent.includes('great') && !nextContent.includes('but')
            
            const isConfirmed = !isRejected && hasStrongConfirmation
            
            // Double-check: also verify the AI message actually contains the equation or confirms it explicitly
            const aiExplicitlyConfirms = nextContent.includes(userEqMatch[1].toLowerCase()) && hasStrongConfirmation ||
                                        (nextContent.includes('should be') && nextContent.includes(userEqMatch[1].toLowerCase())) ||
                                        (nextContent.includes('we have') && nextContent.includes(userEqMatch[1].toLowerCase()))
            
            if (isConfirmed && aiExplicitlyConfirms) {
              const newEq = userEqMatch[1]
              // Additional safety: make sure this equation makes sense mathematically
              // (This is a simple check - if the equation is already in steps, don't duplicate)
              const isDuplicate = steps.some(s => s.equation === newEq)
              if (!isDuplicate) {
                steps.push({
                  equation: newEq,
                  operation: lastOperation,
                  operationSymbol: lastOperation?.match(/^([+\-×÷])/)?.[1] || null,
                  operationValue: lastOperation ? parseFloat(lastOperation.match(/(\d+)/)?.[1] || '0') : null,
                  isCorrect: true // Only added if AI confirms it in next message
                })
                currentEq = newEq
                lastOperation = null
              }
            }
          }
        }
      }
      
      // DO NOT capture equations from user messages - they might be wrong guesses
      // Only capture from AI's confirmed correct responses
    }
    
    // Final safety check: filter out any steps that might be incorrect
    // Only return steps that are explicitly marked as correct
    // Also remove duplicates and ensure logical progression
    const filteredSteps = steps.filter(step => step.isCorrect === true)
    
    // Remove duplicates by equation (keep first occurrence)
    const uniqueSteps: Step[] = []
    const seenEquations = new Set<string>()
    
    for (const step of filteredSteps) {
      const normalizedEq = step.equation.replace(/\s+/g, '').toLowerCase()
      if (!seenEquations.has(normalizedEq)) {
        seenEquations.add(normalizedEq)
        uniqueSteps.push(step)
      }
    }
    
    return uniqueSteps
  }

  return {
    renderMath,
    extractCurrentEquation,
    extractCurrentStep,
    extractLastOperation,
    extractAllSteps,
    findCurrentProblemStart
  }
}

