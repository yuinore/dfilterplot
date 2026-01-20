import type { PoleZero } from '../types';

interface PoleZeroRendererProps {
  poles: PoleZero[];
  zeros: PoleZero[];
  toSvgX: (real: number) => number;
  toSvgY: (imag: number) => number;
  interactive?: boolean;
  onPoleMouseDown?: (id: string) => (e: React.MouseEvent<SVGGElement>) => void;
  onZeroMouseDown?: (id: string) => (e: React.MouseEvent<SVGGElement>) => void;
}

/**
 * 極と零点の描画コンポーネント（共通化）
 */
export const PoleZeroRenderer = ({
  poles,
  zeros,
  toSvgX,
  toSvgY,
  interactive = true,
  onPoleMouseDown,
  onZeroMouseDown,
}: PoleZeroRendererProps) => {
  return (
    <>
      {/* 零点 (○) */}
      {zeros.map((zero) => (
        <g key={zero.id} onMouseDown={interactive ? onZeroMouseDown?.(zero.id) : undefined}>
          <circle
            cx={toSvgX(zero.real)}
            cy={toSvgY(zero.imag)}
            r={8}
            fill="white"
            stroke="#2e7d32"
            strokeWidth="3"
            style={{ cursor: interactive ? 'move' : 'default' }}
          />
        </g>
      ))}

      {/* 極 (×) */}
      {poles.map((pole) => (
        <g key={pole.id} onMouseDown={interactive ? onPoleMouseDown?.(pole.id) : undefined}>
          <line
            x1={toSvgX(pole.real) - 8}
            y1={toSvgY(pole.imag) - 8}
            x2={toSvgX(pole.real) + 8}
            y2={toSvgY(pole.imag) + 8}
            stroke="#c62828"
            strokeWidth="3"
            strokeLinecap="round"
            style={{ pointerEvents: 'none' }}
          />
          <line
            x1={toSvgX(pole.real) - 8}
            y1={toSvgY(pole.imag) + 8}
            x2={toSvgX(pole.real) + 8}
            y2={toSvgY(pole.imag) - 8}
            stroke="#c62828"
            strokeWidth="3"
            strokeLinecap="round"
            style={{ pointerEvents: 'none' }}
          />
          {/* 透明な円でクリック領域を拡大 */}
          {interactive && (
            <circle
              cx={toSvgX(pole.real)}
              cy={toSvgY(pole.imag)}
              r={10}
              fill="transparent"
              style={{ cursor: 'move' }}
            />
          )}
        </g>
      ))}
    </>
  );
};

