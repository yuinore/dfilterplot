import { Paper, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useEffect, useRef, useState, useCallback } from 'react';
import type { PoleZero } from '../types';
import { applySnap } from '../utils/snapUtils';
import { PoleZeroRenderer } from './PoleZeroRenderer';

interface ComplexPlaneProps {
  poles: PoleZero[];
  zeros: PoleZero[];
  enableSnap: boolean;
  onPoleMove?: (id: string, real: number, imag: number) => void;
  onZeroMove?: (id: string, real: number, imag: number) => void;
}

export const ComplexPlane = ({ poles, zeros, enableSnap, onPoleMove, onZeroMove }: ComplexPlaneProps) => {
  const { t } = useTranslation();
  const width = 500;
  const height = 500;
  const centerX = width / 2;
  const centerY = height / 2;
  const scale = 200; // 1 unit = 200 pixels
  const svgRef = useRef<SVGSVGElement>(null);
  const [draggingItem, setDraggingItem] = useState<{
    id: string;
    isPole: boolean;
  } | null>(null);

  // 複素平面の座標を SVG 座標に変換
  const toSvgX = (real: number): number => centerX + real * scale;
  const toSvgY = (imag: number): number => centerY - imag * scale;

  // SVG 座標を複素平面の座標に変換
  const fromSvgX = (svgX: number): number => (svgX - centerX) / scale;
  const fromSvgY = (svgY: number): number => (centerY - svgY) / scale;

  // SVG 要素内の座標を取得（viewBox座標系に変換）
  const getSvgCoordinates = (clientX: number, clientY: number): { x: number; y: number } => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    
    // クライアント座標からSVG要素内の相対座標を取得
    const relativeX = clientX - rect.left;
    const relativeY = clientY - rect.top;
    
    // スケーリング係数を計算（viewBox座標系に変換）
    const scaleX = width / rect.width;
    const scaleY = height / rect.height;
    
    return {
      x: relativeX * scaleX,
      y: relativeY * scaleY,
    };
  };

  const handleMouseDown = useCallback((id: string, isPole: boolean) => (e: React.MouseEvent<SVGGElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggingItem({ id, isPole });
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!draggingItem) return;

    const { x: svgX, y: svgY } = getSvgCoordinates(e.clientX, e.clientY);
    let real = fromSvgX(svgX);
    let imag = fromSvgY(svgY);

    // 実軸上の点（ペアがない点）かどうかをチェック
    let isRealAxisOnly = false;
    if (draggingItem.isPole) {
      const pole = poles.find(p => p.id === draggingItem.id);
      isRealAxisOnly = !!(pole && !pole.pairId);
    } else {
      const zero = zeros.find(z => z.id === draggingItem.id);
      isRealAxisOnly = !!(zero && !zero.pairId);
    }

    // スナップを適用
    const snapped = applySnap(real, imag, enableSnap, isRealAxisOnly);
    real = snapped.real;
    imag = snapped.imag;

    if (draggingItem.isPole) {
      onPoleMove?.(draggingItem.id, real, imag);
    } else {
      onZeroMove?.(draggingItem.id, real, imag);
    }
  }, [draggingItem, poles, zeros, enableSnap, onPoleMove, onZeroMove]);

  const handleMouseUp = useCallback(() => {
    setDraggingItem(null);
  }, []);

  useEffect(() => {
    if (draggingItem) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggingItem, handleMouseMove, handleMouseUp]);

  return (
    <Paper elevation={3} sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        {t('complexPlane.title')}
      </Typography>
      <div
        style={{
          aspectRatio: '1 / 1',
          maxWidth: '600px',
          width: '100%',
          border: '1px solid #ccc',
          background: '#fafafa',
        }}
      >
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          viewBox={`0 0 ${width} ${height}`}
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
              d={`M ${scale / 5} 0 L 0 0 0 ${scale / 5}`}
              fill="none"
              stroke="#e0e0e0"
              strokeWidth="0.5"
            />
          </pattern>
        </defs>
        <rect width={width} height={height} fill="url(#grid)" />

        {/* 実軸 */}
        <line
          x1={0}
          y1={centerY}
          x2={width}
          y2={centerY}
          stroke="#333"
          strokeWidth="2"
        />
        <text
          x={width - 30}
          y={centerY - 10}
          fontSize="12"
          fill="#333"
        >
          {t('complexPlane.realAxis')}
        </text>

        {/* 虚軸 */}
        <line
          x1={centerX}
          y1={0}
          x2={centerX}
          y2={height}
          stroke="#333"
          strokeWidth="2"
        />
        <text
          x={centerX + 10}
          y={20}
          fontSize="12"
          fill="#333"
        >
          {t('complexPlane.imagAxis')}
        </text>

        {/* 単位円 */}
        <circle
          cx={centerX}
          cy={centerY}
          r={scale}
          fill="none"
          stroke="#1976d2"
          strokeWidth="2"
          strokeDasharray="5,5"
        />
        <text
          x={centerX + scale + 10}
          y={centerY + 5}
          fontSize="12"
          fill="#1976d2"
        >
          {t('complexPlane.unitCircle')}
        </text>

        {/* 極と零点の描画 */}
        <PoleZeroRenderer
          poles={poles}
          zeros={zeros}
          toSvgX={toSvgX}
          toSvgY={toSvgY}
          interactive={true}
          onPoleMouseDown={(id) => handleMouseDown(id, true)}
          onZeroMouseDown={(id) => handleMouseDown(id, false)}
        />
        </svg>
      </div>
    </Paper>
  );
};

