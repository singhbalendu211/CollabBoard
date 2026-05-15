import React from 'react';
import { Popover, Transition } from '@headlessui/react';
import {
  ArrowUturnLeftIcon, ArrowUturnRightIcon, PencilIcon, StopIcon, ChevronDownIcon, ArrowsPointingOutIcon, ShareIcon, TrashIcon,
} from '@heroicons/react/24/outline';

//Eraser
const EraserIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 48 48" id="Eraser--Streamline-Plump" height="20" width="25">
  <desc>
    Eraser Streamline Icon: https://streamlinehq.com
  </desc>
  <g id="eraser--text-remove-format-formatting-eraser-delete">
    <path id="Subtract" stroke="#000000" stroke-linecap="round" stroke-linejoin="round" d="M3.815 24.167c-1.096 1.428 -1.048 3.242 0.1 4.63 1.205 1.458 3.205 3.674 6.455 6.826 0.193 0.188 0.383 0.372 0.57 0.551a2.987 2.987 0 0 0 2.16 0.824c2.731 -0.08 7.3 -0.16 14.543 -0.16 0.504 0 0.99 -0.185 1.363 -0.524a176.748 176.748 0 0 0 4.243 -3.992c5.482 -5.317 8.42 -8.734 9.958 -10.738 1.096 -1.427 1.047 -3.242 -0.1 -4.63 -1.205 -1.458 -3.206 -3.674 -6.455 -6.826 -3.249 -3.152 -5.534 -5.093 -7.036 -6.26 -1.431 -1.114 -3.302 -1.161 -4.774 -0.098 -2.066 1.491 -5.588 4.342 -11.07 9.659 -5.481 5.317 -8.42 8.734 -9.957 10.738Z" stroke-width="3"></path>
    <path id="Vector 1291" stroke="#000000" stroke-linecap="round" stroke-linejoin="round" d="M9 43h36" stroke-width="3"></path>
  </g>
</svg>
);

// A reusable styled button for the toolbar
const ToolButton = ({ children, onClick, isActive, title }) => (
  <button
    onClick={onClick}
    title={title}
    className={`p-2 rounded-md transition-colors ${isActive ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-slate-100 text-slate-500'}`}
  >
    {children}
  </button>
);

const TopToolbar = ({
   activeTool,
  onToolChange,
  color,
  onColorChange,
  strokeWidth,
  onStrokeWidthChange,
  undo,
  redo,
  clearCanvas, exportBoard,
  eraserWidth, onEraserWidthChange,
}) => {
  const colors = ['#000000', '#EF4444', '#3B82F6', '#22C55E', '#F97316', '#FCD34D'];

  return (
    <header className="absolute top-16 left-1/2 -translate-x-1/2 z-10">
      <div className="flex items-center gap-2 bg-white rounded-lg shadow-lg p-2 border border-slate-200">
        
        {/* Action Controls: Undo, Redo */}
        <ToolButton onClick={undo} title="Undo">
          <ArrowUturnLeftIcon className="h-5 w-5" />
        </ToolButton>
        <ToolButton onClick={redo} title="Redo">
          <ArrowUturnRightIcon className="h-5 w-5" />
        </ToolButton>
        <ToolButton onClick={() => onToolChange('select')} isActive={activeTool === 'select'} title="Select">
          <ArrowsPointingOutIcon className="h-5 w-5" />
        </ToolButton>
        <ToolButton onClick={() => onToolChange('pencil')} isActive={activeTool === 'pencil'} title="Pencil">
          <PencilIcon className="h-5 w-5" />
        </ToolButton>
        <ToolButton onClick={() => onToolChange('rectangle')} isActive={activeTool === 'rectangle'} title="Rectangle">
          <StopIcon className="h-5 w-5" />
        </ToolButton>
         <Popover className="relative">
          <Popover.Button
            onClick={() => onToolChange('eraser')}
            title="Eraser"
            className={`p-2 rounded-md transition-colors flex items-center gap-1 ${
              activeTool === 'eraser' ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-slate-100 text-slate-500'
            }`}
          >
            {EraserIcon }
            <ChevronDownIcon className="h-4 w-4" />
          </Popover.Button>
          <Transition
            as={React.Fragment}
            // ... (transition properties)
          >
            <Popover.Panel className="absolute z-10 mt-2 w-48 -translate-x-1/2 left-1/2 bg-white p-4 rounded-lg shadow-lg border">
              <label className="text-sm font-medium text-slate-600">Eraser Size</label>
              <input
                type="range"
                min="5"
                max="100"
                value={eraserWidth}
                onChange={(e) => onEraserWidthChange(e.target.value)}
                className="w-full mt-2"
              />
            </Popover.Panel>
          </Transition>
        </Popover>
        
        <div className="w-px h-6 bg-slate-200 mx-2"></div>

        {/* Drawing Tools */}
        <Popover className="relative">
          <Popover.Button className={`p-2 rounded-md transition-colors flex items-center gap-1 ${activeTool === 'pencil' ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-slate-100 text-slate-500'}`}>
            <PencilIcon className="h-5 w-5" />
            <ChevronDownIcon className="h-4 w-4" />
          </Popover.Button>
          <Transition
            as={React.Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Popover.Panel className="absolute z-10 mt-2 w-48 -translate-x-1/2 left-1/2 bg-white p-4 rounded-lg shadow-lg border">
              <label className="text-sm font-medium text-slate-600">Brush Size</label>
              <input
                type="range"
                min="1"
                max="50"
                value={strokeWidth}
                onChange={(e) => onStrokeWidthChange(e.target.value)}
                className="w-full mt-2"
              />
            </Popover.Panel>
          </Transition>
        </Popover>

        {/* Shape Tools (Example with a Popover) */}
        <Popover className="relative">
          <Popover.Button className={`p-2 rounded-md transition-colors ${['rectangle', 'circle'].includes(activeTool) ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-slate-100 text-slate-500'}`}>
            <StopIcon className="h-5 w-5" />
          </Popover.Button>
          <Popover.Panel className="absolute z-10 mt-2 w-auto -translate-x-1/2 left-1/2 bg-white p-2 rounded-lg shadow-lg border flex gap-2">
            <ToolButton onClick={() => onToolChange('rectangle')} title="Rectangle" isActive={activeTool === 'rectangle'}>
              <StopIcon className="h-5 w-5" />
            </ToolButton>
            {/* Add Circle, Line icons here */}
          </Popover.Panel>
        </Popover>

        {/* Color Picker */}
         <Popover className="relative">
          <Popover.Button className="p-1 rounded-md hover:bg-slate-100" title="Color">
            <div className="w-6 h-6 rounded-full border-2 border-white ring-1 ring-slate-300" style={{ backgroundColor: color }}></div>
          </Popover.Button>
          <Popover.Panel className="absolute z-10 mt-2 w-auto -translate-x-1/2 left-1/2 bg-white p-2 rounded-lg shadow-lg border">
            <div className="grid grid-cols-6 gap-2">
              {colors.map(c => (
                <button key={c} onClick={() => onColorChange(c)} className="w-6 h-6 rounded-full" style={{ backgroundColor: c }} />
              ))}
              <input type="color" value={color} onChange={(e) => onColorChange(e.target.value)} className="w-6 h-6 border-none bg-transparent cursor-pointer" />
            </div>
          </Popover.Panel>
        </Popover>

        <div className="w-px h-6 bg-slate-200 mx-2"></div>

        {/* Additional Settings */}
        <ToolButton onClick={exportBoard} title="Export">
          <ShareIcon className="h-5 w-5" />
        </ToolButton>
        <ToolButton onClick={clearCanvas} title="Clear Canvas">
  <TrashIcon className="h-5 w-5" />
</ToolButton>

      </div>
    </header>
  );
};

export default TopToolbar;