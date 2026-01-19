import { useCallback, useRef } from 'react';

interface UseDraggableOptions {
  onDrag: (dx: number, dy: number) => void;
  onDragEnd?: () => void;
}

export const useDraggable = ({ onDrag, onDragEnd }: UseDraggableOptions) => {
  const isDraggingRef = useRef(false);
  const startPosRef = useRef({ x: 0, y: 0 });

  const handleMouseDown = useCallback((e: React.MouseEvent<SVGElement>) => {
    e.preventDefault();
    e.stopPropagation();
    isDraggingRef.current = true;
    startPosRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDraggingRef.current) return;

      const dx = e.clientX - startPosRef.current.x;
      const dy = e.clientY - startPosRef.current.y;
      startPosRef.current = { x: e.clientX, y: e.clientY };

      onDrag(dx, dy);
    },
    [onDrag]
  );

  const handleMouseUp = useCallback(() => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      onDragEnd?.();
    }
  }, [onDragEnd]);

  return {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  };
};

