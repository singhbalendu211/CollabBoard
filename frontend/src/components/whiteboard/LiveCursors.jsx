import React from 'react';
import { CursorArrowRaysIcon } from '@heroicons/react/24/solid';

const LiveCursors = ({ cursors, selfId }) => {
  return (
    <>
      {Object.entries(cursors).map(([id, cursor]) => {
        // Don't render the cursor for the current user
        if (id === selfId || !cursor) return null;
        
        return (
          <div
            key={id}
            className="absolute top-0 left-0 transition-transform duration-100 ease-linear pointer-events-none"
            style={{ transform: `translate(${cursor.x}px, ${cursor.y}px)` }}
          >
            <CursorArrowRaysIcon className="h-5 w-5 text-indigo-500" />
            <span className="absolute top-4 left-4 whitespace-nowrap rounded-full bg-indigo-500 px-2 py-1 text-xs text-white">
              {cursor.email || 'Anonymous'}
            </span>
          </div>
        );
      })}
    </>
  );
};

export default LiveCursors;