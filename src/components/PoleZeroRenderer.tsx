import { useMemo, useState, useEffect } from 'react';
import { Tooltip } from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { PoleZero } from '../types';

/** タッチなど coarse ポインタ時の当たり判定半径（px） */
const HIT_RADIUS_COARSE = 32;
/** マウス時の当たり判定半径（零点は見た目 r=8 のまま、極は透明円でこの値） */
const HIT_RADIUS_FINE = 10;

/** 重複判定で (real, imag) を整数化するときのグリッド幅。この値倍して round した座標で同一とみなす */
const DUPLICATE_DETERMINATION_GRID_WIDTH = 1000;

/** 重複ラベル（2, 3, 4, ...）のフォントサイズ */
const DUPLICATE_LABEL_FONT_SIZE = 18;

/**
 * 極と零点の描画コンポーネント（共通化）
 */
const OUT_OF_BOUNDS_OPACITY = 0.35;

/** 画面内の極・零点の不透明度（重複が分かりやすくなるようやや半透明にしてもよい） */
const IN_BOUNDS_OPACITY = 1.0;

function getDuplicateKey(real: number, imag: number): string {
  const r = Math.round(real * DUPLICATE_DETERMINATION_GRID_WIDTH);
  const i = Math.round(imag * DUPLICATE_DETERMINATION_GRID_WIDTH);
  return `${r},${i}`;
}

/**
 * 各要素について、同じキー内の重複個数（その位置に何個あるか）を返す。
 */
function computeDuplicateCounts(items: PoleZero[]): number[] {
  const keyCount = new Map<string, number>();
  for (let idx = 0; idx < items.length; idx++) {
    const k = getDuplicateKey(items[idx].real, items[idx].imag);
    keyCount.set(k, (keyCount.get(k) ?? 0) + 1);
  }
  return items.map(
    (item) => keyCount.get(getDuplicateKey(item.real, item.imag)) ?? 1,
  );
}

/**
 * 各要素について、同じキー内での 1-based 順序を返す（先頭のアイテムが 1）。
 * 重複ラベルは順序が 1 のときのみ表示してジャギーを防ぐ。
 */
function computeDuplicateOrdinals(items: PoleZero[]): number[] {
  const keyNextOrdinal = new Map<string, number>();
  const ordinals: number[] = [];
  for (let idx = 0; idx < items.length; idx++) {
    const k = getDuplicateKey(items[idx].real, items[idx].imag);
    const ord = (keyNextOrdinal.get(k) ?? 0) + 1;
    keyNextOrdinal.set(k, ord);
    ordinals[idx] = ord;
  }
  return ordinals;
}

interface PoleZeroRendererProps {
  poles: PoleZero[];
  zeros: PoleZero[];
  scale: number;
  toSvgX: (real: number, scale: number) => number;
  toSvgY: (imag: number, scale: number) => number;
  /** 描画範囲内なら true。未指定時は常に不透明 */
  isInBounds?: (real: number, imag: number) => boolean;
  interactive?: boolean;
  showZeroPoleTooltip?: boolean;
  onPoleMouseDown?: (id: string) => (e: React.MouseEvent<SVGGElement>) => void;
  onZeroMouseDown?: (id: string) => (e: React.MouseEvent<SVGGElement>) => void;
  onPoleTouchStart?: (id: string) => (e: React.TouchEvent<SVGGElement>) => void;
  onZeroTouchStart?: (id: string) => (e: React.TouchEvent<SVGGElement>) => void;
  onPoleDoubleClick?: (
    id: string,
  ) => (e: React.MouseEvent<SVGGElement>) => void;
  onZeroDoubleClick?: (
    id: string,
  ) => (e: React.MouseEvent<SVGGElement>) => void;
}

const ZeroPoleTooltip = ({
  title,
  interactive,
}: {
  title: string;
  interactive: boolean;
}) => {
  return (
    <Tooltip
      title={title}
      arrow
      placement="top"
      enterDelay={200}
      enterNextDelay={200}
      enterTouchDelay={200}
      leaveDelay={50}
      leaveTouchDelay={50}
      slotProps={{
        popper: {
          modifiers: [
            {
              name: 'offset',
              options: {
                offset: [0, 10],
              },
            },
          ],
        },
      }}
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
  );
};

export const PoleZeroRenderer = ({
  poles,
  zeros,
  scale,
  toSvgX,
  toSvgY,
  isInBounds,
  interactive = true,
  showZeroPoleTooltip = true,
  onPoleMouseDown,
  onZeroMouseDown,
  onPoleTouchStart,
  onZeroTouchStart,
  onPoleDoubleClick,
  onZeroDoubleClick,
}: PoleZeroRendererProps) => {
  const { t } = useTranslation();

  const [coarsePointer, setCoarsePointer] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(pointer: coarse)').matches
      : false,
  );
  useEffect(() => {
    const m = window.matchMedia('(pointer: coarse)');
    const handler = () => setCoarsePointer(m.matches);
    m.addEventListener('change', handler);
    return () => m.removeEventListener('change', handler);
  }, []);

  const hitRadius = coarsePointer ? HIT_RADIUS_COARSE : HIT_RADIUS_FINE;

  const poleDuplicateCounts = useMemo(
    () => computeDuplicateCounts(poles),
    [poles],
  );
  const zeroDuplicateCounts = useMemo(
    () => computeDuplicateCounts(zeros),
    [zeros],
  );
  const poleDuplicateOrdinals = useMemo(
    () => computeDuplicateOrdinals(poles),
    [poles],
  );
  const zeroDuplicateOrdinals = useMemo(
    () => computeDuplicateOrdinals(zeros),
    [zeros],
  );

  const formatTooltipText = (item: PoleZero, isPole: boolean) => {
    const type = isPole ? t('polezero.pole') : t('polezero.zero');
    const real = item.real.toFixed(3);
    const imag = item.imag.toFixed(3);
    return `${type}\n${t('polezero.real')}: ${real}\n${t('polezero.imag')}: ${imag}`;
  };

  return (
    <>
      {/* 零点 (○) */}
      {zeros.map((zero, idx) => {
        const svgX = toSvgX(zero.real, scale);
        const svgY = toSvgY(zero.imag, scale);
        const inBounds = isInBounds?.(zero.real, zero.imag) ?? true;
        const isDuplicate = zeroDuplicateCounts[idx] >= 2;
        const showDuplicateLabel =
          isDuplicate && zeroDuplicateOrdinals[idx] === 1;
        const duplicateLabel = showDuplicateLabel
          ? zeroDuplicateCounts[idx]
          : 0;
        const opacity = inBounds ? IN_BOUNDS_OPACITY : OUT_OF_BOUNDS_OPACITY;
        return (
          <g
            key={zero.id}
            onMouseDown={interactive ? onZeroMouseDown?.(zero.id) : undefined}
            onTouchStart={
              interactive && onZeroTouchStart
                ? (e) => onZeroTouchStart(zero.id)(e)
                : undefined
            }
            onDoubleClick={
              interactive ? onZeroDoubleClick?.(zero.id) : undefined
            }
            style={{ opacity }}
          >
            {/* タッチ時のみ当たり判定を広げる（背面の透明円） */}
            {interactive && coarsePointer && (
              <circle
                cx={svgX}
                cy={svgY}
                r={hitRadius}
                fill="transparent"
                style={{ cursor: 'move' }}
              />
            )}
            <circle
              cx={svgX}
              cy={svgY}
              r={8}
              fill="white"
              stroke="#499143"
              strokeWidth="3"
              style={{ cursor: interactive ? 'move' : 'default' }}
            />
            {duplicateLabel > 0 && (
              <text
                x={svgX + 10}
                y={svgY - 8}
                fontSize={DUPLICATE_LABEL_FONT_SIZE}
                fill="#499143"
                fontWeight="bold"
                style={{ pointerEvents: 'none' }}
              >
                {duplicateLabel}
              </text>
            )}
            {showZeroPoleTooltip && (
              <foreignObject
                x={svgX - 10}
                y={svgY - 10}
                width={20}
                height={20}
                style={{ overflow: 'visible', pointerEvents: 'none' }}
              >
                <ZeroPoleTooltip
                  title={formatTooltipText(zero, false)}
                  interactive={interactive}
                />
              </foreignObject>
            )}
          </g>
        );
      })}

      {/* 極 (×) */}
      {poles.map((pole, idx) => {
        const svgX = toSvgX(pole.real, scale);
        const svgY = toSvgY(pole.imag, scale);
        const inBounds = isInBounds?.(pole.real, pole.imag) ?? true;
        const isDuplicate = poleDuplicateCounts[idx] >= 2;
        const showDuplicateLabel =
          isDuplicate && poleDuplicateOrdinals[idx] === 1;
        const duplicateLabel = showDuplicateLabel
          ? poleDuplicateCounts[idx]
          : 0;
        const opacity = inBounds ? IN_BOUNDS_OPACITY : OUT_OF_BOUNDS_OPACITY;
        return (
          <g
            key={pole.id}
            onMouseDown={interactive ? onPoleMouseDown?.(pole.id) : undefined}
            onTouchStart={
              interactive && onPoleTouchStart
                ? (e) => onPoleTouchStart(pole.id)(e)
                : undefined
            }
            onDoubleClick={
              interactive ? onPoleDoubleClick?.(pole.id) : undefined
            }
            style={{ opacity }}
          >
            <line
              x1={svgX - 8}
              y1={svgY - 8}
              x2={svgX + 8}
              y2={svgY + 8}
              stroke="#db464b"
              strokeWidth="3"
              strokeLinecap="round"
              style={{ pointerEvents: 'none' }}
            />
            <line
              x1={svgX - 8}
              y1={svgY + 8}
              x2={svgX + 8}
              y2={svgY - 8}
              stroke="#db464b"
              strokeWidth="3"
              strokeLinecap="round"
              style={{ pointerEvents: 'none' }}
            />
            {/* 透明な円でクリック領域（タッチ時はより広く） */}
            {interactive && (
              <circle
                cx={svgX}
                cy={svgY}
                r={hitRadius}
                fill="transparent"
                style={{ cursor: 'move' }}
              />
            )}
            {duplicateLabel > 0 && (
              <text
                x={svgX + 10}
                y={svgY - 8}
                fontSize={DUPLICATE_LABEL_FONT_SIZE}
                fill="#db464b"
                fontWeight="bold"
                style={{ pointerEvents: 'none' }}
              >
                {duplicateLabel}
              </text>
            )}
            {showZeroPoleTooltip && (
              <foreignObject
                x={svgX - 10}
                y={svgY - 10}
                width={20}
                height={20}
                style={{ overflow: 'visible', pointerEvents: 'none' }}
              >
                <ZeroPoleTooltip
                  title={formatTooltipText(pole, true)}
                  interactive={interactive}
                />
              </foreignObject>
            )}
          </g>
        );
      })}
    </>
  );
};
