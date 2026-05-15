/**
 * Whiteboard Tools & Utilities
 * 
 * Non-blocking, local-first helpers for collaborative whiteboard.
 * All socket emits are asynchronous and non-blocking.
 * Rendering is done incrementally via requestAnimationFrame.
 */

// ============================================================================
// THROTTLE UTILITY - For high-frequency socket events
// ============================================================================

/**
 * Throttles a function to fire at most every `delay` milliseconds.
 * Uses trailing execution (last call always fires after delay).
 * Non-blocking: does not use setInterval, only setTimeout.
 */
export const throttle = (fn, delay) => {
  let lastCall = 0;
  let timeout = null;
  
  return (...args) => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCall;
    
    if (timeSinceLastCall >= delay) {
      // Enough time has passed, execute immediately
      lastCall = now;
      fn(...args);
    } else {
      // Schedule the call for later if not already scheduled
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        lastCall = Date.now();
        fn(...args);
      }, delay - timeSinceLastCall);
    }
  };
};

// ============================================================================
// BATCH UPDATES - Collect updates and emit in batches
// ============================================================================

export const createBatchCollector = (emitFn, batchDelay = 50) => {
  let batch = [];
  let timeout = null;
  
  const flush = () => {
    if (batch.length > 0) {
      emitFn('canvas:batch:update', batch);
      batch = [];
    }
  };
  
  return {
    add: (event) => {
      batch.push(event);
      
      // Reset timeout on each add
      clearTimeout(timeout);
      timeout = setTimeout(flush, batchDelay);
    },
    flush,
    clear: () => {
      batch = [];
      clearTimeout(timeout);
    }
  };
};

// ============================================================================
// SHAPE DRAWING HELPERS
// ============================================================================

/**
 * Draw a circle on canvas context.
 * Assumes context is already set up with strokeStyle, lineWidth, etc.
 */
export const drawCircle = (context, centerX, centerY, radius) => {
  context.beginPath();
  context.arc(centerX, centerY, Math.abs(radius), 0, 2 * Math.PI);
  context.stroke();
};

/**
 * Calculate radius from two points (start and current).
 */
export const getCircleRadius = (startPoint, currentPoint) => {
  const dx = currentPoint.x - startPoint.x;
  const dy = currentPoint.y - startPoint.y;
  return Math.sqrt(dx * dx + dy * dy);
};

/**
 * Get circle center and radius from start/end points (diagonal).
 */
export const getCircleFromDiagonal = (startPoint, endPoint) => {
  const centerX = (startPoint.x + endPoint.x) / 2;
  const centerY = (startPoint.y + endPoint.y) / 2;
  const dx = endPoint.x - startPoint.x;
  const dy = endPoint.y - startPoint.y;
  const radius = Math.sqrt(dx * dx + dy * dy) / 2;
  return { centerX, centerY, radius };
};

// ============================================================================
// STROKE-BASED ERASER - Remove full strokes, not pixels
// ============================================================================

/**
 * Remove strokes that intersect with a given stroke path.
 * Used for stroke-based eraser (erases full strokes, not pixels).
 */
export const getStrokesIntersectingPath = (objects, eraserPath, tolerance = 10) => {
  const toDelete = [];
  
  objects.forEach(obj => {
    // Only erase pencil strokes (not shapes or text)
    if (obj.type !== 'pencil' || !obj.points) return;
    
    // Check if any point in the stroke is close to the eraser path
    const hasIntersection = obj.points.some(objPoint =>
      eraserPath.some(eraserPoint => {
        const dx = objPoint.x - eraserPoint.x;
        const dy = objPoint.y - eraserPoint.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < tolerance;
      })
    );
    
    if (hasIntersection) {
      toDelete.push(obj.id);
    }
  });
  
  return toDelete;
};

// ============================================================================
// UNDO/REDO STACK - Local history management
// ============================================================================

export const createUndoRedoStack = () => {
  let past = [];
  let future = [];
  let present = [];
  
  return {
    // Push a new state (clears future)
    push: (state) => {
      past.push(JSON.parse(JSON.stringify(present)));
      present = JSON.parse(JSON.stringify(state));
      future = [];
    },
    
    // Go back one state
    undo: () => {
      if (past.length === 0) return present;
      future.unshift(JSON.parse(JSON.stringify(present)));
      present = past.pop();
      return present;
    },
    
    // Go forward one state
    redo: () => {
      if (future.length === 0) return present;
      past.push(JSON.parse(JSON.stringify(present)));
      present = future.shift();
      return present;
    },
    
    // Get current state
    getCurrent: () => present,
    
    // Check if undo is available
    canUndo: () => past.length > 0,
    
    // Check if redo is available
    canRedo: () => future.length > 0,
    
    // Reset stack
    reset: () => {
      past = [];
      future = [];
      present = [];
    }
  };
};

// ============================================================================
// CURSOR POSITION TRACKING - Throttled, non-blocking
// ============================================================================

export const createCursorTracker = (emitFn, throttleDelay = 50) => {
  const throttledEmit = throttle((x, y) => {
    emitFn('canvas:cursor:update', { x, y });
  }, throttleDelay);
  
  return {
    update: (x, y) => throttledEmit(x, y),
  };
};

// ============================================================================
// OBJECT ID GENERATOR - Simple timestamp-based IDs
// ============================================================================

let idCounter = 0;
export const generateObjectId = () => {
  return `${Date.now()}_${idCounter++}`;
};

// ============================================================================
// DISTANCE & COLLISION DETECTION
// ============================================================================

/**
 * Calculate distance between two points.
 */
export const distance = (p1, p2) => {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
};

/**
 * Check if a point is near a line segment (for hit testing).
 */
export const pointNearLine = (point, lineStart, lineEnd, tolerance = 5) => {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  
  if (len === 0) return distance(point, lineStart) <= tolerance;
  
  let t = ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / (len * len);
  t = Math.max(0, Math.min(1, t));
  
  const closestX = lineStart.x + t * dx;
  const closestY = lineStart.y + t * dy;
  
  return distance(point, { x: closestX, y: closestY }) <= tolerance;
};

/**
 * Check if a point is inside a rectangle.
 */
export const pointInRect = (point, rect1, rect2) => {
  const minX = Math.min(rect1.x, rect2.x);
  const maxX = Math.max(rect1.x, rect2.x);
  const minY = Math.min(rect1.y, rect2.y);
  const maxY = Math.max(rect1.y, rect2.y);
  
  return point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY;
};

// ============================================================================
// REMOTE UPDATE APPLICATION - Incremental, non-blocking
// ============================================================================

/**
 * Apply a remote update to the local canvas without full redraw.
 * This is called when receiving updates from other users.
 * 
 * Returns true if the object was updated, false if not found.
 */
export const applyRemoteUpdate = (objects, updatedObject) => {
  const index = objects.findIndex(obj => obj.id === updatedObject.id);
  
  if (index !== -1) {
    // Update in place instead of creating new array
    objects[index] = updatedObject;
    return true;
  }
  
  return false;
};

// ============================================================================
// TEXT EDITING STATE - For text tool
// ============================================================================

export const createTextEditState = () => {
  return {
    isEditing: false,
    currentTextId: null,
    currentText: '',
    
    startEdit: (textId, initialText = '') => {
      return {
        isEditing: true,
        currentTextId: textId,
        currentText: initialText,
      };
    },
    
    updateText: (newText) => ({
      currentText: newText,
    }),
    
    finishEdit: () => ({
      isEditing: false,
      currentTextId: null,
      currentText: '',
    }),
  };
};

// ============================================================================
// REQUEST ANIMATION FRAME QUEUE
// ============================================================================

/**
 * Queue multiple rendering tasks and execute them in a single RAF call.
 * Prevents layout thrashing and improves performance.
 */
export const createRAFQueue = () => {
  let tasks = [];
  let frameId = null;
  
  const process = () => {
    tasks.forEach(task => task());
    tasks = [];
    frameId = null;
  };
  
  return {
    add: (task) => {
      tasks.push(task);
      if (!frameId) {
        frameId = requestAnimationFrame(process);
      }
    },
    
    flush: () => {
      if (frameId) {
        cancelAnimationFrame(frameId);
        process();
      }
    },
  };
};
