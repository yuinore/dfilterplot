import { Tooltip } from '@mui/material';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();

  const formatTooltipText = (item: PoleZero, isPole: boolean) => {
    const type = isPole ? t('polezero.pole') : t('polezero.zero');
    const real = item.real.toFixed(3);
    const imag = item.imag.toFixed(3);
    return `${type}\n${t('polezero.real')}: ${real}\n${t('polezero.imag')}: ${imag}`;
  };

  return (
    <>
      {/* 零点 (○) */}
      {zeros.map((zero) => {
        const svgX = toSvgX(zero.real);
        const svgY = toSvgY(zero.imag);
        return (
          <g
            key={zero.id}
            onMouseDown={interactive ? onZeroMouseDown?.(zero.id) : undefined}
          >
            <circle
              cx={svgX}
              cy={svgY}
              r={8}
              fill="white"
              stroke="#2e7d32"
              strokeWidth="3"
              style={{ cursor: interactive ? 'move' : 'default' }}
            />
            <foreignObject
              x={svgX - 10}
              y={svgY - 10}
              width={20}
              height={20}
              style={{ overflow: 'visible', pointerEvents: 'none' }}
            >
              <Tooltip
                title={formatTooltipText(zero, false)}
                arrow
                placement="top"
                enterDelay={500}
                leaveDelay={100}
              >
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    pointerEvents: 'auto',
                    cursor: interactive ? 'move' : 'default',
                  }}
                />
              </Tooltip>
            </foreignObject>
          </g>
        );
      })}

      {/* 極 (×) */}
      {poles.map((pole) => {
        const svgX = toSvgX(pole.real);
        const svgY = toSvgY(pole.imag);
        return (
          <g
            key={pole.id}
            onMouseDown={interactive ? onPoleMouseDown?.(pole.id) : undefined}
          >
            <line
              x1={svgX - 8}
              y1={svgY - 8}
              x2={svgX + 8}
              y2={svgY + 8}
              stroke="#c62828"
              strokeWidth="3"
              strokeLinecap="round"
              style={{ pointerEvents: 'none' }}
            />
            <line
              x1={svgX - 8}
              y1={svgY + 8}
              x2={svgX + 8}
              y2={svgY - 8}
              stroke="#c62828"
              strokeWidth="3"
              strokeLinecap="round"
              style={{ pointerEvents: 'none' }}
            />
            {/* 透明な円でクリック領域を拡大 */}
            {interactive && (
              <circle
                cx={svgX}
                cy={svgY}
                r={10}
                fill="transparent"
                style={{ cursor: 'move' }}
              />
            )}
            <foreignObject
              x={svgX - 10}
              y={svgY - 10}
              width={20}
              height={20}
              style={{ overflow: 'visible', pointerEvents: 'none' }}
            >
              <Tooltip
                title={formatTooltipText(pole, true)}
                arrow
                placement="top"
                enterDelay={200}
                leaveDelay={200}
              >
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    pointerEvents: 'auto',
                    cursor: interactive ? 'move' : 'default',
                  }}
                />
              </Tooltip>
            </foreignObject>
          </g>
        );
      })}
    </>
  );
};
