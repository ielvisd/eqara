<template>
  <div class="min-h-screen bg-black">
    <!-- Loading Overlay for Diagnostic Transition -->
    <div v-if="isLoadingFromDiagnostic" class="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center">
      <div class="text-center">
        <UIcon name="i-lucide-loader-2" class="size-12 text-pink-400 animate-spin mx-auto mb-4" />
        <h3 class="text-xl font-bold text-white mb-2">Starting Your Learning Session</h3>
        <p class="text-gray-400">Preparing your personalized practice...</p>
      </div>
    </div>

    <!-- Animated background elements with hot pink -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute -top-40 -right-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-overlay filter blur-xl opacity-10 animate-blob"></div>
      <div class="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-600 rounded-full mix-blend-overlay filter blur-xl opacity-10 animate-blob animation-delay-2000"></div>
      <div class="absolute top-40 left-40 w-80 h-80 bg-pink-400 rounded-full mix-blend-overlay filter blur-xl opacity-10 animate-blob animation-delay-4000"></div>
    </div>

    <UContainer class="py-8 max-w-7xl relative z-10">
      <!-- Breadcrumb showing current context -->
      <div v-if="allSteps.length > 0" class="mb-4 flex items-center gap-2 text-sm text-gray-400 flex-wrap">
        <UIcon name="i-lucide-home" class="size-4" />
        <span>/</span>
        <span class="text-green-400">Solving Problem</span>
        <span v-if="activeSidebarTab === 'whiteboard'" class="flex items-center gap-1">
          <span>/</span>
          <UIcon name="i-lucide-pen-tool" class="size-4 text-pink-400" />
          <span class="text-pink-400">Whiteboard</span>
        </span>
        <span v-else-if="activeSidebarTab === 'progress'" class="flex items-center gap-1">
          <span>/</span>
          <UIcon name="i-lucide-bar-chart-3" class="size-4 text-pink-400" />
          <span class="text-pink-400">Progress</span>
        </span>
        <span v-else-if="activeSidebarTab === 'steps'" class="flex items-center gap-1">
          <span>/</span>
          <UIcon name="i-lucide-list-ordered" class="size-4 text-green-400" />
          <span class="text-green-400">Steps</span>
        </span>
      </div>

      <!-- Side-by-side layout: Chat and Problem/Step -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Chat Interface (2/3 width on large screens) -->
        <div class="lg:col-span-2 relative">
          <!-- Visual Connection Indicator -->
          <div 
            v-if="activeSidebarTab === 'whiteboard' && messages.length > 0"
            class="absolute -right-3 top-1/2 transform -translate-y-1/2 z-10 hidden lg:block"
          >
            <div class="flex flex-col items-center gap-2">
              <div class="w-px h-16 bg-gradient-to-b from-pink-500/50 to-transparent"></div>
              <div class="w-8 h-8 bg-pink-500/20 rounded-full border-2 border-pink-500/50 flex items-center justify-center backdrop-blur-sm">
                <UIcon name="i-lucide-arrow-right" class="size-4 text-pink-400" />
              </div>
              <div class="w-px h-16 bg-gradient-to-b from-transparent to-pink-500/50"></div>
            </div>
          </div>
          <UCard class="shadow-2xl border border-pink-500/20 bg-black/90 backdrop-blur-sm relative">
        <template #header>
          <div class="flex flex-col gap-4">
            <!-- Logo and Title -->
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg flex items-center justify-center shadow-lg shadow-pink-500/50">
                <UIcon name="i-lucide-graduation-cap" class="size-5 text-white" />
              </div>
              <div>
                <h3 class="text-2xl font-bold bg-gradient-to-r from-pink-400 via-pink-500 to-pink-600 bg-clip-text text-transparent">Eqara</h3>
                <p class="text-xs text-gray-400 mt-0.5">Upload a math problem or start chatting with your AI tutor</p>
              </div>
            </div>
            
            <!-- Centered Action Buttons and Stats -->
            <div class="flex flex-col items-center gap-4">
              <!-- Action Buttons -->
              <div class="flex items-center gap-2 flex-wrap justify-center">
                <UButton
                  icon="i-lucide-refresh-cw"
                  color="gray"
                  variant="ghost"
                  size="sm"
                  class="text-gray-400 hover:text-pink-400 hover:bg-pink-500/10"
                  @click="resetConversation"
                  :disabled="messages.length === 0"
                  aria-label="Start a new chat conversation"
                >
                  New Chat
                </UButton>
                
                <UButton
                  icon="i-lucide-brain"
                  color="primary"
                  variant="ghost"
                  size="sm"
                  class="text-gray-400 hover:text-pink-400 hover:bg-pink-500/10"
                  @click="handleOpenKGSidebar"
                  @mouseenter="handleKGButtonHover"
                  aria-label="Open knowledge graph"
                >
                  Knowledge Graph
                </UButton>

                <!-- Whiteboard Toggle Button -->
                <UButton
                  icon="i-lucide-pen-tool"
                  color="gray"
                  variant="ghost"
                  size="sm"
                  :class="[
                    'text-gray-400 hover:text-pink-400 hover:bg-pink-500/10',
                    activeSidebarTab === 'whiteboard' ? 'text-pink-400 bg-pink-500/10' : ''
                  ]"
                  @click="activeSidebarTab = 'whiteboard'"
                  aria-label="Open whiteboard"
                >
                  Whiteboard
                </UButton>

                <!-- TTS Toggle Button -->
                <UButton
                  v-if="voiceSupported"
                  :icon="ttsEnabled ? 'i-lucide-volume-2' : 'i-lucide-volume-x'"
                  color="gray"
                  variant="ghost"
                  size="sm"
                  :class="[
                    'text-gray-400 hover:text-pink-400 hover:bg-pink-500/10',
                    ttsEnabled ? 'text-pink-400 bg-pink-500/10' : ''
                  ]"
                  @click="toggleTTS"
                  :aria-label="ttsEnabled ? 'Disable text-to-speech' : 'Enable text-to-speech'"
                >
                  <span class="sr-only">{{ ttsEnabled ? 'TTS On' : 'TTS Off' }}</span>
                </UButton>

                <!-- Auth UI -->
                <div v-if="isAuthenticated" class="flex items-center gap-2">
                  <div class="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 text-green-400 text-xs font-medium rounded-full border border-green-500/30">
                    <UIcon name="i-lucide-user-check" class="size-3.5" />
                    <span class="whitespace-nowrap">{{ userEmail }}</span>
                  </div>
                  <UButton
                    icon="i-lucide-log-out"
                    color="gray"
                    variant="ghost"
                    size="sm"
                    class="text-gray-400 hover:text-red-400"
                    @click="handleSignOut"
                    aria-label="Sign out of your account"
                  >
                    Sign Out
                  </UButton>
                </div>
                <UButton
                  v-else
                  icon="i-lucide-sparkles"
                  color="pink"
                  size="sm"
                  @click="showAuthModal = true"
                  aria-label="Sign in or sign up to save your progress"
                >
                  Sign In
                </UButton>
              </div>
              
              <!-- XP, Level, Streak Display -->
              <div v-if="gameState.xp > 0" class="flex items-center gap-3 text-sm flex-wrap justify-center">
                <div class="flex items-center gap-1.5 px-3 py-1.5 bg-pink-500/20 text-pink-400 font-medium rounded-full border border-pink-500/30">
                  <UIcon name="i-lucide-trophy" class="size-3.5" />
                  <span class="whitespace-nowrap">{{ gameState.xp }} XP</span>
                </div>
                <div class="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/20 text-purple-400 font-medium rounded-full border border-purple-500/30">
                  <UIcon name="i-lucide-star" class="size-3.5" />
                  <span class="whitespace-nowrap">Level {{ gameState.level }}</span>
                </div>
                <div v-if="gameState.currentStreak > 0" class="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/20 text-orange-400 font-medium rounded-full border border-orange-500/30">
                  <UIcon name="i-lucide-flame" class="size-3.5" />
                  <span class="whitespace-nowrap">{{ gameState.currentStreak }} Day</span>
                </div>
                <!-- Review Count Badge -->
                <button
                  v-if="dueReviewCount > 0"
                  @click="showReviewSession = true"
                  @keydown.enter="showReviewSession = true"
                  @keydown.space.prevent="showReviewSession = true"
                  class="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/20 text-blue-400 font-medium rounded-full border border-blue-500/30 hover:bg-blue-500/30 hover:border-blue-500/50 focus:bg-blue-500/30 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-black transition-all duration-200 cursor-pointer animate-pulse-slow"
                  :aria-label="`${dueReviewCount} topics ready for review - press Enter or Space to start review session`"
                  role="button"
                  tabindex="0"
                >
                  <UIcon name="i-lucide-refresh-cw" class="size-3.5" />
                  <span class="whitespace-nowrap">{{ dueReviewCount }} Review{{ dueReviewCount !== 1 ? 's' : '' }}</span>
                </button>
              </div>
            </div>
          </div>
        </template>

        <!-- Contextual Banners -->
        <div v-if="showHintBanner || showRemediationBanner || (dueReviewCount > 0 && messages.length > 0 && !isReviewBannerDismissed)" class="mb-4 space-y-3">
          <!-- Review Due Banner (contextual when chatting) -->
          <div v-if="dueReviewCount > 0 && messages.length > 0 && !isReviewBannerDismissed" class="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 relative">
            <UButton
              icon="i-lucide-x"
              color="gray"
              variant="ghost"
              size="xs"
              class="absolute top-2 right-2 text-gray-400 hover:text-white"
              :aria-label="'Dismiss review reminder'"
              @click="dismissReviewBanner"
            />
            <div class="flex items-start gap-3 pr-6">
              <UIcon name="i-lucide-refresh-cw" class="size-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div class="flex-1">
                <h4 class="text-sm font-semibold text-blue-300 mb-1">📚 {{ dueReviewCount }} Topics Ready for Review</h4>
                <p class="text-xs text-blue-200/80 mb-2">
                  Your memory is getting fuzzy on some topics - quick reviews now will help you retain them!
                </p>
                <div class="flex items-center gap-2">
                  <UButton 
                    size="xs" 
                    color="blue"
                    icon="i-lucide-arrow-right"
                    trailing
                    @click="showReviewSession = true"
                  >
                    Start Review Session
                  </UButton>
                  <UButton
                    size="xs"
                    color="gray"
                    variant="ghost"
                    @click="dismissReviewBanner"
                  >
                    Remind me later
                  </UButton>
                </div>
              </div>
            </div>
          </div>

          <!-- Hint Banner (stuck for 2+ turns) -->
          <div v-if="showHintBanner" class="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <div class="flex items-start gap-3">
              <UIcon name="i-lucide-lightbulb" class="size-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div class="flex-1">
                <h4 class="text-sm font-semibold text-blue-300 mb-1">💡 Hint Available</h4>
                <p class="text-xs text-blue-200/80">
                  Feeling stuck? I can help by reminding you of the foundations you've learned!
                  Just ask for a hint in your next message.
                </p>
              </div>
            </div>
          </div>
          
          <!-- Remediation Banner (lesson failed, needs prerequisite review) -->
          <div v-if="showRemediationBanner" class="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
            <div class="flex items-start gap-3">
              <UIcon name="i-lucide-rotate-ccw" class="size-5 text-purple-400 flex-shrink-0 mt-0.5" />
              <div class="flex-1">
                <h4 class="text-sm font-semibold text-purple-300 mb-1">🎯 Let's Build Stronger Foundations</h4>
                <p class="text-xs text-purple-200/80">
                  This topic is challenging right now. Let's review some prerequisite topics to make it easier!
                  I'll guide you through the foundations you need.
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Save Progress Prompt (Modal) -->
        <SaveProgressPrompt
          v-if="!isAuthenticated && (gameState.xp >= 50 || messages.length >= 3)"
          :message="gameState.xp >= 50 ? `You've earned ${gameState.xp} XP! Sign up to save your progress.` : 'Keep your chat history! Sign up to save your learning progress.'"
          :prompt-key="gameState.xp >= 50 ? 'xp-milestone' : 'chat-sessions'"
          @sign-up="showAuthModal = true"
        />

        <!-- Chat Messages -->
        <div v-if="messages.length > 0" class="mb-6 min-h-[400px] max-h-[600px] overflow-hidden border border-pink-500/20 rounded-lg bg-black/50">
          <div class="min-h-[400px] max-h-[600px] overflow-y-auto p-4 space-y-4">
            <UChatMessages :messages="chatMessages" :status="chatStatus" should-auto-scroll>
              <template #content="{ message }">
                <div class="prose prose-sm dark:prose-invert max-w-none">
                  <template v-for="msg in messages" :key="msg.id">
                    <template v-if="msg.id === message.id">
                      <div 
                        v-if="msg.role === 'user'" 
                        :class="[
                          'rounded-lg p-3 border-l-4 transition-all duration-300',
                          (msg as any).canvasImage 
                            ? 'bg-pink-500/15 border-pink-500 shadow-pink-500/10 shadow-lg' 
                            : 'bg-pink-500/10 border-pink-500'
                        ]"
                      >
                        <div class="flex items-center gap-2 mb-2">
                          <UIcon name="i-lucide-user" class="size-4 text-pink-400" />
                          <span class="text-sm font-medium text-pink-400">You</span>
                          <span v-if="(msg as any).canvasImage" class="px-2 py-0.5 bg-pink-500/20 text-pink-300 text-xs rounded-full border border-pink-500/30 flex items-center gap-1">
                            <UIcon name="i-lucide-pen-tool" class="size-3" />
                            Drawing
                          </span>
                        </div>
                        <p class="text-gray-200 mb-3" v-html="renderMath(msg.content)"></p>
                        <!-- Canvas Preview -->
                        <CanvasPreview
                          v-if="(msg as any).canvasImage"
                          :canvas-image="(msg as any).canvasImage"
                          @open-whiteboard="activeSidebarTab = 'whiteboard'"
                        />
                      </div>
                      <div 
                        v-else 
                        :class="[
                          'rounded-lg p-4 border shadow-lg transition-all duration-300',
                          allSteps.length > 0 
                            ? 'bg-black/50 border-green-500/30 shadow-green-500/10' 
                            : 'bg-black/50 border-pink-500/20'
                        ]"
                      >
                        <div class="flex items-center gap-2 mb-3">
                          <div class="w-8 h-8 bg-gradient-to-br from-pink-500 to-pink-600 rounded-full flex items-center justify-center">
                            <UIcon name="i-lucide-brain" class="size-4 text-white" />
                          </div>
                          <div class="flex-1">
                            <div class="flex items-center gap-2 flex-wrap">
                              <span class="text-sm font-medium text-white">Eqara</span>
                              <!-- Hint indicator if message contains hint keywords -->
                              <span v-if="isHintMessage(msg)" class="px-2 py-0.5 bg-blue-500/20 text-blue-300 text-xs rounded-full border border-blue-500/30">
                                💡 Hint
                              </span>
                              <!-- Remediation indicator if message mentions prerequisites -->
                              <span v-if="isRemediationMessage(msg)" class="px-2 py-0.5 bg-purple-500/20 text-purple-300 text-xs rounded-full border border-purple-500/30">
                                🎯 Foundation
                              </span>
                            </div>
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
                          
                          <!-- Next Problem Button (appears after XP reward) -->
                          <div v-if="msg.xpReward && msg.xpReward > 0" class="mt-3">
                            <UButton
                              color="pink"
                              size="sm"
                              icon="i-lucide-arrow-right"
                              @click="requestNextProblem"
                            >
                              Next Problem
                            </UButton>
                          </div>
                          
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

        <!-- Dashboard Home (when no messages) -->
        <div v-else class="flex-1 flex flex-col justify-center items-center">
          <DashboardHome 
            @continue-learning="handleContinueLearning"
            @start-review="showReviewSession = true"
            @view-kg="handleOpenKGSidebar"
            @practice-quiz="showQuizInterface = true"
          />
        </div>

        <!-- Legacy Empty State (fallback) -->
        <div v-if="false" class="min-h-[400px] flex items-center justify-center">
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
        <div class="mt-6 space-y-3 flex flex-col items-center">
          <!-- Image Preview if uploaded -->
          <div v-if="hasFile && getFile" :class="[
            'mb-3 p-3 bg-black/50 rounded-lg border border-pink-500/20 flex items-center justify-between',
            messages.length === 0 ? 'w-full max-w-4xl' : 'w-full max-w-4xl'
          ]">
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
                color="primary"
                variant="ghost"
                size="sm"
                :disabled="isProcessing"
                class="text-pink-400 hover:text-pink-500 hover:bg-pink-500/10"
                @click="clearUpload"
              />
            </div>
          </div>

          <div 
            :class="[
              'relative',
              messages.length === 0 ? 'w-full' : 'w-full max-w-4xl'
            ]"
            @dragover.prevent="handleDragOver"
            @dragleave.prevent="handleDragLeave"
            @drop.prevent="handleDrop"
            @dragenter.prevent="handleDragEnter"
          >
            <UChatPrompt
              v-model="textProblem"
              placeholder="Type your problem, upload an image, or draw it below"
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
                <div class="flex items-center justify-center gap-2 px-3 h-full">
                  <!-- Whiteboard Submit Shortcut (when whiteboard has drawing) -->
                  <UButton
                    v-if="activeSidebarTab === 'whiteboard' && whiteboardRef && whiteboardRef.hasDrawing"
                    icon="i-lucide-pen-tool"
                    variant="solid"
                    size="sm"
                    class="!bg-pink-500 hover:!bg-pink-600 shadow-pink-500/30 hover:shadow-pink-500/50 transition-all duration-200 animate-pulse-slow"
                    :aria-label="'Submit whiteboard drawing'"
                    @click="handleWhiteboardSubmitFromChat"
                  >
                    <span class="hidden sm:inline">Submit Drawing</span>
                  </UButton>

                  <!-- Microphone Button -->
                  <UButton
                    v-if="voiceSupported"
                    :icon="isListening ? 'i-lucide-mic' : 'i-lucide-mic-off'"
                    :color="isListening ? 'pink' : recognitionError ? 'red' : 'gray'"
                    variant="ghost"
                    size="sm"
                    :class="[
                      'transition-all duration-200',
                      isListening 
                        ? 'animate-pulse bg-pink-500/20 text-pink-400' 
                        : recognitionError
                        ? 'text-red-400 hover:text-red-300'
                        : 'text-gray-400 hover:text-pink-400 hover:bg-pink-500/10'
                    ]"
                    :disabled="isProcessing || isDragging"
                    :aria-label="isListening ? 'Stop listening' : 'Start voice input'"
                    @click="handleVoiceToggle"
                  >
                    <span class="sr-only">{{ isListening ? 'Listening' : 'Start voice input' }}</span>
                  </UButton>
                  
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

        <!-- Tabbed Sidebar (1/3 width on large screens) -->
        <div class="lg:col-span-1 relative">
          <UCard 
            :class="[
              'shadow-2xl border bg-black/90 backdrop-blur-sm sticky top-8 h-[calc(100vh-4rem)] flex flex-col transition-all duration-300',
              activeSidebarTab === 'whiteboard' ? 'border-pink-500/40 shadow-pink-500/20' :
              'border-green-500/40 shadow-green-500/20'
            ]"
            :ui="{
              body: 'flex-1 min-h-0 flex flex-col p-0'
            }"
          >
            <!-- Tabbed Interface -->
            <UTabs 
              v-model="activeSidebarTab" 
              :items="sidebarTabs" 
              variant="link"
              class="flex-1 flex flex-col overflow-hidden"
              :ui="{ 
                root: 'flex flex-col h-full overflow-hidden', 
                list: 'flex gap-1 min-w-0 overflow-x-auto', 
                trigger: 'flex-shrink-0 min-w-fit px-3',
                content: 'flex-1 min-h-0 flex flex-col overflow-hidden'
              }"
              :unmount-on-hide="false"
            >
              <template #item="{ item: tabItem }">
                <div 
                  class="flex items-center gap-2 whitespace-nowrap"
                  :title="tabItem.label"
                  :aria-label="tabItem.label"
                >
                  <UIcon :name="tabItem.icon" class="size-4 flex-shrink-0" />
                  <span class="text-sm">
                    <span class="hidden sm:inline">{{ tabItem.label }}</span>
                    <span class="sm:hidden">{{ tabItem.shortLabel || tabItem.label }}</span>
                  </span>
                </div>
              </template>

              <!-- Whiteboard Tab -->
              <template #whiteboard>
                <div class="flex-1 flex flex-col gap-3 min-h-0">
                  <!-- First-time user hint -->
                  <div v-if="!hasSeenWhiteboardHint" class="mb-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg text-sm text-blue-300">
                    <div class="flex items-start gap-2">
                      <UIcon name="i-lucide-lightbulb" class="size-4 mt-0.5 flex-shrink-0" />
                      <div class="flex-1">
                        <p class="font-medium mb-1">Tip: Draw your solution here</p>
                        <p class="text-xs text-blue-400">Click "Submit Drawing" below when you're done, or use the button in the chat above.</p>
                      </div>
                      <UButton
                        size="xs"
                        variant="ghost"
                        icon="i-lucide-x"
                        class="text-blue-400"
                        @click="hasSeenWhiteboardHint = true"
                        aria-label="Dismiss hint"
                      />
                    </div>
                  </div>
                  
                  <div class="flex-1 overflow-hidden min-h-0">
                    <div class="h-[calc(100vh-12rem)] lg:h-[calc(100vh-12rem)] md:h-[500px] h-[400px]">
                      <InteractiveWhiteboard
                        ref="whiteboardRef"
                        :show-controls="true"
                        :readonly="false"
                        @submit="handleWhiteboardSubmit"
                        @draw="updateWhiteboardState"
                      />
                    </div>
                  </div>
                  
                  <!-- Visual indicator when drawing exists but not submitted -->
                  <div 
                    v-if="whiteboardRef && whiteboardRef.hasDrawing && activeSidebarTab === 'whiteboard'"
                    class="mt-2 p-2 bg-pink-500/10 border border-pink-500/30 rounded-lg text-center"
                  >
                    <p class="text-xs text-pink-300 flex items-center justify-center gap-2">
                      <UIcon name="i-lucide-pen-tool" class="size-3 animate-pulse" />
                      <span>Drawing ready - submit below or use the button in chat</span>
                    </p>
                  </div>
                </div>
              </template>

              <!-- Progress Tab -->
              <template #progress>
                <div class="flex-1 h-full min-h-0 overflow-y-auto overflow-x-hidden p-4" style="overscroll-behavior: contain;">
                  <MasteryDashboard
                    ref="masteryDashboardRef"
                    :user-id="user?.id"
                    :session-id="sessionId"
                  />
                </div>
              </template>

              <!-- Steps Tab -->
              <template #steps>
                <div class="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
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
                          isFinalSolution(step.equation) && index === allSteps.length - 1
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
                            v-if="step.isCorrect && isFinalSolution(step.equation) && index === allSteps.length - 1" 
                            name="i-lucide-check-circle" 
                            class="size-5 text-green-400 flex-shrink-0"
                          />
                        </div>
                        <div v-if="step.equation.match(/^\d+x/i) && step.isCorrect" class="text-xs text-gray-400 text-center mt-2">
                          Intermediate Step
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
              </template>
            </UTabs>
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
              <span class="font-semibold text-white">{{ messages.filter((m: typeof messages.value[0]) => m.role === 'assistant').length }}</span>
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

    <!-- Knowledge Graph Sidebar -->
    <ClientOnly>
      <KGSidebar
        v-model="showKGSidebar"
        :user-id="undefined"
        :session-id="sessionId"
        @topic-select="handleTopicSelect"
      />
    </ClientOnly>

    <!-- Review Session Modal -->
    <UModal v-model:open="showReviewSession" :ui="{ width: 'max-w-5xl' }">
      <template v-if="showReviewSession">
        <ReviewSession @close="showReviewSession = false" />
      </template>
    </UModal>

    <!-- Quiz Slideover - Opens from the left -->
    <USlideover 
      v-model:open="showQuizInterface" 
      side="left"
      title="Practice Quiz"
      description="Test your knowledge and strengthen your mastery!"
      :ui="{
        header: 'bg-black border-b border-pink-500/20',
        title: 'text-white font-bold',
        description: 'text-pink-400',
        content: 'bg-black',
        body: 'bg-black'
      }"
    >
      <template #body>
        <QuizInterface v-if="showQuizInterface" @close="showQuizInterface = false" />
      </template>
    </USlideover>

    <!-- Auth Modal -->
    <AuthModal
      v-if="showAuthModal"
      v-model="showAuthModal"
      :has-anonymous-data="hasAnonymousData"
    />

    <!-- Floating Action Buttons (FABs) - Always visible, no scrolling needed -->
    <div 
      class="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 items-end"
      :class="{
        'sm:bottom-20 md:bottom-6': messages.length > 0, // Move up on mobile when chat input is visible
      }"
    >
      <!-- Review FAB (shown when reviews are due) -->
      <div
        v-if="dueReviewCount > 0"
        class="relative"
      >
        <UButton
          icon="i-lucide-refresh-cw"
          color="primary"
          size="xl"
          :ui="{ rounded: 'rounded-full', padding: { xl: 'p-4' } }"
          class="!w-14 !h-14 md:!w-14 md:!h-14 sm:!w-12 sm:!h-12 !bg-gradient-to-br !from-blue-500 !to-cyan-600 hover:!from-blue-600 hover:!to-cyan-700 !shadow-lg !shadow-blue-500/50 hover:!shadow-blue-500/70 !transition-all !duration-300 hover:!scale-110 !animate-pulse-slow focus:!ring-2 focus:!ring-blue-400 focus:!ring-offset-2 focus:!ring-offset-black"
          :aria-label="`${dueReviewCount} topics ready for review`"
          @click.stop="showReviewSession = true"
          @keydown.enter.stop="showReviewSession = true"
          @keydown.space.prevent.stop="showReviewSession = true"
        >
        </UButton>
        <!-- Badge with count -->
        <div class="absolute -top-1 -right-1 w-6 h-6 md:w-6 md:h-6 sm:w-5 sm:h-5 bg-red-500 rounded-full flex items-center justify-center border-2 border-black shadow-lg">
          <span class="text-xs md:text-xs sm:text-[10px] font-bold text-white">{{ dueReviewCount > 99 ? '99+' : dueReviewCount }}</span>
        </div>
      </div>

    </div>

    <!-- Quiz FAB (always visible, draggable) - Positioned independently -->
    <div
      ref="quizFabRef"
      class="fixed group cursor-move select-none"
      :style="{ bottom: `${quizFabPosition.y}px`, right: `${quizFabPosition.x}px`, zIndex: 100 }"
      @mousedown.prevent="startDrag($event, 'quiz')"
      @touchstart.prevent="startDrag($event, 'quiz')"
    >
      <div class="flex items-center gap-3">
        <!-- Label (shown on hover) -->
        <div class="bg-gradient-to-r from-black/95 to-black/90 backdrop-blur-sm border border-pink-500/40 rounded-lg px-4 py-2.5 shadow-xl shadow-pink-500/30 pointer-events-none transition-all duration-300 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0">
          <span class="text-sm font-semibold bg-gradient-to-r from-pink-400 to-pink-600 bg-clip-text text-transparent whitespace-nowrap">Practice Quiz</span>
        </div>
        
        <!-- FAB Button -->
        <button
          type="button"
          class="relative w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-black via-black to-gray-900 border-2 border-pink-500/60 hover:border-pink-500 shadow-2xl shadow-pink-500/40 hover:shadow-pink-500/60 transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:ring-offset-2 focus:ring-offset-black flex items-center justify-center group/button"
          :class="{ 'cursor-grabbing': isDraggingFab, 'cursor-grab': !isDraggingFab }"
          aria-label="Start practice quiz"
          @click.stop.prevent="handleQuizFabClick"
          @keydown.enter.stop.prevent="showQuizInterface = true"
          @keydown.space.prevent.stop="showQuizInterface = true"
        >
          <!-- Glow effect -->
          <div class="absolute inset-0 rounded-full bg-gradient-to-br from-pink-500/20 to-purple-500/20 blur-md opacity-50 group-hover/button:opacity-75 transition-opacity duration-300"></div>
          
          <!-- Icon -->
          <UIcon 
            name="i-lucide-clipboard-check" 
            class="relative z-10 size-6 md:size-7 text-pink-400 group-hover/button:text-pink-300 transition-colors duration-300"
          />
          
          <!-- Shine effect on hover -->
          <div class="absolute inset-0 rounded-full bg-gradient-to-br from-transparent via-white/10 to-transparent opacity-0 group-hover/button:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// ref, watch, computed, onMounted, onUnmounted are auto-imported by Nuxt

// useToast is auto-imported by Nuxt UI module
const toast = useToast()

// Chat history and gamification
const { getSessionId, saveMessage, loadChatHistory, subscribeToChat, resetSession, clearChatHistory } = useChatHistory()
const { gameState, addXP } = useGamification()

// Voice interface
const {
  isListening,
  isSpeaking,
  ttsEnabled,
  isSupported: voiceSupported,
  recognitionError,
  currentTranscript,
  startListening,
  stopListening,
  getTranscript,
  clearTranscript,
  toggleTTS,
  speak,
  stopSpeaking,
  cleanup: cleanupVoice
} = useVoice()

// KaTeX for math rendering
const { renderMath, extractCurrentEquation, extractCurrentStep, extractLastOperation, extractAllSteps, findCurrentProblemStart } = useKaTeX()

// Whiteboard state
const whiteboardState = useWhiteboard()
const whiteboardRef = ref<any>(null)
// Mastery Dashboard ref
const masteryDashboardRef = ref<any>(null)
// Initialize Whiteboard tab as default - must match a tab's slot value
const activeSidebarTab = ref('whiteboard')
const hasSeenWhiteboardHint = ref(false)

// Update whiteboard state when drawing occurs
const updateWhiteboardState = () => {
  // Trigger reactivity for hasDrawing check
  nextTick()
}

// Sidebar tabs configuration
// UTabs uses slot names as identifiers - v-model should match the slot name
const sidebarTabs = [
  { label: 'Steps', shortLabel: 'Steps', icon: 'i-lucide-list-ordered', slot: 'steps', value: 'steps' },
  { label: 'Whiteboard', shortLabel: 'Board', icon: 'i-lucide-pen-tool', slot: 'whiteboard', value: 'whiteboard' },
  { label: 'Progress', shortLabel: 'Stats', icon: 'i-lucide-bar-chart-3', slot: 'progress', value: 'progress' }
]

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
const showKGSidebar = ref(false)
const showQuizInterface = ref(false)
const showReviewSession = ref(false)
const showAuthModal = ref(false)
const isLoadingFromDiagnostic = ref(false)
let unsubscribeChat: (() => void) | null = null

// Auth state
const { user, isAuthenticated, signOut } = useAuth()
const userEmail = computed(() => user.value?.email || '')
const hasAnonymousData = computed(() => {
  return messages.value.length > 0 || gameState.value.xp > 0
})

// Smart button visibility
const dueReviewCount = ref(0)
const hasPracticedTopics = ref(false)

// Draggable FAB state
const quizFabRef = ref<HTMLElement | null>(null)
const quizFabPosition = ref({ x: 24, y: 24 })
const isDraggingFab = ref(false)
const dragStartPos = ref({ x: 0, y: 0 })
const fabStartPos = ref({ x: 0, y: 0 })
const hasDragged = ref(false)

// Load saved FAB position from localStorage  
onMounted(() => {
  // Ensure Steps tab is selected on mount - UTabs might not sync initial value properly
  nextTick(() => {
    activeSidebarTab.value = 'steps'
  })
  
  const saved = localStorage.getItem('quizFabPosition')
  if (saved) {
    try {
      quizFabPosition.value = JSON.parse(saved)
    } catch (e) {
      console.error('Failed to load FAB position:', e)
    }
  }
})

// Save FAB position to localStorage
const saveFabPosition = () => {
  localStorage.setItem('quizFabPosition', JSON.stringify(quizFabPosition.value))
}

// Handle Quiz FAB click (prevent if dragged)
const handleQuizFabClick = () => {
  if (!hasDragged.value) {
    showQuizInterface.value = true
  }
  hasDragged.value = false
}

// Drag handlers
const startDrag = (e: MouseEvent | TouchEvent, type: 'quiz') => {
  if (type === 'quiz') {
    isDraggingFab.value = true
    hasDragged.value = false
    const clientX = 'touches' in e && e.touches[0] ? e.touches[0].clientX : (e as MouseEvent).clientX
    const clientY = 'touches' in e && e.touches[0] ? e.touches[0].clientY : (e as MouseEvent).clientY
    
    dragStartPos.value = { x: clientX, y: clientY }
    fabStartPos.value = { ...quizFabPosition.value }
    
    document.addEventListener('mousemove', handleDrag)
    document.addEventListener('touchmove', handleDrag)
    document.addEventListener('mouseup', stopDrag)
    document.addEventListener('touchend', stopDrag)
  }
}

const handleDrag = (e: MouseEvent | TouchEvent) => {
  if (!isDraggingFab.value) return
  
  e.preventDefault()
  
  const clientX = 'touches' in e && e.touches[0] ? e.touches[0].clientX : (e as MouseEvent).clientX
  const clientY = 'touches' in e && e.touches[0] ? e.touches[0].clientY : (e as MouseEvent).clientY
  
  // Calculate delta from drag start
  const deltaX = dragStartPos.value.x - clientX
  const deltaY = clientY - dragStartPos.value.y // Positive when dragging down, negative when dragging up
  
  // Mark as dragged if moved more than 10px (to avoid accidental drags on clicks)
  if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
    hasDragged.value = true
  }
  
  // Only update position if actually dragging
  if (hasDragged.value) {
    // Calculate new position (constrained to viewport)
    const fabSize = 56 // 14 * 4 (w-14 = 3.5rem = 56px)
    const maxX = window.innerWidth - fabSize
    const maxY = window.innerHeight - fabSize
    
    // For X: right positioning, so dragging right decreases x
    const newX = Math.max(0, Math.min(maxX, fabStartPos.value.x + deltaX))
    
    // For Y: bottom positioning, so dragging down decreases y (moves up from bottom)
    // dragging up increases y (moves down from top, closer to bottom)
    const newY = Math.max(0, Math.min(maxY, fabStartPos.value.y - deltaY))
    
    quizFabPosition.value = { x: newX, y: newY }
  }
}

const stopDrag = () => {
  if (isDraggingFab.value) {
    isDraggingFab.value = false
    saveFabPosition()
    
    document.removeEventListener('mousemove', handleDrag)
    document.removeEventListener('touchmove', handleDrag)
    document.removeEventListener('mouseup', stopDrag)
    document.removeEventListener('touchend', stopDrag)
  }
}

// Cleanup on unmount
onUnmounted(() => {
  stopDrag()
})

// Hint and remediation tracking
const stuckTurnCount = ref(0)
const showHintBanner = ref(false)
const showRemediationBanner = ref(false)
const isReviewBannerDismissed = ref(false)

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
  return messages.value.map((msg: typeof messages.value[0]) => ({
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

// Check if an equation is a final solution (x = number) vs intermediate (2x = number)
const isFinalSolution = (equation: string): boolean => {
  // Final solution has no coefficient before x (just "x = number")
  // Intermediate steps have coefficients (like "2x = 8")
  return equation.match(/^[^0-9]*x\s*=\s*\d+$/i) !== null && equation.match(/^\d+x/i) === null
}

// Extract final solution (x = value)
const finalSolution = computed(() => {
  if (allSteps.value.length === 0) return null
  const lastStep = allSteps.value[allSteps.value.length - 1]
  if (!lastStep) return null
  
  // Only extract solution if this is actually a final solution (not an intermediate like "2x = 8")
  if (!isFinalSolution(lastStep.equation)) return null
  
  const match = lastStep.equation.match(/x\s*=\s*(\d+)/i)
  return match && match[1] ? match[1] : null
})

// Check if there's verification in the conversation (only for current problem)
const hasVerification = computed(() => {
  if (!finalSolution.value) return false
  // Only look for substitution/verification mentions in the current problem messages
  const currentProblemMessages = messages.value.slice(currentProblemStart.value)
  const hasSubstitution = currentProblemMessages.some((msg: typeof messages.value[0]) => {
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
watch(files, (newFile: File | File[] | null) => {
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

    // Update hint/remediation banners
    updateBanners()

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

// Handle whiteboard drawing submission
// Handle whiteboard submit from chat shortcut button
const handleWhiteboardSubmitFromChat = async () => {
  if (!whiteboardRef.value || !whiteboardRef.value.hasDrawing) return
  try {
    const imageData = await whiteboardRef.value.exportCanvas()
    await handleWhiteboardSubmit(imageData)
  } catch (error) {
    console.error('Error submitting whiteboard from chat:', error)
  }
}

const handleWhiteboardSubmit = async (canvasImageData: string) => {
  if (!whiteboardRef.value || isProcessing.value) return

  isProcessing.value = true
  chatStatus.value = 'submitted'

  // Get current problem context
  const currentProblem = extractCurrentEquation(messages.value) || ''
  const currentStep = extractCurrentStep(messages.value) || ''
  const problemStart = findCurrentProblemStart(messages.value)

  // Create user message with canvas preview
  const userMessage = {
    id: `user-${Date.now()}`,
    role: 'user' as const,
    content: '📝 [Drawing submitted]',
    timestamp: new Date(),
    canvasImage: canvasImageData
  }
  messages.value.push(userMessage)
  await saveMessage(userMessage, sessionId.value)

  try {
    chatStatus.value = 'streaming'

    // Prepare context for vision API
    const context = {
      currentProblem: currentProblem,
      currentStep: currentStep,
      topic: messages.value[problemStart]?.content || ''
    }

    // Call vision API with whiteboard analysis
    const visionResponse = await $fetch<{
      success: boolean
      isCorrect: boolean
      confidence: number
      errors: string[]
      nextSteps: string[]
      explanation: string
      extractedSolution: string
      provider?: string
      timestamp?: string
    }>('/api/vision', {
      method: 'POST',
      body: {
        canvasSnapshot: canvasImageData,
        analyzeDrawing: true,
        context: context
      }
    })

    if (!visionResponse.success) {
      throw new Error('Failed to analyze drawing')
    }

    // Prepare chat history for context
    const chatHistory = messages.value
      .slice(0, -1) // Exclude current user message
      .map((msg: typeof messages.value[0]) => ({
        role: msg.role,
        content: msg.content
      }))

    // Call chat API with drawing analysis to generate Socratic response
    const chatResponse = await $fetch<{
      success: boolean
      message?: string
      xpReward?: number
      provider?: string
      timestamp?: string
      whiteboard?: {
        commands: Array<{
          type: string
          tool?: string
          from?: [number, number]
          to?: [number, number]
          center?: [number, number]
          radius?: number
          shape?: string
          content?: string
          position?: [number, number]
          color?: string
          strokeWidth?: number
          fontSize?: number
        }>
      }
    }>('/api/chat', {
      method: 'POST',
      body: {
        message: '📝 [Drawing submitted]',
        chatHistory: chatHistory,
        sessionId: sessionId.value,
        userId: user.value?.id || undefined,
        drawingAnalysis: {
          isCorrect: visionResponse.isCorrect,
          confidence: visionResponse.confidence,
          errors: visionResponse.errors,
          nextSteps: visionResponse.nextSteps,
          explanation: visionResponse.explanation,
          extractedSolution: visionResponse.extractedSolution
        }
      }
    })

    if (!chatResponse.success || !chatResponse.message) {
      throw new Error('Failed to get response from AI')
    }

    // Add assistant response
    const assistantMessage = {
      id: `assistant-${Date.now()}`,
      role: 'assistant' as const,
      content: chatResponse.message,
      timestamp: new Date(),
      xpReward: chatResponse.xpReward || 10,
      whiteboard: chatResponse.whiteboard || undefined
    }
    messages.value.push(assistantMessage)

    // Save assistant message and award XP
    await saveMessage(assistantMessage, sessionId.value)
    if (assistantMessage.xpReward) {
      await addXP(assistantMessage.xpReward)
      // Refresh mastery dashboard to show updated progress
      if (masteryDashboardRef.value?.refresh) {
        masteryDashboardRef.value.refresh()
      }
    }

    // Handle whiteboard commands if present
    if (chatResponse.whiteboard?.commands && whiteboardRef.value) {
      // Switch to whiteboard tab if not already there
      if (activeSidebarTab.value !== 'whiteboard') {
        activeSidebarTab.value = 'whiteboard'
      }
      
      // Wait for whiteboard to be ready, then render commands
      await nextTick()
      setTimeout(() => {
        if (whiteboardRef.value?.renderCommands && chatResponse.whiteboard?.commands) {
          whiteboardRef.value.renderCommands(chatResponse.whiteboard.commands)
        }
      }, 300)
    }

    // Update hint/remediation banners
    updateBanners()

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

    const errorMessage = error.data?.message || error.message || 'An error occurred while analyzing your drawing'

    toast.add({
      title: 'Analysis failed',
      description: errorMessage.includes('API')
        ? 'Please configure OPENAI_API_KEY or GROK_API_KEY in your .env file'
        : 'Please try again with a clearer drawing',
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

  // Stop voice input if active
  if (isListening.value) {
    stopListening()
    clearTranscript()
  }

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
      .map((msg: typeof messages.value[0]) => ({
        role: msg.role,
        content: msg.content
      }))

    // Check if there's an extracted problem from vision
    const extractedProblem = messages.value.find((m: typeof messages.value[0]) => 
      m.role === 'assistant' && m.content.includes('I found this problem')
    )?.content.match(/\*\*(.+?)\*\*/)?.[1]

    // Call chat API
    const response = await $fetch<{
      success: boolean
      message?: string
      xpReward?: number
      provider?: string
      timestamp?: string
      whiteboard?: {
        commands: Array<{
          type: string
          tool?: string
          from?: [number, number]
          to?: [number, number]
          center?: [number, number]
          radius?: number
          shape?: string
          content?: string
          position?: [number, number]
          color?: string
          strokeWidth?: number
          fontSize?: number
        }>
      }
    }>('/api/chat', {
      method: 'POST',
      body: {
        message: userInput,
        chatHistory: chatHistory,
        sessionId: sessionId.value,
        userId: user.value?.id || undefined,
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
      xpReward: response.xpReward || 10,
      whiteboard: response.whiteboard || undefined
    }
    messages.value.push(assistantMessage)

    // Save assistant message and award XP
    await saveMessage(assistantMessage, sessionId.value)
    if (assistantMessage.xpReward) {
      await addXP(assistantMessage.xpReward)
      // Refresh mastery dashboard to show updated progress
      if (masteryDashboardRef.value?.refresh) {
        masteryDashboardRef.value.refresh()
      }
    }

    // Handle whiteboard commands if present
    if (response.whiteboard?.commands && whiteboardRef.value) {
      // Switch to whiteboard tab if not already there
      if (activeSidebarTab.value !== 'whiteboard') {
        activeSidebarTab.value = 'whiteboard'
      }
      
      // Wait for whiteboard to be ready, then render commands
      await nextTick()
      setTimeout(() => {
        if (whiteboardRef.value?.renderCommands && response.whiteboard?.commands) {
          whiteboardRef.value.renderCommands(response.whiteboard.commands)
        }
      }, 300)
    }

    // Update hint/remediation banners
    updateBanners()

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

// Request next problem
const requestNextProblem = async () => {
  textProblem.value = "I'm ready for the next problem!"
  await processText()
}

// Voice handlers
const handleVoiceToggle = async () => {
  if (isListening.value) {
    // Stop listening and get transcript
    const transcript = stopListening()
    if (transcript.trim()) {
      textProblem.value = transcript.trim()
    }
    clearTranscript()
  } else {
    // Start listening
    if (isProcessing.value) {
      toast.add({
        title: 'Cannot start voice input',
        description: 'Please wait for the current request to complete',
        color: 'warning',
        icon: 'i-lucide-alert-circle'
      })
      return
    }
    
    // Clear any previous error
    clearTranscript()
    
    const success = await startListening()
    if (!success) {
      // Show error toast if recognitionError is set
      if (recognitionError.value) {
        toast.add({
          title: 'Voice input failed',
          description: recognitionError.value,
          color: 'error',
          icon: 'i-lucide-mic-off'
        })
      }
    }
  }
}

// Watch for transcript updates and populate input field
watch(currentTranscript, (newTranscript) => {
  if (newTranscript && isListening.value) {
    textProblem.value = newTranscript
  }
})

// Watch for recognition errors
watch(recognitionError, (error) => {
  if (error && isListening.value) {
    toast.add({
      title: 'Voice recognition error',
      description: error,
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  }
})

// Watch for new assistant messages and speak them if TTS is enabled
watch(() => messages.value.length, (newLength, oldLength) => {
  if (!ttsEnabled.value || newLength <= oldLength) return
  
  // Get the last message
  const lastMessage = messages.value[messages.value.length - 1]
  
  // Only speak assistant messages
  if (lastMessage && lastMessage.role === 'assistant') {
    // Small delay to ensure message is fully rendered
    nextTick(() => {
      setTimeout(() => {
        speak(lastMessage.content)
      }, 500)
    })
  }
}, { flush: 'post' })

// Also watch the last message content for streaming updates
const lastAssistantMessage = computed(() => {
  const assistantMessages = messages.value.filter(m => m.role === 'assistant')
  return assistantMessages[assistantMessages.length - 1]
})

watch(() => lastAssistantMessage.value?.content, (newContent, oldContent) => {
  if (!ttsEnabled.value || !newContent || newContent === oldContent) return
  
  // Only speak if message is complete (not streaming)
  // Check if content has changed significantly (more than just a few characters)
  if (oldContent && newContent.length > oldContent.length + 10) {
    // Message is still streaming, stop and restart
    stopSpeaking()
    
    // Small delay before speaking updated content
    setTimeout(() => {
      if (ttsEnabled.value && newContent) {
        speak(newContent)
      }
    }, 1000)
  }
})

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

// Check if message is a hint (contains hint keywords)
const isHintMessage = (msg: typeof messages.value[0]) => {
  const content = (msg.content || '').toLowerCase()
  return /remember|foundation|prerequisite|secret scroll|let'?s review|builds on|think back to/i.test(content)
}

// Check if message is a remediation message (mentions prerequisite topics explicitly)
const isRemediationMessage = (msg: typeof messages.value[0]) => {
  const content = (msg.content || '').toLowerCase()
  return /let'?s strengthen|review.*foundation|prerequisite|build.*foundation|consolidation|take a break/i.test(content)
}

// Count stuck turns (user responses indicating confusion/stuck)
const countStuckTurns = () => {
  let count = 0
  // Look backwards through recent messages
  for (let i = messages.value.length - 1; i >= 0 && count < 5; i--) {
    const msg = messages.value[i]
    if (msg && msg.role === 'user') {
      const content = (msg.content || '').toLowerCase()
      const isStuck = /(don'?t know|dunno|idk|not sure|unsure|cannot|can'?t|confused|stuck|help|no idea)/i.test(content) || content.length < 10
      if (isStuck) {
        count++
      } else if (content.length >= 10) {
        // Real answer attempt - stop counting
        break
      }
    }
  }
  return count
}

// Update hint/remediation banners based on conversation state
const updateBanners = () => {
  stuckTurnCount.value = countStuckTurns()
  
  // Show hint banner after 2 stuck turns
  showHintBanner.value = stuckTurnCount.value >= 2 && stuckTurnCount.value < 5
  
  // Show remediation banner after 5+ stuck turns or explicit remediation message
  const hasRemediationMessage = messages.value.some((msg: typeof messages.value[0]) => 
    msg.role === 'assistant' && isRemediationMessage(msg)
  )
  showRemediationBanner.value = stuckTurnCount.value >= 5 || hasRemediationMessage
}

// Dismiss review banner for this session
const dismissReviewBanner = () => {
  isReviewBannerDismissed.value = true
}

// Reset conversation
const resetConversation = async () => {
  if (isProcessing.value) return
  
  // Clear messages from UI
  const oldSessionId = sessionId.value
  messages.value = []
  files.value = null
  textProblem.value = ''
  stuckTurnCount.value = 0
  showHintBanner.value = false
  showRemediationBanner.value = false
  isReviewBannerDismissed.value = false
  
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
      if (!messages.value.find((m: typeof messages.value[0]) => m.id === newMessage.id)) {
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

// Preload KG data on button hover (hover intent)
let kgHoverTimeout: ReturnType<typeof setTimeout> | null = null
const handleKGButtonHover = () => {
  if (process.client && sessionId.value) {
    // Clear any existing timeout
    if (kgHoverTimeout) {
      clearTimeout(kgHoverTimeout)
    }
    
    // Preload after a short delay (hover intent)
    kgHoverTimeout = setTimeout(() => {
      const kgViz = useKGVisualization()
      // Only preload if not already cached and not loading
      if (!kgViz.isLoading.value && !kgViz.isCached(undefined, sessionId.value)) {
        console.log('🔄 Preloading KG data on button hover...')
        kgViz.preloadKGData(undefined, sessionId.value).catch(err => {
          console.warn('Failed to preload KG data on hover:', err)
        })
      }
    }, 300) // 300ms hover delay
  }
}

// Handle opening KG sidebar
const handleOpenKGSidebar = () => {
  // Ensure data is preloaded before opening
  if (process.client && sessionId.value) {
    const kgViz = useKGVisualization()
    // Start preload if not already loading/cached
    kgViz.preloadKGData(undefined, sessionId.value).catch(err => {
      console.warn('Failed to preload KG data before opening:', err)
    })
  }
  showKGSidebar.value = true
}

// Handle continue learning from dashboard
const handleContinueLearning = () => {
  // This will show the chat interface since dashboard only shows when messages.length === 0
  // User can then type their question or problem
  // Focus on the input if possible
  if (process.client) {
    const textarea = document.querySelector('textarea')
    if (textarea) {
      textarea.focus()
    }
  }
}

// Handle sign out
const handleSignOut = async () => {
  try {
    await signOut()
    
    toast.add({
      title: 'Signed out successfully',
      description: 'You can continue using Eqara anonymously',
      color: 'success',
      icon: 'i-lucide-check-circle'
    })
    
    // Generate new session ID for anonymous use
    if (process.client) {
      localStorage.removeItem('chat_session_id')
      sessionId.value = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`
      localStorage.setItem('chat_session_id', sessionId.value)
    }
  } catch (error: any) {
    console.error('Sign out failed:', error)
    toast.add({
      title: 'Sign out failed',
      description: error.message || 'Please try again',
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  }
}

// Handle topic selection from KG sidebar or diagnostic
const handleTopicSelect = async (topicId: string, autoStart: boolean = true) => {
  // Close the sidebar
  showKGSidebar.value = false
  
  // Fetch topic details
  const kg = useKnowledgeGraph()
  const topic = await kg.getTopic(topicId)
  
  if (!topic) {
    toast.add({
      title: 'Topic Not Found',
      description: 'Unable to load topic details.',
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
    return
  }
  
  // Generate learning prompt that explicitly asks for a practice problem in equation format
  const prompt = `I want to learn about ${topic.name}. Can you give me a practice problem? Please present it as an equation that I can solve.`
  
  // Toast notification
  toast.add({
    title: 'Starting Learning Session',
    description: `Let's practice ${topic.name}!`,
    color: 'success',
    icon: 'i-lucide-book-open'
  })
  
  // Programmatically trigger chat if autoStart is true
  if (autoStart) {
    textProblem.value = prompt
    await processText()
  }
}

// Fetch due review count
const fetchDueReviews = async () => {
  try {
    // Get userId and sessionId
    const { user } = useAuth()
    const userId = user.value?.id
    const sessionIdVal = sessionId.value
    
    if (!userId && !sessionIdVal) {
      console.warn('No userId or sessionId available for fetchDueReviews')
      return
    }
    
    const previousCount = dueReviewCount.value
    const response = await $fetch<any>('/api/quiz/due-reviews', {
      method: 'GET',
      query: { userId, sessionId: sessionIdVal }
    })
    
    if (response?.success && response?.topics?.length) {
      dueReviewCount.value = response.topics.length
      // Reset banner dismissal when new reviews come in
      if (dueReviewCount.value > 0) {
        isReviewBannerDismissed.value = false
      }
      
      // Screen reader announcement for new reviews
      if (process.client && previousCount === 0 && dueReviewCount.value > 0) {
        const announcement = document.createElement('div')
        announcement.setAttribute('role', 'status')
        announcement.setAttribute('aria-live', 'polite')
        announcement.setAttribute('aria-atomic', 'true')
        announcement.className = 'sr-only'
        announcement.textContent = `${dueReviewCount.value} topic${dueReviewCount.value !== 1 ? 's' : ''} ready for review. Use the floating action button or header badge to start your review session.`
        document.body.appendChild(announcement)
        setTimeout(() => {
          document.body.removeChild(announcement)
        }, 1000)
      }
    } else {
      dueReviewCount.value = 0
    }
  } catch (error) {
    console.warn('Failed to fetch due reviews:', error)
  }
}

// Check if student has practiced any topics
const checkPracticedTopics = async () => {
  try {
    // Get userId and sessionId
    const { user } = useAuth()
    const userId = user.value?.id
    const sessionIdVal = sessionId.value
    
    if (!userId && !sessionIdVal) {
      console.warn('No userId or sessionId available for checkPracticedTopics')
      return
    }
    
    // Since the API requires a domain parameter, we'll check frontier topics instead
    // to determine if the user has any progress
    const frontierResponse = await $fetch<any>('/api/knowledge-graph/frontier', {
      method: 'GET',
      query: { userId, sessionId: sessionIdVal }
    })
    
    if (frontierResponse?.success && frontierResponse?.frontierTopics) {
      // Check if any frontier topic has been practiced (mastery > 0)
      const practiced = frontierResponse.frontierTopics.some((topic: any) => 
        topic.mastery_level > 0
      )
      hasPracticedTopics.value = practiced
    }
  } catch (error) {
    console.warn('Failed to check practiced topics:', error)
  }
}

// Initialize chat on mount
onMounted(async () => {
  if (process.client) {
    // Get or create session ID
    sessionId.value = getSessionId()
    
    // Preload knowledge graph data in the background immediately
    const kgViz = useKGVisualization()
    // Start preload right away, don't wait
    kgViz.preloadKGData(undefined, sessionId.value).catch(err => {
      console.warn('Failed to preload KG data:', err)
      // Non-blocking - continue even if preload fails
    })
    
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
      if (!messages.value.find((m: typeof messages.value[0]) => m.id === newMessage.id)) {
        messages.value.push(newMessage)
      }
    })
    
    // Fetch due reviews and practiced topics for smart button visibility
    await Promise.all([
      fetchDueReviews(),
      checkPracticedTopics()
    ])
    
    // Handle query parameters (e.g., from diagnostic)
    const route = useRoute()
    
    // Handle opening knowledge graph from query param
    if (route.query.openKG === 'true') {
      showKGSidebar.value = true
    }
    
    // Handle starting a topic from query param (e.g., from diagnostic)
    if (route.query.startTopic && route.query.fromDiagnostic === 'true') {
      const topicId = route.query.startTopic as string
      
      // Show loading state immediately for better UX
      isLoadingFromDiagnostic.value = true
      
      // Wait a brief moment for the UI to settle
      await nextTick()
      setTimeout(() => {
        handleTopicSelect(topicId, true)
        // Clear loading state after topic selection initiates
        setTimeout(() => {
          isLoadingFromDiagnostic.value = false
        }, 1000)
      }, 300) // Reduced from 500ms to 300ms for snappier feel
    }
  }
})

// Watch sessionId and preload KG data when it changes
watch(() => sessionId.value, (newSessionId: string) => {
  if (process.client && newSessionId) {
    const kgViz = useKGVisualization()
    // Preload for new session
    kgViz.preloadKGData(undefined, newSessionId).catch(err => {
      console.warn('Failed to preload KG data for new session:', err)
    })
  }
})

// Cleanup on unmount
onUnmounted(() => {
  if (unsubscribeChat) {
    unsubscribeChat()
  }
  // Clear hover timeout
  if (kgHoverTimeout) {
    clearTimeout(kgHoverTimeout)
  }
  // Cleanup voice interface
  cleanupVoice()
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

/* Slow pulse animation for review indicators */
@keyframes pulse-slow {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

.animate-pulse-slow {
  animation: pulse-slow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Mobile adjustments for FABs */
@media (max-width: 640px) {
  .fixed.bottom-6 {
    bottom: 5rem; /* Adjust for mobile chat input */
  }
}

/* Screen reader only class */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
</style>
