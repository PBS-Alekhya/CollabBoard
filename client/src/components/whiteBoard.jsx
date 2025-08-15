import React, { useRef, useEffect, useState } from 'react';

const WhiteBoard = () => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;

    const startDraw = (e) => {
      const { offsetX, offsetY } = e.nativeEvent;
      ctx.beginPath();
      ctx.moveTo(offsetX, offsetY);
      setIsDrawing(true);
    };

    const draw = (e) => {
      if (!isDrawing) return;
      const { offsetX, offsetY } = e.nativeEvent;
      ctx.lineTo(offsetX, offsetY);
      ctx.stroke();
    };

    const endDraw = () => {
      setIsDrawing(false);
    };

    // Attach handlers via React instead of addEventListener
    canvas.addEventListener('mousedown', startDraw);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', endDraw);

    // Clean up
    return () => {
      canvas.removeEventListener('mousedown', startDraw);
      canvas.removeEventListener('mousemove', draw);
      canvas.removeEventListener('mouseup', endDraw);
    };
  }, [isDrawing]);

  return (
    <div>
      <h3>Whiteboard</h3>
      <canvas
        ref={canvasRef}
        width={600}
        height={400}
        style={{ border: '1px solid black', cursor: 'crosshair' }}
      />
    </div>
  );
};

export default WhiteBoard;
