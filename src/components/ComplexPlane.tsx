import { useTranslation } from 'react-i18next';
import { useEffect, useRef, useState, useCallback } from 'react';
import type { PoleZero } from '../types';
import { applySnap } from '../utils/snapUtils';
import { PoleZeroRenderer } from './PoleZeroRenderer';
import { CollapsiblePanel } from './CollapsiblePanel';

const SVG_WIDTH = 500;
const SVG_HEIGHT = 500;
const SVG_CENTER_X = SVG_WIDTH / 2;
const SVG_CENTER_Y = SVG_HEIGHT / 2;

const MAX_ZOOM_RATIO = 5.0;

// 複素平面の座標を SVG 座標に変換
const toSvgX = (real: number, scale: number): number =>
  Math.max(0, Math.min(SVG_WIDTH, SVG_CENTER_X + real * scale));
const toSvgY = (imag: number, scale: number): number =>
  Math.max(0, Math.min(SVG_HEIGHT, SVG_CENTER_Y - imag * scale));

// SVG 座標を複素平面の座標に変換
const fromSvgX = (svgX: number, scale: number): number =>
  (svgX - SVG_CENTER_X) / scale;
const fromSvgY = (svgY: number, scale: number): number =>
  (SVG_CENTER_Y - svgY) / scale;

interface ComplexPlaneProps {
  poles: PoleZero[];
  zeros: PoleZero[];
  enableSnap: boolean;
  showZeroPoleTooltip: boolean;
  autoScale: boolean;
  onPoleMove?: (id: string, real: number, imag: number) => void;
  onZeroMove?: (id: string, real: number, imag: number) => void;
  onDeletePole?: (id: string) => void;
  onDeleteZero?: (id: string) => void;
}

export const ComplexPlane = ({
  poles,
  zeros,
  enableSnap,
  showZeroPoleTooltip,
  autoScale = false,
  onPoleMove,
  onZeroMove,
  onDeletePole,
  onDeleteZero,
}: ComplexPlaneProps) => {
  const { t } = useTranslation();

  let scale = 200; // 1 unit = 200 pixels

  if (autoScale) {
    [...poles, ...zeros].forEach((p) => {
      const distance = Math.sqrt(p.real ** 2 + p.imag ** 2);
      if (1.2 / distance < scale / 200) {
        scale = Math.max(200 / MAX_ZOOM_RATIO, (200 * 1.2) / distance);
      }
    });
  }

  const svgRef = useRef<SVGSVGElement>(null);
  const [draggingItem, setDraggingItem] = useState<{
    id: string;
    isPole: boolean;
  } | null>(null);

  // 描画範囲内か（toSvgX/toSvgY でクランプされないか）
  const isInBounds = (real: number, imag: number): boolean => {
    const rawX = SVG_CENTER_X + real * scale;
    const rawY = SVG_CENTER_Y - imag * scale;
    return rawX >= 0 && rawX <= SVG_WIDTH && rawY >= 0 && rawY <= SVG_HEIGHT;
  };

  // SVG 要素内の座標を取得（viewBox座標系に変換）
  const getSvgCoordinates = (
    clientX: number,
    clientY: number,
  ): { x: number; y: number } => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();

    // クライアント座標からSVG要素内の相対座標を取得
    const relativeX = clientX - rect.left;
    const relativeY = clientY - rect.top;

    // スケーリング係数を計算（viewBox座標系に変換）
    const scaleX = SVG_WIDTH / rect.width;
    const scaleY = SVG_HEIGHT / rect.height;

    return {
      x: relativeX * scaleX,
      y: relativeY * scaleY,
    };
  };

  const startDrag = useCallback((id: string, isPole: boolean) => {
    setDraggingItem({ id, isPole });
  }, []);

  const handleMouseDown = useCallback(
    (id: string, isPole: boolean) => (e: React.MouseEvent<SVGGElement>) => {
      e.preventDefault();
      e.stopPropagation();
      startDrag(id, isPole);
    },
    [startDrag],
  );

  const handleTouchStart = useCallback(
    (id: string, isPole: boolean) => (e: React.TouchEvent<SVGGElement>) => {
      e.preventDefault();
      startDrag(id, isPole);
    },
    [startDrag],
  );

  // クライアント座標から極・零点の移動を適用（マウス・タッチ共通）
  const applyDragPosition = useCallback(
    (clientX: number, clientY: number) => {
      if (!draggingItem) return;

      const { x: svgX, y: svgY } = getSvgCoordinates(clientX, clientY);
      const real = fromSvgX(svgX, scale);
      const imag = fromSvgY(svgY, scale);

      const item = draggingItem.isPole
        ? poles.find((p) => p.id === draggingItem.id)
        : zeros.find((z) => z.id === draggingItem.id);
      const isRealAxisOnly = !!(item && !item.pairId);

      // スナップを適用
      const snapped = applySnap(real, imag, enableSnap, isRealAxisOnly);

      if (draggingItem.isPole) {
        onPoleMove?.(draggingItem.id, snapped.real, snapped.imag);
      } else {
        onZeroMove?.(draggingItem.id, snapped.real, snapped.imag);
      }
    },
    [draggingItem, poles, zeros, enableSnap, onPoleMove, onZeroMove, scale],
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      applyDragPosition(e.clientX, e.clientY);
    },
    [applyDragPosition],
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (e.touches.length === 0) return;
      // 1本指のときだけ極・零点ドラッグとして扱い preventDefault。2本指以上はピンチ等を許可する。
      if (e.touches.length !== 1) return;
      e.preventDefault();
      applyDragPosition(e.touches[0].clientX, e.touches[0].clientY);
    },
    [applyDragPosition],
  );

  const endDrag = useCallback(() => {
    setDraggingItem(null);
  }, []);

  const handleMouseUp = endDrag;
  const handleTouchEnd = endDrag;

  // 表示用 id（id または id_conj）を state の id に変換（ペアは1つの PoleOrZero で保持）
  const toActualId = (displayId: string) =>
    displayId.endsWith('_conj') ? displayId.replace('_conj', '') : displayId;

  const handlePoleDoubleClick = useCallback(
    (displayId: string) => (e: React.MouseEvent<SVGGElement>) => {
      e.preventDefault();
      e.stopPropagation();
      onDeletePole?.(toActualId(displayId));
    },
    [onDeletePole],
  );

  const handleZeroDoubleClick = useCallback(
    (displayId: string) => (e: React.MouseEvent<SVGGElement>) => {
      e.preventDefault();
      e.stopPropagation();
      onDeleteZero?.(toActualId(displayId));
    },
    [onDeleteZero],
  );

  useEffect(() => {
    if (draggingItem) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleTouchEnd);
      window.addEventListener('touchcancel', handleTouchEnd);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleTouchEnd);
        window.removeEventListener('touchcancel', handleTouchEnd);
      };
    }
  }, [
    draggingItem,
    handleMouseMove,
    handleMouseUp,
    handleTouchMove,
    handleTouchEnd,
  ]);

  return (
    <CollapsiblePanel title={t('complexPlane.title')}>
      <div
        style={{
          aspectRatio: '1 / 1',
          maxWidth: '720px',
          width: '100%',
          minHeight: 0,
          border: '1px solid #ccc',
          background: '#fafafa',
        }}
      >
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* グリッド線 */}
          <defs>
            <pattern
              id="grid"
              width={scale / 5}
              height={scale / 5}
              patternUnits="userSpaceOnUse"
            >
              <path
                d={`M ${scale / 5} ${SVG_CENTER_Y % (scale / 5)} L 0 ${SVG_CENTER_Y % (scale / 5)}`}
                fill="none"
                stroke="#d0d0d0"
                strokeWidth="0.5"
              />
              <path
                d={`M ${SVG_CENTER_X % (scale / 5)} 0 L ${SVG_CENTER_X % (scale / 5)} ${scale / 5}`}
                fill="none"
                stroke="#d0d0d0"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect width={SVG_WIDTH} height={SVG_HEIGHT} fill="url(#grid)" />

          {/* 実軸 */}
          <line
            x1={0}
            y1={SVG_CENTER_Y}
            x2={SVG_WIDTH}
            y2={SVG_CENTER_Y}
            stroke="#333"
            strokeWidth="2"
          />
          <text
            x={SVG_WIDTH - 30}
            y={SVG_CENTER_Y + 20}
            fontSize="12"
            fill="#333"
          >
            {t('complexPlane.realAxis')}
          </text>

          {/* 虚軸 */}
          <line
            x1={SVG_CENTER_X}
            y1={0}
            x2={SVG_CENTER_X}
            y2={SVG_HEIGHT}
            stroke="#333"
            strokeWidth="2"
          />
          <text x={SVG_CENTER_X + 10} y={20} fontSize="12" fill="#333">
            {t('complexPlane.imagAxis')}
          </text>

          {/* 単位円 */}
          <circle
            cx={SVG_CENTER_X}
            cy={SVG_CENTER_Y}
            r={scale}
            fill="none"
            stroke="#1976d2"
            strokeWidth="2"
            strokeDasharray="5,5"
            opacity={0.6}
          />
          <text
            x={SVG_CENTER_X + 10}
            y={SVG_CENTER_Y + scale + 20}
            fontSize="12"
            fill="#1976d2"
          >
            {t('complexPlane.unitCircle')}
          </text>

          {/* 極と零点の描画 */}
          <PoleZeroRenderer
            poles={poles}
            zeros={zeros}
            scale={scale}
            toSvgX={toSvgX}
            toSvgY={toSvgY}
            isInBounds={isInBounds}
            interactive={true}
            showZeroPoleTooltip={showZeroPoleTooltip}
            onPoleMouseDown={(id) => handleMouseDown(id, true)}
            onZeroMouseDown={(id) => handleMouseDown(id, false)}
            onPoleTouchStart={(id) => handleTouchStart(id, true)}
            onZeroTouchStart={(id) => handleTouchStart(id, false)}
            onPoleDoubleClick={handlePoleDoubleClick}
            onZeroDoubleClick={handleZeroDoubleClick}
          />
        </svg>
      </div>
    </CollapsiblePanel>
  );
};
