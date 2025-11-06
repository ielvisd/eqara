// Whiteboard composable for state management and canvas operations
import { ref, computed } from 'vue'

export interface WhiteboardDrawing {
  type: 'draw' | 'line' | 'circle' | 'rectangle' | 'text'
  tool: string
  from?: [number, number]
  to?: [number, number]
  center?: [number, number]
  radius?: number
  shape?: string
  content?: string
  position?: [number, number]
  color?: string
  strokeWidth?: number
}

export interface WhiteboardCommand {
  type: 'whiteboard'
  commands: WhiteboardDrawing[]
}

export const useWhiteboard = () => {
  const isWhiteboardOpen = ref(false)
  const currentDrawing = ref<WhiteboardDrawing[]>([])
  const isSubmitting = ref(false)

  // Toggle whiteboard visibility
  const toggleWhiteboard = () => {
    isWhiteboardOpen.value = !isWhiteboardOpen.value
  }

  // Open whiteboard
  const openWhiteboard = () => {
    isWhiteboardOpen.value = true
  }

  // Close whiteboard
  const closeWhiteboard = () => {
    isWhiteboardOpen.value = false
  }

  // Add drawing command
  const addDrawingCommand = (command: WhiteboardDrawing) => {
    currentDrawing.value.push(command)
  }

  // Clear drawing commands
  const clearDrawingCommands = () => {
    currentDrawing.value = []
  }

  // Process AI drawing commands
  const processDrawingCommands = (commands: WhiteboardDrawing[]) => {
    // This will be used by the whiteboard component to render AI-generated drawings
    return commands
  }

  return {
    isWhiteboardOpen,
    currentDrawing,
    isSubmitting,
    toggleWhiteboard,
    openWhiteboard,
    closeWhiteboard,
    addDrawingCommand,
    clearDrawingCommands,
    processDrawingCommands
  }
}

