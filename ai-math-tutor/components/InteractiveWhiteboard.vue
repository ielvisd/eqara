<template>
  <div class="flex flex-col h-full bg-black/50 rounded-lg border border-pink-500/20 overflow-hidden">
    <!-- Toolbar -->
    <div v-if="showControls" class="flex items-center gap-2 p-3 bg-black/40 border-b border-pink-500/20 flex-wrap">
      <!-- Drawing Tools -->
      <div class="flex items-center gap-1 bg-black/60 rounded-lg p-1 border border-pink-500/30">
        <button
          v-for="tool in tools"
          :key="tool.id"
          @click="selectTool(tool.id)"
          :class="[
            'p-2 rounded transition-all duration-200',
            currentTool === tool.id
              ? 'bg-pink-500/30 text-pink-400 border border-pink-500/50'
              : 'text-gray-400 hover:text-pink-400 hover:bg-pink-500/10'
          ]"
          :title="tool.name + (tool.shortcut ? ` (${tool.shortcut})` : '')"
          :aria-label="tool.name"
        >
          <UIcon :name="tool.icon" class="size-5" />
        </button>
      </div>

      <!-- Color Picker -->
      <div class="flex items-center gap-1 bg-black/60 rounded-lg p-1 border border-pink-500/30">
        <button
          v-for="color in colors"
          :key="color.name"
          @click="selectColor(color.value)"
          :class="[
            'w-8 h-8 rounded transition-all duration-200 border-2',
            currentColor === color.value
              ? 'border-pink-400 scale-110'
              : 'border-transparent hover:scale-110'
          ]"
          :style="{ backgroundColor: color.value }"
          :title="color.name"
          :aria-label="color.name + ' color'"
        />
      </div>

      <!-- Stroke Width -->
      <div class="flex items-center gap-2 bg-black/60 rounded-lg px-3 py-1 border border-pink-500/30">
        <UIcon name="i-lucide-minus" class="size-4 text-gray-400" />
        <input
          v-model.number="strokeWidth"
          type="range"
          min="1"
          max="20"
          class="w-20 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-pink-500"
          :title="`Stroke width: ${strokeWidth}px`"
          aria-label="Stroke width"
        />
        <UIcon name="i-lucide-plus" class="size-4 text-gray-400" />
      </div>

      <!-- Action Buttons -->
      <div class="flex items-center gap-1 ml-auto bg-black/60 rounded-lg p-1 border border-pink-500/30">
        <button
          @click="undo"
          :disabled="!canUndo"
          class="p-2 rounded text-gray-400 hover:text-pink-400 hover:bg-pink-500/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          title="Undo (Ctrl+Z)"
          aria-label="Undo"
        >
          <UIcon name="i-lucide-undo" class="size-5" />
        </button>
        <button
          @click="redo"
          :disabled="!canRedo"
          class="p-2 rounded text-gray-400 hover:text-pink-400 hover:bg-pink-500/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          title="Redo (Ctrl+Y)"
          aria-label="Redo"
        >
          <UIcon name="i-lucide-redo" class="size-5" />
        </button>
        <button
          @click="clearCanvas"
          class="p-2 rounded text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
          title="Clear canvas"
          aria-label="Clear canvas"
        >
          <UIcon name="i-lucide-trash-2" class="size-5" />
        </button>
      </div>
    </div>

    <!-- Canvas Container -->
    <div 
      class="flex-1 relative overflow-hidden" 
      ref="canvasContainer"
    >
    </div>

    <!-- Submit Button (if not readonly) - Sticky at bottom -->
    <div 
      v-if="!readonly && showControls && hasDrawing" 
      class="sticky bottom-0 z-10 p-3 bg-black/90 backdrop-blur-sm border-t border-pink-500/30 shadow-lg shadow-pink-500/20"
    >
      <UButton
        @click="submitDrawing"
        variant="solid"
        size="lg"
        class="w-full font-semibold !bg-pink-500 hover:!bg-pink-600 shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50 transition-all duration-200"
        icon="i-lucide-send"
        :loading="isSubmitting"
        :class="[
          'animate-pulse-slow',
          hasDrawing && !isSubmitting ? 'hover:scale-[1.02]' : ''
        ]"
      >
        <span class="flex items-center gap-2">
          <UIcon name="i-lucide-pen-tool" class="size-4" />
          Submit Drawing
        </span>
      </UButton>
      <p class="text-xs text-gray-400 text-center mt-2">
        Your drawing will be analyzed by the AI
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import Konva from 'konva'

// Props
const props = defineProps<{
  readonly?: boolean
  initialImage?: string
  showControls?: boolean
}>()

// Emits
const emit = defineEmits<{
  submit: [imageData: string]
  draw: []
}>()

// Components are imported and used directly in template

// Canvas state
const canvasContainer = ref<HTMLElement | null>(null)
const stage = ref<Konva.Stage | null>(null)
const layer = ref<Konva.Layer | null>(null)

// Drawing state
const currentTool = ref<'pen' | 'eraser' | 'circle' | 'rectangle' | 'line' | 'text'>('pen')
const currentColor = ref('#ec4899') // Pink-500
const strokeWidth = ref(3)
const isDrawing = ref(false)
const isSubmitting = ref(false)
const startPos = ref<{ x: number; y: number } | null>(null)

// Drawing history - store Konva nodes
const drawnNodes = ref<Konva.Node[]>([])
const history = ref<Konva.Node[][]>([])
const historyIndex = ref(-1)
const currentLine = ref<Konva.Line | null>(null)

// Check if canvas has any drawings
const hasDrawing = computed(() => {
  return drawnNodes.value.length > 0
})

// Watch for drawing changes - parent can check hasDrawing property
watch(() => hasDrawing.value, () => {
  // Trigger reactivity - parent will check hasDrawing property
  emit('draw')
}, { immediate: false })

// Tools configuration
const tools = [
  { id: 'pen' as const, name: 'Pen', icon: 'i-lucide-pen-tool', shortcut: 'P' },
  { id: 'eraser' as const, name: 'Eraser', icon: 'i-lucide-eraser', shortcut: 'E' },
  { id: 'circle' as const, name: 'Circle', icon: 'i-lucide-circle', shortcut: 'C' },
  { id: 'rectangle' as const, name: 'Rectangle', icon: 'i-lucide-square', shortcut: 'R' },
  { id: 'line' as const, name: 'Line', icon: 'i-lucide-minus', shortcut: 'L' },
  { id: 'text' as const, name: 'Text', icon: 'i-lucide-type', shortcut: 'T' }
]

// Color palette (aligned with app theme)
const colors = [
  { name: 'Pink', value: '#ec4899' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'White', value: '#ffffff' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Green', value: '#10b981' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Blue', value: '#3b82f6' }
]

// Stage configuration
const stageConfig = computed(() => {
  if (!canvasContainer.value) return { width: 800, height: 600 }
  const rect = canvasContainer.value.getBoundingClientRect()
  return {
    width: rect.width,
    height: rect.height
  }
})

// Initialize Konva stage
const initStage = () => {
  if (!canvasContainer.value) return

  const config = stageConfig.value
  const konvaStage = new Konva.Stage({
    container: canvasContainer.value,
    width: config.width,
    height: config.height
  })

  const konvaLayer = new Konva.Layer()
  konvaStage.add(konvaLayer)

  stage.value = konvaStage
  layer.value = konvaLayer

  // Attach event listeners to stage
  konvaStage.on('mousedown touchstart', handleMouseDown)
  konvaStage.on('mousemove touchmove', handleMouseMove)
  konvaStage.on('mouseup touchend mouseleave', handleMouseUp)

  // Redraw on resize
  const resizeObserver = new ResizeObserver(() => {
    if (stage.value && canvasContainer.value) {
      const rect = canvasContainer.value.getBoundingClientRect()
      stage.value.width(rect.width)
      stage.value.height(rect.height)
      drawGrid()
      stage.value.draw()
    }
  })
  resizeObserver.observe(canvasContainer.value)
}

// Draw grid lines
const drawGrid = () => {
  if (!layer.value) return

  const width = stageConfig.value.width
  const height = stageConfig.value.height
  const spacing = 20

  // Remove existing grid lines
  layer.value.find('.grid-line').forEach((node) => node.destroy())

  // Vertical lines
  for (let x = 0; x <= width; x += spacing) {
    const line = new Konva.Line({
      points: [x, 0, x, height],
      stroke: '#1f2937',
      strokeWidth: 1,
      opacity: 0.3,
      listening: false,
      name: 'grid-line'
    })
    layer.value.add(line)
  }

  // Horizontal lines
  for (let y = 0; y <= height; y += spacing) {
    const line = new Konva.Line({
      points: [0, y, width, y],
      stroke: '#1f2937',
      strokeWidth: 1,
      opacity: 0.3,
      listening: false,
      name: 'grid-line'
    })
    layer.value.add(line)
  }

  layer.value.draw()
}

// Undo/Redo state
const canUndo = computed(() => historyIndex.value >= 0)
const canRedo = computed(() => historyIndex.value < history.value.length - 1)

// Tool selection
const selectTool = (toolId: typeof currentTool.value) => {
  currentTool.value = toolId
  saveState()
}

const selectColor = (color: string) => {
  currentColor.value = color
}

// Mouse/Touch event handlers
const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
  if (props.readonly || !stage.value || !layer.value) return
  
  const pointerPos = stage.value.getPointerPosition()
  if (!pointerPos) return

  isDrawing.value = true
  startPos.value = { x: pointerPos.x, y: pointerPos.y }

  if (currentTool.value === 'pen') {
    const line = new Konva.Line({
      points: [pointerPos.x, pointerPos.y],
      stroke: currentColor.value,
      strokeWidth: strokeWidth.value,
      tension: 0.5,
      lineCap: 'round',
      lineJoin: 'round',
      globalCompositeOperation: 'source-over'
    })
    layer.value.add(line)
    currentLine.value = line
    drawnNodes.value.push(line)
  } else if (currentTool.value === 'eraser') {
    const line = new Konva.Line({
      points: [pointerPos.x, pointerPos.y],
      stroke: '#000000',
      strokeWidth: strokeWidth.value * 2,
      tension: 0.5,
      lineCap: 'round',
      lineJoin: 'round',
      globalCompositeOperation: 'destination-out'
    })
    layer.value.add(line)
    currentLine.value = line
    drawnNodes.value.push(line)
  }

  layer.value.draw()
}

const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
  if (!isDrawing.value || props.readonly || !layer.value) return

  const pointerPos = stage.value?.getPointerPosition()
  if (!pointerPos || !currentLine.value) return

  if (currentTool.value === 'pen' || currentTool.value === 'eraser') {
    const newPoints = currentLine.value.points().concat([pointerPos.x, pointerPos.y])
    currentLine.value.points(newPoints)
    layer.value.draw()
    emit('draw')
  }
}

const handleMouseUp = (e?: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
  if (!isDrawing.value || !layer.value) return
  
  isDrawing.value = false
  
  if (currentTool.value === 'pen' || currentTool.value === 'eraser') {
    currentLine.value = null
    saveState()
  } else if (currentTool.value === 'circle' && startPos.value && stage.value) {
    const pos = stage.value.getPointerPosition()
    if (pos && startPos.value) {
      const radius = Math.sqrt(
        Math.pow(pos.x - startPos.value.x, 2) + 
        Math.pow(pos.y - startPos.value.y, 2)
      )
      const circle = new Konva.Circle({
        x: startPos.value.x,
        y: startPos.value.y,
        radius: radius,
        stroke: currentColor.value,
        strokeWidth: strokeWidth.value,
        fill: 'transparent'
      })
      layer.value.add(circle)
      drawnNodes.value.push(circle)
      saveState()
      emit('draw')
    }
  } else if (currentTool.value === 'rectangle' && startPos.value && stage.value) {
    const pos = stage.value.getPointerPosition()
    if (pos && startPos.value) {
      const width = Math.abs(pos.x - startPos.value.x)
      const height = Math.abs(pos.y - startPos.value.y)
      const rect = new Konva.Rect({
        x: Math.min(startPos.value.x, pos.x),
        y: Math.min(startPos.value.y, pos.y),
        width: width,
        height: height,
        stroke: currentColor.value,
        strokeWidth: strokeWidth.value,
        fill: 'transparent'
      })
      layer.value.add(rect)
      drawnNodes.value.push(rect)
      saveState()
      emit('draw')
    }
  } else if (currentTool.value === 'line' && startPos.value && stage.value) {
    const pos = stage.value.getPointerPosition()
    if (pos && startPos.value) {
      const line = new Konva.Line({
        points: [startPos.value.x, startPos.value.y, pos.x, pos.y],
        stroke: currentColor.value,
        strokeWidth: strokeWidth.value,
        lineCap: 'round',
        lineJoin: 'round'
      })
      layer.value.add(line)
      drawnNodes.value.push(line)
      saveState()
      emit('draw')
    }
  }
  
  startPos.value = null
  if (layer.value) layer.value.draw()
}

// Touch event handlers are handled by Konva stage events

// Text editing
const editText = (node: Konva.Text) => {
  if (props.readonly || !layer.value) return
  const text = prompt('Enter text:', node.text())
  if (text !== null) {
    node.text(text)
    layer.value.draw()
    saveState()
    emit('draw')
  }
}

const addText = (x: number, y: number) => {
  if (props.readonly || !layer.value) return
  const text = prompt('Enter text:')
  if (text) {
    const textNode = new Konva.Text({
      x: x,
      y: y,
      text: text,
      fontSize: 20,
      fill: currentColor.value,
      fontFamily: 'Arial'
    })
    textNode.on('dblclick', () => editText(textNode))
    layer.value.add(textNode)
    drawnNodes.value.push(textNode)
    saveState()
    emit('draw')
  }
}

// Canvas operations
const clearCanvas = () => {
  if (confirm('Clear the entire canvas?') && layer.value) {
    drawnNodes.value.forEach(node => node.destroy())
    drawnNodes.value = []
    drawGrid()
    saveState()
    emit('draw')
  }
}

const undo = () => {
  if (!canUndo.value) return
  historyIndex.value--
  restoreState()
}

const redo = () => {
  if (!canRedo.value) return
  historyIndex.value++
  restoreState()
}

const saveState = () => {
  if (!layer.value) return
  
  // Remove any states after current index (when undoing and then drawing)
  history.value = history.value.slice(0, historyIndex.value + 1)
  
  // Save current state (clone nodes)
  const currentNodes = drawnNodes.value.map(node => {
    const attrs = node.getAttrs()
    return { type: node.getClassName(), attrs }
  })
  history.value.push(currentNodes)
  
  historyIndex.value = history.value.length - 1
  
  // Limit history size
  if (history.value.length > 50) {
    history.value.shift()
    historyIndex.value--
  }
}

const restoreState = () => {
  if (history.value.length === 0 || !layer.value) return
  
  // Clear current nodes
  drawnNodes.value.forEach(node => node.destroy())
  drawnNodes.value = []
  
  // Restore from history
  const state = history.value[historyIndex.value]
  state.forEach((nodeData: any) => {
    let node: Konva.Node | null = null
    switch (nodeData.type) {
      case 'Line':
        node = new Konva.Line(nodeData.attrs)
        break
      case 'Circle':
        node = new Konva.Circle(nodeData.attrs)
        break
      case 'Rect':
        node = new Konva.Rect(nodeData.attrs)
        break
      case 'Text':
        node = new Konva.Text(nodeData.attrs)
        if (node) node.on('dblclick', () => editText(node as Konva.Text))
        break
    }
    if (node) {
      layer.value!.add(node)
      drawnNodes.value.push(node)
    }
  })
  
  drawGrid()
  layer.value.draw()
}

// Export canvas to image
const exportCanvas = async (): Promise<string> => {
  if (!stage.value) {
    throw new Error('Stage not initialized')
  }

  const dataURL = stage.value.toDataURL({
    mimeType: 'image/png',
    quality: 1,
    pixelRatio: 2 // Higher quality
  })

  return dataURL
}

// Submit drawing
const submitDrawing = async () => {
  if (props.readonly || isSubmitting.value) return
  
  try {
    isSubmitting.value = true
    const imageData = await exportCanvas()
    emit('submit', imageData)
  } catch (error) {
    console.error('Error exporting canvas:', error)
  } finally {
    isSubmitting.value = false
  }
}

// Load initial image
const loadInitialImage = async () => {
  if (!props.initialImage || !stage.value || !layer.value) return
  
  try {
    const image = new Image()
    image.onload = () => {
      const konvaImage = new Konva.Image({
        x: 0,
        y: 0,
        image: image,
        width: stage.value!.width(),
        height: stage.value!.height()
      })
      
      layer.value!.add(konvaImage)
      drawnNodes.value.push(konvaImage)
      layer.value!.draw()
    }
    image.src = props.initialImage
  } catch (error) {
    console.error('Error loading initial image:', error)
  }
}

// Keyboard shortcuts
const handleKeyDown = (e: KeyboardEvent) => {
  if (props.readonly) return
  
  // Check for Ctrl/Cmd modifier
  const isModifier = e.ctrlKey || e.metaKey
  
  if (isModifier && e.key === 'z' && !e.shiftKey) {
    e.preventDefault()
    undo()
  } else if ((isModifier && e.key === 'y') || (isModifier && e.shiftKey && e.key === 'Z')) {
    e.preventDefault()
    redo()
  } else if (!isModifier) {
    // Tool shortcuts
    switch (e.key.toLowerCase()) {
      case 'p':
        selectTool('pen')
        break
      case 'e':
        selectTool('eraser')
        break
      case 'c':
        selectTool('circle')
        break
      case 'r':
        selectTool('rectangle')
        break
      case 'l':
        selectTool('line')
        break
      case 't':
        selectTool('text')
        break
    }
  }
}

// Watch for initial image changes
watch(() => props.initialImage, () => {
  if (props.initialImage) {
    nextTick(() => {
      loadInitialImage()
    })
  }
})

// Lifecycle
onMounted(() => {
  nextTick(() => {
    initStage()
    drawGrid()
    
    // Initialize history
    saveState()
    
    // Load initial image if provided
    if (props.initialImage) {
      loadInitialImage()
    }
    
    // Add keyboard event listener
    window.addEventListener('keydown', handleKeyDown)
    
    // Handle click-to-add-text
    if (stage.value && currentTool.value === 'text') {
      stage.value.on('click', () => {
        if (currentTool.value === 'text' && stage.value) {
          const pos = stage.value.getPointerPosition()
          if (pos) {
            addText(pos.x, pos.y)
          }
        }
      })
    }
  })
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})

// Render AI drawing commands
const renderCommands = (commands: Array<{
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
}>) => {
  if (!commands || commands.length === 0 || !layer.value) return

  commands.forEach((cmd) => {
    const color = cmd.color || '#ec4899'
    const stroke = cmd.strokeWidth || 3
    let node: Konva.Node | null = null

    if (cmd.type === 'draw' || cmd.type === 'line') {
      if (cmd.tool === 'line' && cmd.from && cmd.to) {
        node = new Konva.Line({
          points: [cmd.from[0], cmd.from[1], cmd.to[0], cmd.to[1]],
          stroke: color,
          strokeWidth: stroke,
          lineCap: 'round',
          lineJoin: 'round'
        })
      }
    } else if (cmd.type === 'circle' || (cmd.tool === 'circle' && cmd.center && cmd.radius !== undefined)) {
      node = new Konva.Circle({
        x: cmd.center![0],
        y: cmd.center![1],
        radius: cmd.radius || 50,
        stroke: color,
        strokeWidth: stroke,
        fill: 'transparent'
      })
    } else if (cmd.type === 'rectangle' || cmd.tool === 'rectangle') {
      if (cmd.from && cmd.to) {
        node = new Konva.Rect({
          x: Math.min(cmd.from[0], cmd.to[0]),
          y: Math.min(cmd.from[1], cmd.to[1]),
          width: Math.abs(cmd.to[0] - cmd.from[0]),
          height: Math.abs(cmd.to[1] - cmd.from[1]),
          stroke: color,
          strokeWidth: stroke,
          fill: 'transparent'
        })
      }
    } else if (cmd.type === 'text' && cmd.content && cmd.position) {
      node = new Konva.Text({
        x: cmd.position[0],
        y: cmd.position[1],
        text: cmd.content,
        fontSize: cmd.fontSize || 20,
        fill: color,
        fontFamily: 'Arial'
      })
      if (node) node.on('dblclick', () => editText(node as Konva.Text))
    }

    if (node) {
      layer.value!.add(node)
      drawnNodes.value.push(node)
    }
  })

  layer.value.draw()
  saveState()
  emit('draw')
}

// Expose methods and state for parent component
defineExpose({
  exportCanvas,
  clearCanvas,
  loadInitialImage,
  renderCommands,
  hasDrawing,
  submitDrawing
})
</script>

<style scoped>
/* Ensure canvas container fills available space */
.relative {
  min-height: 400px;
}

/* Smooth transitions for tool buttons */
button {
  transition: all 0.2s ease;
}

/* Custom range input styling */
input[type="range"] {
  -webkit-appearance: none;
  appearance: none;
}

input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #ec4899;
  cursor: pointer;
}

input[type="range"]::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #ec4899;
  cursor: pointer;
  border: none;
}
</style>

