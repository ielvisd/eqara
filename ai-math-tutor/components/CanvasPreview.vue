<template>
  <div class="bg-pink-500/10 rounded-lg border border-pink-500/20 overflow-hidden">
    <div class="p-3 bg-black/40 border-b border-pink-500/20 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-pen-tool" class="size-4 text-pink-400" />
        <span class="text-sm font-medium text-pink-400">Drawing Submitted</span>
      </div>
      <div class="flex items-center gap-2">
        <UButton
          v-if="expanded"
          size="xs"
          color="neutral"
          variant="ghost"
          icon="i-lucide-minimize-2"
          @click="expanded = false"
          aria-label="Collapse preview"
        />
        <UButton
          v-else
          size="xs"
          color="neutral"
          variant="ghost"
          icon="i-lucide-maximize-2"
          @click="expanded = true"
          aria-label="Expand preview"
        />
        <UButton
          size="xs"
          color="primary"
          variant="ghost"
          icon="i-lucide-external-link"
          @click="openInWhiteboard"
          aria-label="Open in whiteboard"
        >
          Open
        </UButton>
      </div>
    </div>
    
    <div 
      :class="[
        'transition-all duration-300 overflow-hidden',
        expanded ? 'max-h-[500px]' : 'max-h-[200px]'
      ]"
    >
      <div class="relative bg-black/50 p-2">
        <img 
          :src="canvasImage" 
          :alt="'Drawing preview'"
          class="w-full h-auto rounded border border-pink-500/30 cursor-pointer hover:opacity-90 transition-opacity"
          @click="expanded = !expanded"
        />
        <div 
          v-if="!expanded"
          class="absolute inset-0 flex items-center justify-center bg-black/60 hover:bg-black/50 transition-colors cursor-pointer"
          @click="expanded = true"
        >
          <div class="text-center">
            <UIcon name="i-lucide-maximize-2" class="size-6 text-pink-400 mx-auto mb-2" />
            <p class="text-xs text-pink-400">Click to expand</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  canvasImage: string
}>()

const emit = defineEmits<{
  openWhiteboard: []
}>()

const expanded = ref(false)

const openInWhiteboard = () => {
  emit('openWhiteboard')
}
</script>

