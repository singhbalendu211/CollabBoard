import React from 'react';
import { 
  PencilIcon, 
  TrashIcon, 
  ArrowUturnLeftIcon, 
  ArrowUturnRightIcon,
  RectangleGroupIcon,
  CircleStackIcon,
  ArrowLongRightIcon,
  ChatBubbleOvalLeftIcon
} from '@heroicons/react/24/outline';

const Toolbar = ({ activeTool, setActiveTool, setColor, setStrokeWidth, clearCanvas, undo, redo }) => {
  const tools = [
    { id: 'pencil', icon: <PencilIcon className="h-6 w-6" />, name: 'Pencil' },
    { id: 'eraser', icon: <div className="w-6 h-6 bg-gray-400 rounded-sm" />, name: 'Eraser (stroke)' },
    { id: 'line', icon: <ArrowLongRightIcon className="h-6 w-6" />, name: 'Line' },
    { id: 'rectangle', icon: <RectangleGroupIcon className="h-6 w-6" />, name: 'Rectangle' },
    { id: 'circle', icon: <CircleStackIcon className="h-6 w-6" />, name: 'Circle' },
    { id: 'text', icon: <ChatBubbleOvalLeftIcon className="h-6 w-6" />, name: 'Text' },
  ];

  return (
    <aside className="fixed top-1/2 left-4 z-10 -translate-y-1/2 flex flex-col items-center gap-2 rounded-lg bg-white/80 p-2 shadow-lg backdrop-blur-sm">
      {/* Tool Selection */}
      {tools.map(tool => (
        <button
          key={tool.id}
          onClick={() => setActiveTool(tool.id)}
          className={`p-3 rounded-md transition-colors ${activeTool === tool.id ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-slate-200'}`}
          title={tool.name}
        >
          {tool.icon}
        </button>
      ))}

      <div className="my-2 h-px w-full bg-slate-200"></div>

      {/* Color Picker */}
      <input type="color" onChange={(e) => setColor(e.target.value)} className="h-10 w-10 cursor-pointer border-none bg-transparent" title="Select Color" />
      
      {/* Stroke Width */}
      <input type="range" min="1" max="50" defaultValue="5" onChange={(e) => setStrokeWidth(e.target.value)} className="w-16 my-2" title="Stroke Width" />
      
      <div className="my-2 h-px w-full bg-slate-200"></div>

      {/* Actions */}
      <button onClick={undo} className="p-3 rounded-md hover:bg-slate-200" title="Undo"><ArrowUturnLeftIcon className="h-6 w-6" /></button>
      <button onClick={redo} className="p-3 rounded-md hover:bg-slate-200" title="Redo"><ArrowUturnRightIcon className="h-6 w-6" /></button>
      <button onClick={clearCanvas} className="p-3 rounded-md hover:bg-red-100 text-red-500" title="Clear All"><TrashIcon className="h-6 w-6" /></button>
    </aside>
  );
};

export default Toolbar;