/**
 * ToolsPanel Component - Compact Dropdown Layout
 * 
 * Standard whiteboard tools UI - organized by category
 * PRIMARY tools are always visible (icons)
 * SHAPES, CONTENT, UTILITY tools are in dropdowns
 * 
 * This component is PURELY UI - no drawing logic, no socket events.
 * It only writes to tool state, canvas reads from tool state.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  CursorArrowRaysIcon,
  PencilIcon,
  PencilSquareIcon,
  TrashIcon,
  ArrowRightIcon,
  Square2StackIcon,
  CircleStackIcon,
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
  ChatBubbleBottomCenterTextIcon,
  DocumentTextIcon,
  HandRaisedIcon,
  SparklesIcon,
  EllipsisVerticalIcon,
} from '@heroicons/react/24/outline';
import { useToolState } from '../../context/ToolContext';
import '../../styles/toolsPanel.css';

/**
 * Icon mapping for all tools
 * Centralized to ensure consistency and ease of updates
 */
const TOOL_ICONS = {
  select: <CursorArrowRaysIcon className="h-5 w-5" />,
  pen: <PencilIcon className="h-5 w-5" />,
  highlighter: <PencilSquareIcon className="h-5 w-5" />,
  eraser: <TrashIcon className="h-5 w-5" />,
  line: <ArrowRightIcon className="h-5 w-5" />,
  rect: <Square2StackIcon className="h-5 w-5" />,
  circle: <CircleStackIcon className="h-5 w-5" />,
  arrow: <ArrowRightIcon className="h-5 w-5 rotate-45" />,
  text: <ChatBubbleBottomCenterTextIcon className="h-5 w-5" />,
  sticky: <DocumentTextIcon className="h-5 w-5" />,
  pan: <HandRaisedIcon className="h-5 w-5" />,
  laser: <SparklesIcon className="h-5 w-5" />,
};

const ToolsPanel = ({ onClearCanvas, onUndo, onRedo }) => {
  const { activeTool, selectTool, color, updateColor, strokeWidth, updateStrokeWidth } =
    useToolState();

  // Local state for dropdown visibility
  const [openDropdown, setOpenDropdown] = useState(null);
  const dropdownRef = useRef(null);

  // Tool categories
  const primaryTools = [
    { id: 'select', name: 'Select', icon: TOOL_ICONS.select },
    { id: 'pen', name: 'Pen', icon: TOOL_ICONS.pen },
    { id: 'highlighter', name: 'Highlighter', icon: TOOL_ICONS.highlighter },
    { id: 'eraser', name: 'Eraser', icon: TOOL_ICONS.eraser },
  ];

  const shapeTools = [
    { id: 'line', name: 'Line', icon: TOOL_ICONS.line },
    { id: 'rect', name: 'Rectangle', icon: TOOL_ICONS.rect },
    { id: 'circle', name: 'Circle', icon: TOOL_ICONS.circle },
    { id: 'arrow', name: 'Arrow', icon: TOOL_ICONS.arrow },
  ];

  const contentTools = [
    { id: 'text', name: 'Text', icon: TOOL_ICONS.text },
    { id: 'sticky', name: 'Sticky', icon: TOOL_ICONS.sticky },
  ];

  const utilityTools = [
    { id: 'pan', name: 'Pan', icon: TOOL_ICONS.pan },
    { id: 'laser', name: 'Laser', icon: TOOL_ICONS.laser },
  ];

  /**
   * Handle tool selection
   * Synchronous, instant, no side effects on canvas
   */
  const handleToolSelect = (toolId) => {
    selectTool(toolId);
    setOpenDropdown(null); // Close dropdown after selection
  };

  /**
   * Handle dropdown toggle
   * Only manages local UI state, doesn't affect drawing
   */
  const toggleDropdown = (category) => {
    setOpenDropdown(openDropdown === category ? null : category);
  };

  /**
   * Close dropdown when clicking outside
   */
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(null);
      }
    };

    if (openDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [openDropdown]);

  /**
   * Render a tool button
   */
  const renderToolButton = (tool, isActive = false) => (
    <button
      key={tool.id}
      onClick={() => handleToolSelect(tool.id)}
      className={`tools-panel__button ${isActive ? 'tools-panel__button--active' : ''}`}
      title={tool.name}
      aria-label={tool.name}
    >
      {tool.icon}
    </button>
  );

  /**
   * Render a dropdown category
   */
  const renderDropdown = (category, tools, label) => (
    <div key={category} className="tools-panel__dropdown-wrapper">
      <button
        onClick={() => toggleDropdown(category)}
        className={`tools-panel__button tools-panel__button--menu ${
          openDropdown === category ? 'tools-panel__button--active' : ''
        }`}
        title={label}
        aria-label={label}
        aria-expanded={openDropdown === category}
      >
        <EllipsisVerticalIcon className="h-5 w-5" />
      </button>

      {openDropdown === category && (
        <div className="tools-panel__dropdown">
          <div className="tools-panel__dropdown-title">{label}</div>
          <div className="tools-panel__dropdown-content">
            {tools.map((tool) => renderToolButton(tool, activeTool === tool.id))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="tools-panel" ref={dropdownRef}>
      {/* PRIMARY TOOLS - Always visible */}
      <div className="tools-panel__section">
        <div className="tools-panel__group">
          {primaryTools.map((tool) => renderToolButton(tool, activeTool === tool.id))}
        </div>
      </div>

      <div className="tools-panel__divider"></div>

      {/* SHAPES - Dropdown */}
      {renderDropdown('shapes', shapeTools, 'Shapes')}

      {/* CONTENT - Dropdown */}
      {renderDropdown('content', contentTools, 'Content')}

      {/* UTILITY - Dropdown */}
      {renderDropdown('utility', utilityTools, 'Utility')}

      <div className="tools-panel__divider"></div>

      {/* COLOR & STROKE CONTROLS */}
      <div className="tools-panel__section">
        <div className="tools-panel__control">
          <label className="tools-panel__label" title="Color">
            <span className="sr-only">Color</span>
          </label>
          <input
            type="color"
            value={color}
            onChange={(e) => updateColor(e.target.value)}
            className="tools-panel__color-picker"
            aria-label="Pick color"
          />
        </div>

        <div className="tools-panel__control">
          <label className="tools-panel__label" title="Stroke width">
            <span className="sr-only">Width</span>
          </label>
          <input
            type="range"
            min="1"
            max="50"
            value={strokeWidth}
            onChange={(e) => updateStrokeWidth(Number(e.target.value))}
            className="tools-panel__slider"
            aria-label="Adjust stroke width"
          />
          <span className="tools-panel__value">{strokeWidth}</span>
        </div>
      </div>

      <div className="tools-panel__divider"></div>

      {/* HISTORY & CLEAR */}
      <div className="tools-panel__section">
        <div className="tools-panel__group tools-panel__group--row">
          <button
            onClick={onUndo}
            className="tools-panel__button"
            title="Undo"
            aria-label="Undo"
          >
            <ArrowUturnLeftIcon className="h-5 w-5" />
          </button>
          <button
            onClick={onRedo}
            className="tools-panel__button"
            title="Redo"
            aria-label="Redo"
          >
            <ArrowUturnRightIcon className="h-5 w-5" />
          </button>
        </div>

        <button
          onClick={onClearCanvas}
          className="tools-panel__button tools-panel__button--danger"
          title="Clear Canvas"
          aria-label="Clear Canvas"
        >
          {TOOL_ICONS.eraser}
        </button>
      </div>
    </div>
  );
};

export default ToolsPanel;
