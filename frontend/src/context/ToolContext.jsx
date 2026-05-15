/**
 * Tool State Management Hook
 * 
 * Single source of truth for tool selection and properties.
 * Canvas reads this state, doesn't write to it.
 * Tools panel writes this state, doesn't touch canvas.
 * Clean separation of concerns.
 */

import { createContext, useContext, useState, useCallback } from 'react';

// Tool context - holds all tool state
const ToolContext = createContext(null);

/**
 * Provider component - wrap app with this to enable tool state globally
 */
export const ToolProvider = ({ children }) => {
  const [activeTool, setActiveTool] = useState('select'); // Default tool
  const [color, setColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [isErasing, setIsErasing] = useState(false);

  // Select tool - synchronous, no side effects
  const selectTool = useCallback((toolId) => {
    setActiveTool(toolId);
    // Reset erasing flag if switching away from eraser
    if (toolId !== 'eraser') {
      setIsErasing(false);
    }
  }, []);

  // Update color - synchronous
  const updateColor = useCallback((newColor) => {
    setColor(newColor);
  }, []);

  // Update stroke width - synchronous
  const updateStrokeWidth = useCallback((width) => {
    setStrokeWidth(width);
  }, []);

  const value = {
    // Current state
    activeTool,
    color,
    strokeWidth,
    isErasing,

    // Actions
    selectTool,
    updateColor,
    updateStrokeWidth,
    setIsErasing,
  };

  return <ToolContext.Provider value={value}>{children}</ToolContext.Provider>;
};

/**
 * Hook to read tool state
 * Canvas and other components use this to read current tool
 */
export const useToolState = () => {
  const context = useContext(ToolContext);
  if (!context) {
    throw new Error('useToolState must be used within ToolProvider');
  }
  return context;
};
