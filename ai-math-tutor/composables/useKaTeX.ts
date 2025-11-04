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

  // Extract current equation from messages (should be the ORIGINAL problem)
  const extractCurrentEquation = (messages: Array<{role: string, content: string} | any>): string | null => {
    // First, look for the FIRST user message with an equation (original problem)
    // This is typically the first math problem stated
    for (let i = 0; i < Math.min(messages.length, 5); i++) {
      const msg = messages[i]
      
      // Prioritize user messages for the original problem
      if (msg.role === 'user') {
        // Look for equation patterns: "4x-2 = 10", "4x+2 = 12", etc.
        // Pattern matches: coefficient*x +/- constant = number
        const equationMatch = msg.content.match(/(\d+x\s*[+\-]\s*\d+\s*=\s*\d+)/i)
        if (equationMatch) {
          return equationMatch[1]
        }
        
        // Also match simpler forms: "4x = 10" if it's in the first message
        if (i === 0) {
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

  const extractAllSteps = (messages: Array<{role: string, content: string} | any>): Step[] => {
    const steps: Step[] = []
    
    if (messages.length === 0) return steps
    
    // Find original equation
    const originalEq = extractCurrentEquation(messages)
    if (originalEq) {
      steps.push({
        equation: originalEq,
        operation: null,
        operationSymbol: null,
        operationValue: null,
        isCorrect: true // Original problem is always shown
      })
    }
    
    // Track equation transformations through the conversation
    let currentEq = originalEq
    let lastOperation: string | null = null
    
    // Look through messages chronologically to build step history
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i]
      
      // Check for operation mentions (from both user and AI)
      if (msg.role === 'assistant' || msg.role === 'user') {
        // AI patterns: "add 2 to both sides", "subtract 2 from both sides"
        const addMatch = msg.content.match(/(?:add|adding|added)\s+(\d+)\s+to\s+both\s+sides?/i)
        const subtractMatch = msg.content.match(/(?:subtract|subtracting|subtracted)\s+(\d+)\s+from\s+both\s+sides?/i)
        const multiplyMatch = msg.content.match(/(?:multiply|multiplying|multiplied)\s+both\s+sides?\s+by\s+(\d+)/i)
        const divideMatch = msg.content.match(/(?:divide|dividing|divided)\s+both\s+sides?\s+by\s+(\d+)/i)
        
        // User patterns: "subtract 2 from each side", "divide both sides by 2"
        const userSubtractMatch = msg.content.match(/(?:subtract|subtracting)\s+(\d+)\s+from\s+(?:each|both)\s+side/i)
        const userAddMatch = msg.content.match(/(?:add|adding)\s+(\d+)\s+to\s+(?:each|both)\s+side/i)
        const userDivideMatch = msg.content.match(/(?:divide|dividing)\s+(?:both\s+sides?\s+by|each\s+side\s+by)\s+(\d+)/i)
        const userMultiplyMatch = msg.content.match(/(?:multiply|multiplying)\s+(?:both\s+sides?\s+by|each\s+side\s+by)\s+(\d+)/i)
        
        if (addMatch || userAddMatch) {
          const value = addMatch?.[1] || userAddMatch?.[1]
          lastOperation = `+ ${value} to both sides`
        } else if (subtractMatch || userSubtractMatch) {
          const value = subtractMatch?.[1] || userSubtractMatch?.[1]
          lastOperation = `- ${value} from both sides`
        } else if (multiplyMatch || userMultiplyMatch) {
          const value = multiplyMatch?.[1] || userMultiplyMatch?.[1]
          lastOperation = `× ${value} to both sides`
        } else if (divideMatch || userDivideMatch) {
          const value = divideMatch?.[1] || userDivideMatch?.[1]
          lastOperation = `÷ ${value} from both sides`
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
        // Also handles final solutions like "x=1"
        const confirmPatterns = [
          /(?:so|now|we have|you have|the equation is|should be|equals?|becomes?|is|got)\s+(?:the\s+)?(?:equation\s+)?([\d]*x\s*=\s*\d+)/i,
          /([\d]*x\s*=\s*\d+)\s*(?:is\s+correct|\.|!|$)/i  // Direct equation at end of sentence
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
      
      // Also check user messages for correct answers (when AI confirms them)
      // This helps catch cases where student provides the correct equation
      // BUT: Be very strict - only add if AI explicitly confirms it
      if (msg.role === 'user' && i > 0 && messages[i - 1]?.role === 'assistant') {
        // Check if the previous AI message was asking for the equation
        const prevAiMsg = messages[i - 1].content || ''
        const isAskingForEquation = prevAiMsg.toLowerCase().includes('what does the equation') || 
                                     prevAiMsg.toLowerCase().includes('can you write that down') ||
                                     prevAiMsg.toLowerCase().includes('show me') ||
                                     prevAiMsg.toLowerCase().includes('what do you get')
        
        if (isAskingForEquation) {
          // Handles both "2x=2" and "x=1" formats
          const userEqMatch = msg.content.match(/([\d]*x\s*=\s*\d+)/i)
          if (userEqMatch && userEqMatch[1] !== currentEq) {
            // CRITICAL: Check if next AI message confirms it (to avoid adding wrong guesses)
            // If there's no next message yet, or if it's not from assistant, DON'T ADD
            const nextMsg = i + 1 < messages.length ? messages[i + 1] : null
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
    extractAllSteps
  }
}

