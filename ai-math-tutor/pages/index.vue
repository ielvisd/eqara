<template>
  <div class="min-h-screen bg-gradient-to-br from-violet-50 via-blue-50 to-cyan-50 dark:from-gray-900 dark:via-purple-900 dark:to-violet-900">
    <!-- Animated background elements -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 dark:bg-purple-600 rounded-full mix-blend-multiply dark:mix-blend-overlay filter blur-xl opacity-20 animate-blob"></div>
      <div class="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-300 dark:bg-yellow-600 rounded-full mix-blend-multiply dark:mix-blend-overlay filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
      <div class="absolute top-40 left-40 w-80 h-80 bg-pink-300 dark:bg-pink-600 rounded-full mix-blend-multiply dark:mix-blend-overlay filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
    </div>

    <UContainer class="py-8 max-w-5xl relative z-10">
      <!-- Enhanced Header -->
      <div class="text-center mb-12">
        <div class="inline-flex items-center gap-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full px-6 py-3 mb-6 shadow-lg">
          <div class="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center">
            <UIcon name="i-lucide-graduation-cap" class="size-6 text-white" />
          </div>
          <div class="text-left">
            <div class="text-sm font-medium text-purple-600 dark:text-purple-400">AI Math Tutor</div>
            <div class="text-xs text-gray-500 dark:text-gray-400">Powered by xAI</div>
          </div>
        </div>

        <h1 class="text-5xl md:text-6xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 dark:from-purple-400 dark:via-blue-400 dark:to-cyan-400 bg-clip-text text-transparent mb-6 animate-fade-in">
          🎓 Master Mathematics
        </h1>

        <p class="text-xl text-gray-600 dark:text-gray-300 mb-4 max-w-2xl mx-auto leading-relaxed">
          Upload a math problem or describe it below
        </p>

        <div class="flex flex-wrap justify-center gap-4 mb-8">
          <UBadge variant="subtle" color="purple" class="px-3 py-1">
            <UIcon name="i-lucide-camera" class="size-4 mr-1" />
            Image Upload
          </UBadge>
          <UBadge variant="subtle" color="blue" class="px-3 py-1">
            <UIcon name="i-lucide-message-circle" class="size-4 mr-1" />
            Chat Interface
          </UBadge>
          <UBadge variant="subtle" color="green" class="px-3 py-1">
            <UIcon name="i-lucide-trophy" class="size-4 mr-1" />
            XP Rewards
          </UBadge>
        </div>

        <p class="text-lg text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
          Get instant help with step-by-step solutions and earn XP as you learn! 🚀
        </p>
      </div>

      <!-- Enhanced Upload Section -->
      <UCard class="mb-8 shadow-xl border-0 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
                <UIcon name="i-lucide-camera" class="size-5 text-white" />
              </div>
              <div>
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Upload Math Problem</h2>
                <p class="text-sm text-gray-600 dark:text-gray-400">Take a photo or upload an image of your math problem</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <div class="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-xs font-medium rounded-full">
                <UIcon name="i-lucide-check-circle" class="size-3 mr-1" />
                OCR Ready
              </div>
            </div>
          </div>
        </template>

        <!-- Enhanced File Upload -->
        <div class="space-y-6">
          <UFormField label="Select an image" class="mb-4" required>
            <UFileUpload
              v-model="files"
              accept="image/jpeg,image/png,image/gif,image/webp"
              icon="i-lucide-image-plus"
              label="Click to upload or drag and drop"
              description="JPG, PNG, GIF, WebP up to 5MB • High quality recommended"
              variant="area"
              layout="grid"
              :multiple="false"
              :dropzone="true"
              :interactive="true"
              class="min-h-56 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-purple-400 dark:hover:border-purple-500 transition-colors duration-200"
            />
          </UFormField>

          <!-- Quick Tips -->
          <div class="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <div class="flex items-start gap-3">
              <UIcon name="i-lucide-lightbulb" class="size-5 text-yellow-500 mt-0.5 flex-shrink-0" />
              <div>
                <h4 class="font-semibold text-gray-900 dark:text-white mb-1">📸 Photography Tips</h4>
                <ul class="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• Ensure good lighting and clear handwriting</li>
                  <li>• Crop closely around the problem</li>
                  <li>• Avoid blurry or angled photos</li>
                </ul>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex gap-4">
            <UButton
              :disabled="!hasFile"
              icon="i-lucide-search"
              color="primary"
              size="lg"
              block
              :loading="isProcessing"
              class="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-200"
              @click="processImage"
            >
              <span class="font-semibold">Analyze Problem</span>
            </UButton>

            <UButton
              icon="i-lucide-refresh-cw"
              color="neutral"
              variant="outline"
              size="lg"
              block
              :disabled="isProcessing"
              class="border-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200"
              @click="clearUpload"
            >
              Start Over
            </UButton>
          </div>
        </div>
      </UCard>

      <!-- Enhanced Chat Interface Section -->
      <UCard class="mb-8 shadow-xl border-0 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center shadow-lg">
                <UIcon name="i-lucide-message-circle" class="size-5 text-white" />
              </div>
              <div>
                <h3 class="text-2xl font-bold text-gray-900 dark:text-white">AI Math Tutor Chat</h3>
                <p class="text-sm text-gray-600 dark:text-gray-400">Get step-by-step explanations and guidance</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <div class="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-full">
                <UIcon name="i-lucide-brain" class="size-3 mr-1" />
                xAI Powered
              </div>
              <div v-if="messages.length > 0" class="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-xs font-medium rounded-full">
                {{ messages.length }} messages
              </div>
            </div>
          </div>
        </template>

        <!-- Enhanced Chat Messages -->
        <div v-if="messages.length > 0" class="mb-6 min-h-[400px] max-h-[600px] overflow-hidden border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900/50">
          <div class="min-h-[400px] max-h-[600px] overflow-y-auto p-4 space-y-4">
            <UChatMessages :messages="chatMessages" :status="chatStatus" should-auto-scroll>
              <template #content="{ message }">
                <div class="prose prose-sm dark:prose-invert max-w-none">
                  <template v-for="msg in messages" :key="msg.id">
                    <template v-if="msg.id === message.id">
                      <div v-if="msg.role === 'user'" class="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-3 border-l-4 border-blue-500">
                        <div class="flex items-center gap-2 mb-2">
                          <UIcon name="i-lucide-user" class="size-4 text-blue-600" />
                          <span class="text-sm font-medium text-blue-600">You</span>
                        </div>
                        <p class="text-gray-800 dark:text-gray-200">{{ msg.content }}</p>
                      </div>
                      <div v-else class="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
                        <div class="flex items-center gap-2 mb-3">
                          <div class="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center">
                            <UIcon name="i-lucide-brain" class="size-4 text-white" />
                          </div>
                          <div>
                            <span class="text-sm font-medium text-gray-900 dark:text-white">AI Math Tutor</span>
                            <div class="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                              <UIcon name="i-lucide-clock" class="size-3" />
                              {{ formatTime(msg.timestamp) }}
                            </div>
                          </div>
                        </div>
                        <div class="space-y-3">
                          <p class="text-gray-800 dark:text-gray-200 font-medium leading-relaxed">{{ msg.content }}</p>
                          <div v-if="msg.steps" class="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                            <div class="flex items-center gap-2 mb-3">
                              <UIcon name="i-lucide-list-ordered" class="size-4 text-green-600" />
                              <span class="text-sm font-semibold text-green-700 dark:text-green-300">Solution Steps</span>
                            </div>
                            <ol class="space-y-2">
                              <li v-for="(step, index) in msg.steps" :key="index" class="flex items-start gap-3">
                                <span class="flex-shrink-0 w-6 h-6 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-xs font-bold rounded-full flex items-center justify-center mt-0.5">
                                  {{ index + 1 }}
                                </span>
                                <span class="text-gray-700 dark:text-gray-300 leading-relaxed">{{ step }}</span>
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

        <!-- Enhanced Empty State -->
        <div v-else class="min-h-[400px] flex items-center justify-center">
          <div class="text-center space-y-6 max-w-md">
            <div class="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg mx-auto">
              <span class="text-4xl">🎓</span>
            </div>
            <div>
              <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">Ready to Learn Math?</h3>
              <p class="text-gray-600 dark:text-gray-400 mb-6">Upload an image of your math problem or start chatting with your AI tutor below!</p>
              <div class="grid grid-cols-2 gap-4 text-left">
                <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                  <span class="text-2xl mb-1">📷</span>
                  <div class="text-sm font-medium text-blue-700 dark:text-blue-300">Image Upload</div>
                  <div class="text-xs text-blue-600 dark:text-blue-400">OCR-powered analysis</div>
                </div>
                <div class="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
                  <span class="text-2xl mb-1">💬</span>
                  <div class="text-sm font-medium text-purple-700 dark:text-purple-300">Chat Support</div>
                  <div class="text-xs text-purple-600 dark:text-purple-400">Step-by-step guidance</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Enhanced Chat Prompt -->
        <div class="mt-6">
          <UChatPrompt
            v-model="textProblem"
            placeholder="Ask me anything: 'Solve 2x + 3 = 7', 'Explain derivatives', or 'Help with geometry'..."
            :loading="isProcessing"
            :disabled="isProcessing"
            class="border-2 border-gray-200 dark:border-gray-700 focus-within:border-purple-400 dark:focus-within:border-purple-500 transition-colors duration-200"
            @submit="processText"
          >
            <template #leading>
              <div class="flex items-center gap-2 px-3">
                <UIcon name="i-lucide-sparkles" class="size-5 text-purple-500" />
              </div>
            </template>
            <template #trailing>
              <div class="flex items-center gap-2 px-3">
                <UChatPromptSubmit :status="chatStatus" @stop="stopProcessing" />
              </div>
            </template>
          </UChatPrompt>

          <!-- Typing Indicator -->
          <div v-if="isProcessing && chatStatus === 'streaming'" class="mt-3 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <UIcon name="i-lucide-loader-2" class="size-4 animate-spin" />
            AI is thinking...
          </div>
        </div>
      </UCard>

      <!-- Enhanced Loading State Card -->
      <UCard v-if="isProcessing && messages.length === 0" class="mb-8 shadow-xl border-0 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
        <div class="text-center space-y-6 py-8">
          <div class="relative">
            <div class="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg mx-auto animate-pulse">
              <UIcon name="i-lucide-brain" class="size-10 text-white animate-bounce" />
            </div>
            <div class="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center animate-ping">
              <UIcon name="i-lucide-sparkles" class="size-4 text-yellow-800" />
            </div>
          </div>

          <div>
            <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">Analyzing Your Problem</h3>
            <p class="text-gray-600 dark:text-gray-400 mb-6">Using advanced AI to understand your math question...</p>

            <div class="space-y-3 max-w-sm mx-auto">
              <div class="flex items-center gap-3">
                <div class="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span class="text-sm text-gray-600 dark:text-gray-400">Reading your input</span>
              </div>
              <div class="flex items-center gap-3">
                <div class="w-2 h-2 bg-purple-500 rounded-full animate-pulse animation-delay-300"></div>
                <span class="text-sm text-gray-600 dark:text-gray-400">Processing with AI</span>
              </div>
              <div class="flex items-center gap-3">
                <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse animation-delay-600"></div>
                <span class="text-sm text-gray-600 dark:text-gray-400">Generating solution</span>
              </div>
            </div>
          </div>

          <UProgress :model-value="null" class="max-w-sm mx-auto" />
        </div>
      </UCard>

      <!-- Footer with gamification and branding -->
      <div class="mt-12 text-center border-t border-gray-200 dark:border-gray-700 pt-8">
        <div class="max-w-4xl mx-auto">
          <div class="grid md:grid-cols-3 gap-8 mb-8">
            <!-- Stats Card -->
            <div class="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
              <div class="flex items-center gap-3 mb-3">
                <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <UIcon name="i-lucide-trophy" class="size-5 text-white" />
                </div>
                <div>
                  <div class="text-sm font-medium text-gray-900 dark:text-white">Your Progress</div>
                  <div class="text-xs text-gray-600 dark:text-gray-400">Keep learning!</div>
                </div>
              </div>
              <div class="space-y-2">
                <div class="flex justify-between text-sm">
                  <span class="text-gray-600 dark:text-gray-400">Problems Solved</span>
                  <span class="font-semibold text-gray-900 dark:text-white">{{ messages.filter(m => m.role === 'assistant').length }}</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-gray-600 dark:text-gray-400">XP Earned</span>
                  <span class="font-semibold text-purple-600 dark:text-purple-400">{{ messages.filter(m => m.role === 'assistant').length * 15 }}</span>
                </div>
              </div>
            </div>

            <!-- Features Card -->
            <div class="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg p-6 border border-green-200 dark:border-green-800">
              <div class="flex items-center gap-3 mb-3">
                <div class="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <UIcon name="i-lucide-zap" class="size-5 text-white" />
                </div>
                <div>
                  <div class="text-sm font-medium text-gray-900 dark:text-white">AI-Powered</div>
                  <div class="text-xs text-gray-600 dark:text-gray-400">Advanced mathematics</div>
                </div>
              </div>
              <ul class="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Step-by-step solutions</li>
                <li>• Image OCR analysis</li>
                <li>• 24/7 availability</li>
                <li>• Multiple subjects</li>
              </ul>
            </div>

            <!-- Learning Tips Card -->
            <div class="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-6 border border-purple-200 dark:border-purple-800">
              <div class="flex items-center gap-3 mb-3">
                <div class="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                  <UIcon name="i-lucide-lightbulb" class="size-5 text-white" />
                </div>
                <div>
                  <div class="text-sm font-medium text-gray-900 dark:text-white">Learning Tips</div>
                  <div class="text-xs text-gray-600 dark:text-gray-400">Study smarter</div>
                </div>
              </div>
              <ul class="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Practice regularly</li>
                <li>• Show your work</li>
                <li>• Ask questions</li>
                <li>• Learn from mistakes</li>
              </ul>
            </div>
          </div>

          <!-- Branding and links -->
          <div class="flex flex-col md:flex-row items-center justify-between gap-4 py-6 border-t border-gray-200 dark:border-gray-700">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
                <UIcon name="i-lucide-graduation-cap" class="size-4 text-white" />
              </div>
              <span class="text-sm text-gray-600 dark:text-gray-400">
                Built with ❤️ using Nuxt UI & xAI
              </span>
            </div>

            <div class="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
              <a href="#" class="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">About</a>
              <a href="#" class="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">Help</a>
              <a href="#" class="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">Privacy</a>
              <a href="#" class="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">Terms</a>
            </div>
          </div>
        </div>
      </div>
    </UContainer>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'

// useToast is auto-imported by Nuxt UI module
// @ts-expect-error - Auto-imported composable from @nuxt/ui
const toast = useToast()

// File upload state
const files = ref<File | File[] | null>(null)

// Chat state
const textProblem = ref('')
const messages = ref<Array<{
  id: string
  role: 'user' | 'assistant'
  content: string
  steps?: string[]
  timestamp: Date
}>>([])

const isProcessing = ref(false)
const chatStatus = ref<'ready' | 'submitted' | 'streaming' | 'error'>('ready')

// Computed to check if file exists
const hasFile = computed(() => {
  if (!files.value) return false
  return Array.isArray(files.value) ? files.value.length > 0 : true
})

// Get the first file for processing
const getFile = computed(() => {
  if (!files.value) return null
  return Array.isArray(files.value) ? files.value[0] : files.value
})

// Convert messages to UChatMessages format
const chatMessages = computed(() => {
  return messages.value.map(msg => ({
    id: msg.id,
    role: msg.role,
    parts: [{ type: 'text', text: msg.content }],
    createdAt: msg.timestamp
  }))
})

// Watch files for validation
watch(files, (newFile) => {
  if (!newFile) return
  
  const file = Array.isArray(newFile) ? newFile[0] : newFile
  
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

// Process uploaded image
const processImage = async () => {
  if (!hasFile.value) return

  isProcessing.value = true
  chatStatus.value = 'submitted'

  // Add user message
  const userMessage = {
    id: `user-${Date.now()}`,
    role: 'user' as const,
    content: 'Processing uploaded image...',
    timestamp: new Date()
  }
  messages.value.push(userMessage)

  try {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    chatStatus.value = 'streaming'
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Add assistant response
    const assistantMessage = {
      id: `assistant-${Date.now()}`,
      role: 'assistant' as const,
      content: 'Found the equation: 2x + 3 = 7',
      steps: [
        'Subtract 3 from both sides: 2x = 4',
        'Divide both sides by 2: x = 2',
        'Solution: x = 2'
      ],
      timestamp: new Date()
    }
    messages.value.push(assistantMessage)

    chatStatus.value = 'ready'
    
    toast.add({
      title: 'Problem solved!',
      description: 'XP Earned: +15',
      color: 'success',
      icon: 'i-lucide-check-circle'
    })
  } catch (error) {
    chatStatus.value = 'error'
    toast.add({
      title: 'Processing failed',
      description: 'An error occurred while processing your image',
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

  // Add user message
  const userMessage = {
    id: `user-${Date.now()}`,
    role: 'user' as const,
    content: userInput,
    timestamp: new Date()
  }
  messages.value.push(userMessage)

  try {
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    chatStatus.value = 'streaming'
    await new Promise(resolve => setTimeout(resolve, 500))

    // Add assistant response
    const assistantMessage = {
      id: `assistant-${Date.now()}`,
      role: 'assistant' as const,
      content: 'I see you want help with an equation. Let me guide you through it.',
      steps: [
        'Identify what you need to solve for',
        'Use inverse operations to isolate the variable',
        'Check your solution by substituting back'
      ],
      timestamp: new Date()
    }
    messages.value.push(assistantMessage)

    chatStatus.value = 'ready'
    
    toast.add({
      title: 'Response generated',
      description: 'XP Earned: +10',
      color: 'success',
      icon: 'i-lucide-lightbulb'
    })
  } catch (error) {
    chatStatus.value = 'error'
    toast.add({
      title: 'Processing failed',
      description: 'An error occurred while processing your request',
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

.animation-delay-300 {
  animation-delay: 0.3s;
}

.animation-delay-600 {
  animation-delay: 0.6s;
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

/* Enhanced focus states */
.focus-within\:border-purple-400:focus-within {
  border-color: rgb(147 51 234);
}

.dark .focus-within\:border-purple-500:focus-within {
  border-color: rgb(168 85 247);
}
</style>
