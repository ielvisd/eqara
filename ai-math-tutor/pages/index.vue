<template>
  <div class="min-h-screen bg-black">
    <!-- Animated background elements with hot pink -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute -top-40 -right-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-overlay filter blur-xl opacity-10 animate-blob"></div>
      <div class="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-600 rounded-full mix-blend-overlay filter blur-xl opacity-10 animate-blob animation-delay-2000"></div>
      <div class="absolute top-40 left-40 w-80 h-80 bg-pink-400 rounded-full mix-blend-overlay filter blur-xl opacity-10 animate-blob animation-delay-4000"></div>
    </div>

    <UContainer class="py-8 max-w-7xl relative z-10">
      <!-- Header -->
      <div class="text-center mb-8">
        <h1 class="text-5xl md:text-6xl font-bold bg-gradient-to-r from-pink-400 via-pink-500 to-pink-600 bg-clip-text text-transparent mb-4 animate-fade-in">
          🎓 Eqara
        </h1>

        <p class="text-lg text-gray-300 max-w-2xl mx-auto">
          Upload a math problem or start chatting with your AI tutor
        </p>
      </div>

      <!-- Side-by-side layout: Chat and Problem/Step -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Chat Interface (2/3 width on large screens) -->
        <div class="lg:col-span-2">
          <UCard class="shadow-2xl border border-pink-500/20 bg-black/90 backdrop-blur-sm">
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg flex items-center justify-center shadow-lg shadow-pink-500/50">
                <UIcon name="i-lucide-message-circle" class="size-5 text-white" />
              </div>
              <div>
                <h3 class="text-2xl font-bold text-white">Eqara</h3>
                <p class="text-sm text-gray-400">Get step-by-step guidance and earn XP as you learn!</p>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <div v-if="gameState.xp > 0" class="px-3 py-1 bg-pink-500/20 text-pink-400 text-xs font-medium rounded-full border border-pink-500/30">
                <UIcon name="i-lucide-trophy" class="size-3 mr-1" />
                {{ gameState.xp }} XP
              </div>
              <UButton
                v-if="messages.length > 0"
                icon="i-lucide-rotate-ccw"
                color="neutral"
                variant="ghost"
                size="sm"
                :disabled="isProcessing"
                class="text-gray-400 hover:text-pink-400 hover:bg-pink-500/10"
                @click="resetConversation"
              >
                Reset
              </UButton>
            </div>
          </div>
        </template>

        <!-- Chat Messages -->
        <div v-if="messages.length > 0" class="mb-6 min-h-[400px] max-h-[600px] overflow-hidden border border-pink-500/20 rounded-lg bg-black/50">
          <div class="min-h-[400px] max-h-[600px] overflow-y-auto p-4 space-y-4">
            <UChatMessages :messages="chatMessages" :status="chatStatus" should-auto-scroll>
              <template #content="{ message }">
                <div class="prose prose-sm dark:prose-invert max-w-none">
                  <template v-for="msg in messages" :key="msg.id">
                    <template v-if="msg.id === message.id">
                      <div v-if="msg.role === 'user'" class="bg-pink-500/10 rounded-lg p-3 border-l-4 border-pink-500">
                        <div class="flex items-center gap-2 mb-2">
                          <UIcon name="i-lucide-user" class="size-4 text-pink-400" />
                          <span class="text-sm font-medium text-pink-400">You</span>
                        </div>
                        <p class="text-gray-200" v-html="renderMath(msg.content)"></p>
                      </div>
                      <div v-else class="bg-black/50 rounded-lg p-4 border border-pink-500/20 shadow-lg">
                        <div class="flex items-center gap-2 mb-3">
                          <div class="w-8 h-8 bg-gradient-to-br from-pink-500 to-pink-600 rounded-full flex items-center justify-center">
                            <UIcon name="i-lucide-brain" class="size-4 text-white" />
                          </div>
                          <div>
                            <span class="text-sm font-medium text-white">Eqara</span>
                            <div v-if="msg.xpReward" class="text-xs text-pink-400 flex items-center gap-1">
                              <UIcon name="i-lucide-sparkles" class="size-3" />
                              +{{ msg.xpReward }} XP
                            </div>
                            <div class="text-xs text-gray-400 flex items-center gap-1">
                              <UIcon name="i-lucide-clock" class="size-3" />
                              {{ formatTime(msg.timestamp) }}
                            </div>
                          </div>
                        </div>
                        <div class="space-y-3">
                          <div class="text-gray-200 leading-relaxed whitespace-pre-wrap" v-html="renderMath(msg.content)"></div>
                          <div v-if="msg.steps" class="bg-pink-500/10 rounded-lg p-4 border border-pink-500/20">
                            <div class="flex items-center gap-2 mb-3">
                              <UIcon name="i-lucide-list-ordered" class="size-4 text-pink-400" />
                              <span class="text-sm font-semibold text-pink-400">Solution Steps</span>
                            </div>
                            <ol class="space-y-2">
                              <li v-for="(step, index) in msg.steps" :key="index" class="flex items-start gap-3">
                                <span class="flex-shrink-0 w-6 h-6 bg-pink-500/20 text-pink-400 text-xs font-bold rounded-full flex items-center justify-center mt-0.5 border border-pink-500/30">
                                  {{ index + 1 }}
                                </span>
                                <span class="text-gray-300 leading-relaxed" v-html="renderMath(step)"></span>
                              </li>
                            </ol>
                          </div>
                        </div>
                      </div>
                    </template>
                  </template>
                </div>
              </template>
            </UChatMessages>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="min-h-[400px] flex items-center justify-center">
          <div class="text-center space-y-6 max-w-md">
            <div class="w-20 h-20 bg-gradient-to-br from-pink-500 to-pink-600 rounded-full flex items-center justify-center shadow-lg shadow-pink-500/50 mx-auto">
              <span class="text-4xl">🎓</span>
            </div>
            <div>
              <h3 class="text-2xl font-bold text-white mb-2">Ready to Learn Math?</h3>
              <p class="text-gray-400 mb-6">Upload an image of your math problem or start chatting with your AI tutor below!</p>
            </div>
          </div>
        </div>

        <!-- Chat Input with Image Upload Option -->
        <div class="mt-6 space-y-3">
          <!-- Image Preview if uploaded -->
          <div v-if="hasFile && getFile" class="mb-3 p-3 bg-black/50 rounded-lg border border-pink-500/20 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <UIcon name="i-lucide-image" class="size-5 text-pink-400" />
              <div>
                <p class="text-sm text-white font-medium">{{ getFile.name }}</p>
                <p class="text-xs text-gray-400">{{ (getFile.size / 1024).toFixed(1) }} KB</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <UButton
                icon="i-lucide-search"
                color="primary"
                size="sm"
                :loading="isProcessing"
                class="bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white"
                @click="processImage"
              >
                Analyze
              </UButton>
              <UButton
                icon="i-lucide-x"
                color="neutral"
                variant="ghost"
                size="sm"
                :disabled="isProcessing"
                class="text-pink-400 hover:text-pink-500 hover:bg-pink-500/10"
                @click="clearUpload"
              />
            </div>
          </div>

          <div 
            class="relative"
            @dragover.prevent="handleDragOver"
            @dragleave.prevent="handleDragLeave"
            @drop.prevent="handleDrop"
            @dragenter.prevent="handleDragEnter"
          >
            <UChatPrompt
              v-model="textProblem"
              placeholder="Type your problem or drag & drop an image here..."
              :loading="isProcessing"
              :disabled="isProcessing"
              :class="[
                'border-2 transition-all duration-200',
                isDragging 
                  ? 'border-pink-500 bg-pink-500/10 border-dashed' 
                  : 'border-pink-500/30 focus-within:border-pink-500 bg-black/50'
              ]"
              @submit="processText"
            >
              <template #trailing>
                <div class="flex items-center gap-2 px-3">
                  <UChatPromptSubmit :status="chatStatus" @stop="stopProcessing" />
                </div>
              </template>
            </UChatPrompt>
            <!-- Drag overlay hint -->
            <div 
              v-if="isDragging"
              class="absolute inset-0 flex items-center justify-center bg-pink-500/20 backdrop-blur-sm rounded-lg pointer-events-none z-10"
            >
              <div class="text-center">
                <UIcon name="i-lucide-upload-cloud" class="size-12 text-pink-400 mx-auto mb-2" />
                <p class="text-pink-400 font-medium">Drop your image here to upload</p>
              </div>
            </div>
          </div>

          <!-- Typing Indicator -->
          <div v-if="isProcessing && chatStatus === 'streaming'" class="flex items-center gap-2 text-sm text-pink-400">
            <UIcon name="i-lucide-loader-2" class="size-4 animate-spin" />
            AI is thinking...
          </div>
        </div>
      </UCard>
        </div>

        <!-- Problem/Step Sidebar (1/3 width on large screens) -->
        <div class="lg:col-span-1">
          <UCard class="shadow-2xl border border-pink-500/20 bg-black/90 backdrop-blur-sm sticky top-8">
            <template #header>
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg flex items-center justify-center shadow-lg shadow-pink-500/50">
                  <UIcon name="i-lucide-file-text" class="size-5 text-white" />
                </div>
                <div>
                  <h3 class="text-lg font-bold text-white">Current Problem</h3>
                  <p class="text-xs text-gray-400">Step-by-step progress</p>
                </div>
              </div>
            </template>

            <div class="space-y-4">
              <!-- Step-by-step progression -->
              <div v-if="allSteps.length > 0" class="space-y-3">
                <div class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Step-by-step Solution</div>
                
                <template v-for="(step, index) in allSteps" :key="index">
                  <!-- Original Problem - Distinct color (blue/purple) -->
                  <div v-if="index === 0" 
                    class="rounded-lg p-4 border-2 border-blue-500/40 bg-blue-500/10 shadow-lg"
                  >
                    <div class="text-center">
                      <div class="text-sm text-blue-400 mb-1 font-medium">Original Problem</div>
                      <div 
                        class="text-lg font-mono text-white"
                        v-html="renderMath(step.equation, true)"
                      ></div>
                    </div>
                  </div>
                  
                  <!-- Operation - Show BEFORE the equation it produces -->
                  <div v-if="step.operation" class="py-2">
                    <div class="text-center">
                      <div 
                        class="text-sm font-semibold px-3 py-1.5 rounded-full inline-block"
                        :class="step.isCorrect 
                          ? 'bg-pink-500/20 text-pink-300 border border-pink-500/30' 
                          : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'"
                      >
                        {{ step.operation }}
                      </div>
                    </div>
                  </div>
                  
                  <!-- Intermediate/Final Equations - Green for correct -->
                  <div v-if="index > 0" 
                    :class="[
                      'rounded-lg p-4 border-2 transition-all',
                      index === allSteps.length - 1
                        ? 'bg-green-500/10 border-green-500/40 shadow-lg shadow-green-500/10'
                        : step.isCorrect
                          ? 'bg-green-500/10 border-green-500/30'
                          : 'bg-pink-500/10 border-pink-500/20'
                    ]"
                  >
                    <div class="flex items-center justify-center gap-2">
                      <div 
                        class="text-lg font-mono text-center"
                        :class="step.isCorrect ? 'text-green-300' : 'text-white'"
                        v-html="renderMath(step.equation, true)"
                      ></div>
                      <UIcon 
                        v-if="step.isCorrect && index === allSteps.length - 1" 
                        name="i-lucide-check-circle" 
                        class="size-5 text-green-400 flex-shrink-0"
                      />
                    </div>
                  </div>
                </template>
              </div>
              
              <!-- Substitution/Verification Section -->
              <div v-if="hasVerification" class="mt-6 pt-6 border-t border-gray-700">
                <div class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Substitute/Verify</div>
                <div class="space-y-2">
                  <div class="text-sm text-purple-300 font-medium">Substitute x = {{ finalSolution }}</div>
                  <div class="bg-purple-500/10 rounded-lg p-3 border border-purple-500/30">
                    <div class="text-white font-mono text-sm" v-html="renderMath(verificationEquation, true)"></div>
                  </div>
                  <div class="text-sm text-green-400 font-medium flex items-center gap-2">
                    <UIcon name="i-lucide-check-circle" class="size-4" />
                    {{ verificationResult }}
                  </div>
                </div>
              </div>

              <!-- Empty State -->
              <div v-if="allSteps.length === 0" class="text-center py-8">
                <UIcon name="i-lucide-calculator" class="size-12 text-gray-600 mx-auto mb-3" />
                <p class="text-sm text-gray-500">Start solving a problem to see it here</p>
              </div>
            </div>
          </UCard>
        </div>
      </div>

      <!-- Stats Footer -->
      <div class="mt-8 grid md:grid-cols-3 gap-6">
        <!-- XP Card -->
        <div class="bg-black/80 backdrop-blur-sm rounded-lg p-6 border border-pink-500/20 shadow-lg shadow-pink-500/10">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-10 h-10 bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg flex items-center justify-center shadow-lg shadow-pink-500/50">
              <UIcon name="i-lucide-trophy" class="size-5 text-white" />
            </div>
            <div>
              <div class="text-sm font-medium text-white">Your Progress</div>
              <div class="text-xs text-gray-400">Keep learning!</div>
            </div>
          </div>
          <div class="space-y-2">
            <div class="flex justify-between text-sm">
              <span class="text-gray-400">Problems Solved</span>
              <span class="font-semibold text-white">{{ messages.filter(m => m.role === 'assistant').length }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-400">XP Earned</span>
              <span class="font-semibold text-pink-400">{{ gameState.xp }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-400">Level</span>
              <span class="font-semibold text-pink-400">{{ gameState.level }}</span>
            </div>
          </div>
        </div>

        <!-- Features Card -->
        <div class="bg-black/80 backdrop-blur-sm rounded-lg p-6 border border-pink-500/20 shadow-lg shadow-pink-500/10">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-10 h-10 bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg flex items-center justify-center shadow-lg shadow-pink-500/50">
              <UIcon name="i-lucide-zap" class="size-5 text-white" />
            </div>
            <div>
              <div class="text-sm font-medium text-white">AI-Powered</div>
              <div class="text-xs text-gray-400">Advanced mathematics</div>
            </div>
          </div>
          <ul class="text-sm text-gray-400 space-y-1">
            <li>• Step-by-step solutions</li>
            <li>• Image OCR analysis</li>
            <li>• 24/7 availability</li>
            <li>• Multiple subjects</li>
          </ul>
        </div>

        <!-- Learning Tips Card -->
        <div class="bg-black/80 backdrop-blur-sm rounded-lg p-6 border border-pink-500/20 shadow-lg shadow-pink-500/10">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-10 h-10 bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg flex items-center justify-center shadow-lg shadow-pink-500/50">
              <UIcon name="i-lucide-lightbulb" class="size-5 text-white" />
            </div>
            <div>
              <div class="text-sm font-medium text-white">Learning Tips</div>
              <div class="text-xs text-gray-400">Study smarter</div>
            </div>
          </div>
          <ul class="text-sm text-gray-400 space-y-1">
            <li>• Practice regularly</li>
            <li>• Show your work</li>
            <li>• Ask questions</li>
            <li>• Learn from mistakes</li>
          </ul>
        </div>
      </div>
    </UContainer>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted, onUnmounted } from 'vue'

// useToast is auto-imported by Nuxt UI module
const toast = useToast()

// Chat history and gamification
const { getSessionId, saveMessage, loadChatHistory, subscribeToChat, resetSession, clearChatHistory } = useChatHistory()
const { gameState, addXP } = useGamification()

// KaTeX for math rendering
const { renderMath, extractCurrentEquation, extractCurrentStep, extractLastOperation, extractAllSteps, findCurrentProblemStart } = useKaTeX()

// File upload state - UFileUpload can return File, File[], or null
const files = ref<File | File[] | null>(null) as any

// Chat state
const textProblem = ref('')
const messages = ref<Array<{
  id: string
  role: 'user' | 'assistant'
  content: string
  steps?: string[]
  timestamp: Date
  xpReward?: number
}>>([])

const isProcessing = ref(false)
const isDragging = ref(false)
const chatStatus = ref<'ready' | 'submitted' | 'streaming' | 'error'>('ready')
const sessionId = ref<string>('')
let unsubscribeChat: (() => void) | null = null

// Computed to check if file exists
const hasFile = computed(() => {
  if (!files.value) return false
  return Array.isArray(files.value) ? files.value.length > 0 : true
})

// Get the first file for processing
const getFile = computed((): File | null => {
  if (!files.value) return null
  const file = Array.isArray(files.value) ? files.value[0] : files.value
  return file instanceof File ? file : null
})

// Convert messages to UChatMessages format
const chatMessages = computed(() => {
  return messages.value.map(msg => ({
    id: msg.id,
    role: msg.role,
    parts: [{ type: 'text' as const, text: msg.content }],
    createdAt: msg.timestamp
  })) as any
})

// Extract current equation and step for sidebar
const currentEquation = computed(() => {
  return extractCurrentEquation(messages.value)
})

const currentStep = computed(() => {
  return extractCurrentStep(messages.value)
})

const lastOperation = computed(() => {
  return extractLastOperation(messages.value)
})

// Find where the current problem starts (most recent user message with equation)
const currentProblemStart = computed(() => {
  return findCurrentProblemStart(messages.value)
})

const allSteps = computed(() => {
  return extractAllSteps(messages.value, currentProblemStart.value)
})

// Extract final solution (x = value)
const finalSolution = computed(() => {
  if (allSteps.value.length === 0) return null
  const lastStep = allSteps.value[allSteps.value.length - 1]
  if (!lastStep) return null
  const match = lastStep.equation.match(/x\s*=\s*(\d+)/i)
  return match && match[1] ? match[1] : null
})

// Check if there's verification in the conversation (only for current problem)
const hasVerification = computed(() => {
  if (!finalSolution.value) return false
  // Only look for substitution/verification mentions in the current problem messages
  const currentProblemMessages = messages.value.slice(currentProblemStart.value)
  const hasSubstitution = currentProblemMessages.some(msg => {
    const content = (msg.content || '').toLowerCase()
    return content.includes('substitut') || 
           content.includes('verify') ||
           (content.includes('check') && content.includes('original'))
  })
  return hasSubstitution && finalSolution.value !== null
})

// Extract verification equation
const verificationEquation = computed(() => {
  if (!finalSolution.value || allSteps.value.length === 0) return ''
  const firstStep = allSteps.value[0]
  if (!firstStep) return ''
  const originalEq = firstStep.equation
  // Extract the left side pattern (e.g., "2x+2" from "2x+2=4")
  const leftMatch = originalEq.match(/(.+?)\s*=\s*/)
  if (!leftMatch || !leftMatch[1]) return ''
  
  const leftSide = leftMatch[1]
  // Replace x with the solution value
  const substituted = leftSide.replace(/x/gi, `(${finalSolution.value})`)
  const rightMatch = originalEq.match(/=\s*(.+)/)
  const rightSide = rightMatch && rightMatch[1] ? rightMatch[1] : ''
  return `${substituted} = ${rightSide}`
})

// Extract verification result
const verificationResult = computed(() => {
  if (!finalSolution.value || allSteps.value.length === 0) return ''
  const firstStep = allSteps.value[0]
  if (!firstStep) return ''
  const originalEq = firstStep.equation
  const rightMatch = originalEq.match(/=\s*(\d+)/)
  if (!rightMatch || !rightMatch[1]) return ''
  
  const originalRight = parseInt(rightMatch[1])
  // Simple calculation: if original is "2x+2=4" and x=1, then 2(1)+2 = 4
  const leftMatch = originalEq.match(/(\d+)x\s*([+\-])\s*(\d+)/i)
  if (leftMatch && leftMatch[1] && leftMatch[2] && leftMatch[3]) {
    const coeff = parseInt(leftMatch[1])
    const op = leftMatch[2]
    const constVal = parseInt(leftMatch[3])
    const calculated = op === '+' 
      ? coeff * parseInt(finalSolution.value) + constVal
      : coeff * parseInt(finalSolution.value) - constVal
    if (calculated === originalRight) {
      return `${calculated} = ${originalRight} ✅`
    }
  }
  return ''
})

// Helper to parse equation into left and right sides
const parseEquation = (eq: string) => {
  if (!eq) return { left: '', right: '' }
  const match = eq.match(/(.+?)\s*=\s*(.+)/)
  if (match && match[1] && match[2]) {
    return { left: match[1].trim(), right: match[2].trim() }
  }
  return { left: eq, right: '' }
}

// Helper to compute correct result from operation
const computeResult = (originalEq: string, operationSymbol: string | null, operationValue: number | null) => {
  if (!operationSymbol || !operationValue) return null
  
  const parsed = parseEquation(originalEq)
  const leftSide = parsed.left
  const rightSide = parsed.right
  
  // Extract the coefficient and constant from left side
  const leftMatch = leftSide.match(/(\d+)x\s*([+\-])\s*(\d+)/i)
  if (!leftMatch) return null
  
  const rightNum = parseFloat(rightSide)
  if (isNaN(rightNum)) return null
  
  let newRight = rightNum
  if (operationSymbol === '+') {
    newRight = rightNum + operationValue
  } else if (operationSymbol === '-') {
    newRight = rightNum - operationValue
  } else if (operationSymbol === '×') {
    newRight = rightNum * operationValue
  } else if (operationSymbol === '÷') {
    newRight = rightNum / operationValue
  }
  
  // Build new equation (coefficient stays the same, constant is removed)
  const coefficient = leftMatch[1]
  return `${coefficient}x = ${newRight}`
}

// Validate and set file (shared helper)
const validateAndSetFile = (file: File | null): boolean => {
  if (!file) return false
  
  // Check file size (5MB limit)
  if (file.size > 5 * 1024 * 1024) {
    toast.add({
      title: 'File too large',
      description: 'Please upload an image smaller than 5MB',
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
    return false
  }

  // Check file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    toast.add({
      title: 'Invalid file type',
      description: 'Please upload a JPG, PNG, GIF, or WebP image',
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
    return false
  }

  // Set the file
  files.value = file
  return true
}

// Handle file selection from input
const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const fileList = target.files
  if (!fileList || fileList.length === 0) return
  
  const file = fileList.item(0)
  if (!file) return
  
  if (validateAndSetFile(file)) {
    // Clear the input so the same file can be selected again
    target.value = ''
  }
}

// Handle drag and drop events
const handleDragEnter = (event: DragEvent) => {
  event.preventDefault()
  if (event.dataTransfer?.types.includes('Files')) {
    isDragging.value = true
  }
}

const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
  if (event.dataTransfer?.types.includes('Files')) {
    isDragging.value = true
  }
}

const handleDragLeave = (event: DragEvent) => {
  event.preventDefault()
  // Only set to false if we're leaving the drop zone (not entering a child element)
  const relatedTarget = event.relatedTarget as HTMLElement | null
  const currentTarget = event.currentTarget as HTMLElement | null
  if (!relatedTarget || (currentTarget && !currentTarget.contains(relatedTarget))) {
    isDragging.value = false
  }
}

const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  isDragging.value = false
  
  if (!event.dataTransfer) return
  
  const droppedFiles = event.dataTransfer.files
  if (!droppedFiles || droppedFiles.length === 0) return
  
  const file = droppedFiles.item(0)
  if (!file) return
  
  validateAndSetFile(file)
}

// Watch files for validation
watch(files, (newFile) => {
  if (!newFile) return
  
  const file = Array.isArray(newFile) ? newFile[0] : newFile
  if (!file || !(file instanceof File)) return
  
  // Check file size (5MB limit)
  if (file.size > 5 * 1024 * 1024) {
    toast.add({
      title: 'File too large',
      description: 'Please upload an image smaller than 5MB',
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
    files.value = null
    return
  }

  // Check file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    toast.add({
      title: 'Invalid file type',
      description: 'Please upload a JPG, PNG, GIF, or WebP image',
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
    files.value = null
    return
  }
})

// Convert file to base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      if (!result || typeof result !== 'string') {
        reject(new Error('Failed to read file'))
        return
      }
      // Remove data:image/...;base64, prefix if present
      const parts = result.split(',')
      const base64 = parts.length > 1 ? parts[1] : result
      if (!base64) {
        reject(new Error('Failed to extract base64 data'))
        return
      }
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// Process uploaded image
const processImage = async () => {
  const file = getFile.value
  if (!hasFile.value || !file) return

  isProcessing.value = true
  chatStatus.value = 'submitted'

  const userMessage = {
    id: `user-${Date.now()}`,
    role: 'user' as const,
    content: `📷 Analyzing image: ${file.name}`,
    timestamp: new Date()
  }
  messages.value.push(userMessage)

  try {
    chatStatus.value = 'streaming'
    
    // Convert image to base64
    const imageBase64 = await fileToBase64(file)

    // Call vision API endpoint
    const response = await $fetch<{
      success: boolean
      extractedProblem?: string
      provider?: string
      timestamp?: string
      message?: string
    }>('/api/vision', {
      method: 'POST',
      body: {
        imageBase64: imageBase64
      }
    })

    if (!response.success || !response.extractedProblem) {
      throw new Error(response.message || 'Failed to extract problem from image')
    }

    const extractedProblem = response.extractedProblem

    // Ensure session ID exists
    if (!sessionId.value) {
      sessionId.value = getSessionId()
    }

    // Add assistant response with extracted problem
    const assistantMessage = {
      id: `assistant-${Date.now()}`,
      role: 'assistant' as const,
      content: `✨ I found this problem in your image:\n\n**${extractedProblem}**\n\nWould you like help solving it? I can guide you through it step by step! 🎓`,
      timestamp: new Date(),
      xpReward: 10
    }
    messages.value.push(assistantMessage)

    // Save messages to Supabase
    await saveMessage(userMessage, sessionId.value)
    await saveMessage(assistantMessage, sessionId.value)
    await addXP(10)

    chatStatus.value = 'ready'
    
    toast.add({
      title: 'Image processed! 🎉',
      description: `Problem extracted successfully! XP Earned: +10`,
      color: 'success',
      icon: 'i-lucide-check-circle'
    })
  } catch (error: any) {
    chatStatus.value = 'error'
    
    // Remove the user message if processing failed
    messages.value.pop()
    
    const errorMessage = error.data?.message || error.message || 'An error occurred while processing your image'
    
    toast.add({
      title: 'Processing failed',
      description: errorMessage.includes('API') 
        ? 'Please configure OPENAI_API_KEY or GROK_API_KEY in your .env file'
        : 'Please try again with a clearer, well-lit image',
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  } finally {
    isProcessing.value = false
  }
}

// Process text input
const processText = async () => {
  if (!textProblem.value.trim()) return

  const userInput = textProblem.value.trim()
  textProblem.value = ''
  isProcessing.value = true
  chatStatus.value = 'submitted'

  // Ensure session ID exists
  if (!sessionId.value) {
    sessionId.value = getSessionId()
  }

  // Add user message
  const userMessage = {
    id: `user-${Date.now()}`,
    role: 'user' as const,
    content: userInput,
    timestamp: new Date()
  }
  messages.value.push(userMessage)

  // Save user message to Supabase
  await saveMessage(userMessage, sessionId.value)

  try {
    chatStatus.value = 'streaming'

    // Prepare chat history for context
    const chatHistory = messages.value
      .slice(0, -1) // Exclude current message
      .map(msg => ({
        role: msg.role,
        content: msg.content
      }))

    // Check if there's an extracted problem from vision
    const extractedProblem = messages.value.find(m => 
      m.role === 'assistant' && m.content.includes('I found this problem')
    )?.content.match(/\*\*(.+?)\*\*/)?.[1]

    // Call chat API
    const response = await $fetch<{
      success: boolean
      message?: string
      xpReward?: number
      provider?: string
      timestamp?: string
    }>('/api/chat', {
      method: 'POST',
      body: {
        message: userInput,
        chatHistory: chatHistory,
        sessionId: sessionId.value,
        extractedProblem: extractedProblem
      }
    })

    if (!response.success || !response.message) {
      throw new Error('Failed to get response from AI')
    }

    // Add assistant response
    const assistantMessage = {
      id: `assistant-${Date.now()}`,
      role: 'assistant' as const,
      content: response.message,
      timestamp: new Date(),
      xpReward: response.xpReward || 10
    }
    messages.value.push(assistantMessage)

    // Save assistant message and award XP
    await saveMessage(assistantMessage, sessionId.value)
    if (assistantMessage.xpReward) {
      await addXP(assistantMessage.xpReward)
    }

    chatStatus.value = 'ready'
    
    toast.add({
      title: 'Response generated! 🎉',
      description: `XP Earned: +${assistantMessage.xpReward}`,
      color: 'success',
      icon: 'i-lucide-lightbulb'
    })
  } catch (error: any) {
    chatStatus.value = 'error'
    
    // Remove the user message if processing failed
    messages.value.pop()
    
    const errorMessage = error.data?.message || error.message || 'An error occurred while processing your request'
    
    toast.add({
      title: 'Processing failed',
      description: errorMessage.includes('API') 
        ? 'Please configure GROK_API_KEY or OPENAI_API_KEY in your .env file'
        : 'Please try again',
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  } finally {
    isProcessing.value = false
  }
}

// Stop processing
const stopProcessing = () => {
  isProcessing.value = false
  chatStatus.value = 'ready'
  toast.add({
    title: 'Processing stopped',
    description: 'You can start a new conversation',
    color: 'neutral',
    icon: 'i-lucide-stop-circle'
  })
}

// Clear upload
const clearUpload = () => {
  files.value = null
  toast.add({
    title: 'Upload cleared',
    description: 'You can upload a new image',
    color: 'neutral',
    icon: 'i-lucide-check'
  })
}

// Format timestamp for chat messages
const formatTime = (timestamp: Date) => {
  return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

// Reset conversation
const resetConversation = async () => {
  if (isProcessing.value) return
  
  // Clear messages from UI
  const oldSessionId = sessionId.value
  messages.value = []
  files.value = null
  textProblem.value = ''
  
  // Unsubscribe from old session if exists
  if (unsubscribeChat) {
    unsubscribeChat()
    unsubscribeChat = null
  }
  
  // Clear chat history from Supabase (optional - doesn't break if it fails)
  if (oldSessionId) {
    await clearChatHistory(oldSessionId)
  }
  
  // Create new session
  sessionId.value = resetSession()
  
  // Subscribe to new session
  if (process.client) {
    unsubscribeChat = subscribeToChat(sessionId.value, (newMessage) => {
      if (!messages.value.find(m => m.id === newMessage.id)) {
        messages.value.push(newMessage)
      }
    })
  }
  
  toast.add({
    title: 'Conversation reset! 🎉',
    description: 'Starting fresh! Your XP progress is saved.',
    color: 'success',
    icon: 'i-lucide-check-circle'
  })
}

// Initialize chat on mount
onMounted(async () => {
  if (process.client) {
    // Get or create session ID
    sessionId.value = getSessionId()
    
    // Load existing chat history
    const history = await loadChatHistory(sessionId.value)
    if (history.length > 0) {
      messages.value = history.map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp,
        xpReward: msg.xpReward
      }))
    }
    
    // Subscribe to realtime chat updates
    unsubscribeChat = subscribeToChat(sessionId.value, (newMessage) => {
      // Check if message already exists
      if (!messages.value.find(m => m.id === newMessage.id)) {
        messages.value.push(newMessage)
      }
    })
  }
})

// Cleanup on unmount
onUnmounted(() => {
  if (unsubscribeChat) {
    unsubscribeChat()
  }
})
</script>

<style scoped>
/* Custom animations for the blob background */
@keyframes blob {
  0% {
    transform: translate(0px, 0px) scale(1);
  }
  33% {
    transform: translate(30px, -50px) scale(1.1);
  }
  66% {
    transform: translate(-20px, 20px) scale(0.9);
  }
  100% {
    transform: translate(0px, 0px) scale(1);
  }
}

.animate-blob {
  animation: blob 7s infinite;
}

.animation-delay-2000 {
  animation-delay: 2s;
}

.animation-delay-4000 {
  animation-delay: 4s;
}

/* Fade in animation for the title */
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fade-in 1s ease-out;
}
</style>
