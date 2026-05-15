import React, { useRef, useEffect, useState, useCallback } from 'react';
import { generateObjectId } from '../../utils/whiteboardTools';
import { useToolState } from '../../context/ToolContext';


// Utility functions
const getMousePos = (canvas, event) => {
  if (!canvas) return { x: 0, y: 0 };
  const rect = canvas.getBoundingClientRect();
  const clientX = event.clientX || event.touches?.[0]?.clientX || 0;
  const clientY = event.clientY || event.touches?.[0]?.clientY || 0;
  
  return {
    x: (clientX - rect.left) * (canvas.width / rect.width),
    y: (clientY - rect.top) * (canvas.height / rect.height),
  };
};

// Draw action object
const drawAction = (context, action) => {
  if (!action || !action.path || action.path.length === 0) return;

  context.strokeStyle = action.color;
  context.lineWidth = action.strokeWidth;
  context.globalCompositeOperation = action.type === 'eraser' ? 'destination-out' : 'source-over';
  
  context.beginPath();
  context.moveTo(action.path[0].x, action.path[0].y);
  
  if ((action.type === 'pencil' || action.type === 'eraser') && action.path.length > 1) {
    action.path.forEach(point => context.lineTo(point.x, point.y));
  } else if (action.type === 'line') {
    context.lineTo(action.path[1].x, action.path[1].y);
  } else if (action.type === 'rectangle') {
    context.rect(action.path[0].x, action.path[0].y, action.path[1].x - action.path[0].x, action.path[1].y - action.path[0].y);
  }
  context.stroke();
  context.globalCompositeOperation = 'source-over';
};

const drawObject = (context, obj) => {
  if (!context || !obj) return;

  context.strokeStyle = obj.color || '#000000';
  context.lineWidth = obj.strokeWidth || 2;
  context.globalCompositeOperation = obj.type === 'eraser' ? 'destination-out' : 'source-over';
  
  switch (obj.type) {
    case 'pencil':
    case 'pen':
    case 'eraser':
    case 'highlighter':
      if (!obj.path || obj.path.length === 0) break;
      context.beginPath();
      context.moveTo(obj.path[0].x, obj.path[0].y);
      obj.path.forEach(point => context.lineTo(point.x, point.y));
      context.stroke();
      break;
      
    case 'line':
      if (!obj.path || obj.path.length < 2) break;
      context.beginPath();
      context.moveTo(obj.path[0].x, obj.path[0].y);
      context.lineTo(obj.path[1].x, obj.path[1].y);
      context.stroke();
      break;
      
    case 'rectangle':
    case 'rect':
      if (!obj.path || obj.path.length < 2) break;
      const rectStart = obj.path[0];
      const rectEnd = obj.path[1];
      context.strokeRect(rectStart.x, rectStart.y, rectEnd.x - rectStart.x, rectEnd.y - rectStart.y);
      break;
      
    case 'circle':
      if (!obj.path || obj.path.length < 2) break;
      const circleStart = obj.path[0];
      const circleEnd = obj.path[1];
      const centerX = (circleStart.x + circleEnd.x) / 2;
      const centerY = (circleStart.y + circleEnd.y) / 2;
      const dx = circleEnd.x - circleStart.x;
      const dy = circleEnd.y - circleStart.y;
      const radius = Math.sqrt(dx * dx + dy * dy) / 2;
      context.beginPath();
      context.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      context.stroke();
      break;
      
    case 'text':
      if (!obj.text || !obj.position) break;
      context.globalCompositeOperation = 'source-over';
      context.font = `${obj.fontSize || 14}px Arial`;
      context.fillStyle = obj.color || '#000000';
      context.fillText(obj.text, obj.position.x, obj.position.y);
      break;
  }
  context.globalCompositeOperation = 'source-over';
};

const CanvasBoard = ({ objects, onAddObject, onUpdateObject, selectedObjectId, setSelectedObjectId, onDeleteObject, onAutoSave, userRole }) => {
  const { activeTool, color, strokeWidth } = useToolState();

  const mainCanvasRef = useRef(null);
  const previewCanvasRef = useRef(null);
  const mainContextRef = useRef(null);
  const previewContextRef = useRef(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const currentPathRef = useRef([]);
  const startPointRef = useRef({ x: 0, y: 0 });
  const lastPointRef = useRef({ x: 0, y: 0 });
  const animationFrameIdRef = useRef(null);
  const autoSaveTimeoutRef = useRef(null);

  // Canvas initialization
  useEffect(() => {
    const setupCanvas = (canvas, contextRef) => {
      const context = canvas.getContext('2d');
      contextRef.current = context;
    };

    setupCanvas(mainCanvasRef.current, mainContextRef);
    setupCanvas(previewCanvasRef.current, previewContextRef);

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-save with throttle
  useEffect(() => {
    if (objects.length === 0) return;

    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(() => {
      onAutoSave(objects);
    }, 2000);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [objects, onAutoSave]);

  // Redraw main canvas
  useEffect(() => {
    const mainContext = mainContextRef.current;
    if (mainContext) {
      mainContext.clearRect(0, 0, mainContext.canvas.width, mainContext.canvas.height);
      objects.forEach(obj => drawObject(mainContext, obj));
    }
  }, [objects]);

  // Animation loop for preview
  useEffect(() => {
    if (isDrawing) {
      animationFrameIdRef.current = requestAnimationFrame(renderLoop);
    }

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [isDrawing]);
  
  
  // Canvas initialization
  useEffect(() => {
    const setupCanvas = (canvas, contextRef) => {
      const context = canvas.getContext('2d');
      contextRef.current = context;
    };

    setupCanvas(mainCanvasRef.current, mainContextRef);
    setupCanvas(previewCanvasRef.current, previewContextRef);

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Redraw after resize
  useEffect(() => {
    const mainContext = mainContextRef.current;
    if (mainContext) {
      mainContext.clearRect(0, 0, mainContext.canvas.width, mainContext.canvas.height);
      objects.forEach(obj => drawObject(mainContext, obj));
    }
  }, [objects]);



  const renderLoop = useCallback(() => {
    if (!isDrawing) return;

    const previewContext = previewContextRef.current;
    if (!previewContext) return;

    const pos = lastPointRef.current;

    // Clear preview for shapes only
    if (activeTool !== 'pencil' && activeTool !== 'pen' && activeTool !== 'eraser' && activeTool !== 'highlighter') {
      const previewCanvas = previewCanvasRef.current;
      previewContext.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
    }

    const currentWidth = strokeWidth;

    if (activeTool === 'pencil' || activeTool === 'pen' || activeTool === 'highlighter' || activeTool === 'eraser') {
      // Freehand drawing
      previewContext.beginPath();
      previewContext.moveTo(currentPathRef.current[currentPathRef.current.length - 1].x, currentPathRef.current[currentPathRef.current.length - 1].y);
      previewContext.lineTo(pos.x, pos.y);
      previewContext.strokeStyle = color;
      previewContext.lineWidth = currentWidth;
      previewContext.globalCompositeOperation = activeTool === 'eraser' ? 'destination-out' : 'source-over';
      previewContext.stroke();
      previewContext.globalCompositeOperation = 'source-over';
    } else {
      // Shapes preview
      drawObject(previewContext, { type: activeTool, path: [startPointRef.current, pos], color, strokeWidth: currentWidth });
    }

    drawCursor(previewContext, pos);
    animationFrameIdRef.current = requestAnimationFrame(renderLoop);
  }, [isDrawing, activeTool, color, strokeWidth]);



  const handleResize = () => {
    const scale = window.devicePixelRatio;
    [mainCanvasRef, previewCanvasRef].forEach(ref => {
      const canvas = ref.current;
      const context = canvas.getContext('2d');
      const { width, height } = canvas.getBoundingClientRect();
      canvas.width = width * scale;
      canvas.height = height * scale;
      context.scale(scale, scale);
      context.lineCap = 'round';
      context.lineJoin = 'round';
    });
    const mainContext = mainContextRef.current;
    if (mainContext) {
      objects.forEach(obj => drawObject(mainContext, obj));
    }
  };

  const handleMouseDown = (event) => {
    // Prevent drawing if user is a viewer
    if (userRole === 'viewer') {
      alert('Viewers can only chat. Drawings are view-only.');
      return;
    }

    const pos = getMousePos(previewCanvasRef.current, event);
    setIsDrawing(true);
    startPointRef.current = pos;

    if (activeTool === 'eraser') {
      const mainContext = mainContextRef.current;
      mainContext.globalCompositeOperation = 'destination-out';
      mainContext.lineWidth = strokeWidth;
      mainContext.beginPath();
      mainContext.moveTo(pos.x, pos.y);
    }

    lastPointRef.current = pos;
    currentPathRef.current = [pos];
  };


  const handleMouseMove = (event) => {
    if (!isDrawing) return;
    const pos = getMousePos(previewCanvasRef.current, event);
    const previewContext = previewContextRef.current;

    if (activeTool === 'eraser') {
      const mainContext = mainContextRef.current;
      mainContext.lineTo(pos.x, pos.y);
      mainContext.stroke();
      currentPathRef.current.push(pos);
      return;
    }

    if (activeTool === 'pencil' || activeTool === 'pen' || activeTool === 'highlighter') {
      previewContext.beginPath();
      previewContext.moveTo(lastPointRef.current.x, lastPointRef.current.y);
      previewContext.lineTo(pos.x, pos.y);
      previewContext.strokeStyle = color;
      previewContext.lineWidth = strokeWidth;
      previewContext.globalCompositeOperation = 'source-over';
      previewContext.stroke();

      lastPointRef.current = pos;
      currentPathRef.current.push(pos);
    } else {
      lastPointRef.current = pos;
    }
  };

  const handleMouseUp = (event) => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const pos = getMousePos(previewCanvasRef.current, event);
    const currentWidth = strokeWidth;

    let newObject;
    if (activeTool === 'pencil' || activeTool === 'pen' || activeTool === 'highlighter' || activeTool === 'eraser') {
      if (currentPathRef.current.length > 1) {
        newObject = {
          id: generateObjectId(),
          type: activeTool,
          path: currentPathRef.current,
          color: activeTool === 'eraser' ? 'rgba(0,0,0,1)' : color,
          strokeWidth: currentWidth,
          userId: 'local',
          timestamp: Date.now()
        };
      }
    } else {
      if (startPointRef.current && pos && (startPointRef.current.x !== pos.x || startPointRef.current.y !== pos.y)) {
        newObject = {
          id: generateObjectId(),
          type: activeTool,
          path: [startPointRef.current, pos],
          color,
          strokeWidth: currentWidth,
          userId: 'local',
          timestamp: Date.now()
        };
      }
    }

    if (newObject && onAddObject) {
      onAddObject(newObject);
    }

    if (activeTool === 'eraser') {
      mainContextRef.current.closePath();
      mainContextRef.current.globalCompositeOperation = 'source-over';
    }

    previewContextRef.current.clearRect(0, 0, previewContextRef.current.canvas.width, previewContextRef.current.canvas.height);
    currentPathRef.current = [];
  };

 const handleMouseLeave = () => {
    const previewContext = previewContextRef.current;
    if (previewContext) {
      previewContext.clearRect(0, 0, previewContext.canvas.width, previewContext.canvas.height);
    }
  };

  const drawCursor = (context, pos) => {
    context.globalCompositeOperation = 'source-over';
    if (activeTool === 'eraser') {
      context.beginPath();
      context.arc(pos.x, pos.y, strokeWidth / 2, 0, 2 * Math.PI);
      context.strokeStyle = 'rgba(0, 0, 0, 0.5)';
      context.lineWidth = 1;
      context.stroke();
    } else if (activeTool === 'pencil' || activeTool === 'pen' || activeTool === 'highlighter') {
      context.beginPath();
      context.arc(pos.x, pos.y, strokeWidth / 2, 0, 2 * Math.PI);
      context.fillStyle = color;
      context.fill();
    }
  };

  const getCursorClass = (tool) => {
    switch (tool) {
      case 'pencil':
      case 'pen':
      case 'highlighter':
        return 'cursor-pencils'
      case 'eraser':
        return 'cursor-not-allowed';
      case 'select':
        return 'cursor-default';
      case 'rectangle':
      case 'rect':
        return 'cursor-crosshair'
      case 'circle':
      case 'line':
      case 'arrow':
      case 'text':
      case 'sticky':
        return 'cursor-crosshair';
      default:
        return 'cursor-crosshair';
    }
  };

  return (
    <div className="absolute top-0 left-0 h-full w-full">
      <canvas ref={mainCanvasRef} className="absolute top-0 left-0 h-full w-full bg-slate-50 pointer-events-none" />
      <canvas
        ref={previewCanvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        className={`absolute top-0 left-0 h-full w-full ${getCursorClass(activeTool)}`}
      />
    </div>
  );
};

export default CanvasBoard;