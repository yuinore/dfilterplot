import { useTranslation } from 'react-i18next';
import { useMemo } from 'react';
import type { PoleZero } from '../types';
import { PoleZeroRenderer } from './PoleZeroRenderer';
import { CollapsiblePanel } from './CollapsiblePanel';

interface SPlaneProps {
  poles: PoleZero[];
  zeros: PoleZero[];
}

/**
 * s平面（極座標成分表示）パネル
 *
 * z = e^s (T=1) の変換を使用
 * s = σ + jω として、x方向にσ（振幅の対数）、y方向にω（偏角）を表示
 */
export const SPlane = ({ poles, zeros }: SPlaneProps) => {
  const { t } = useTranslation();
  const width = 500;
  const height = 500;
  const centerX = width / 2;
  const centerY = height / 2;

  // σ（実部）の範囲: -2 から 2
  const sigmaMin = -2;
  const sigmaMax = 2;
  const sigmaRange = sigmaMax - sigmaMin;

  // ω（虚部）の範囲: -π から π（ナイキスト周波数）
  const omegaMin = -Math.PI;
  const omegaMax = Math.PI;
  const omegaRange = omegaMax - omegaMin;

  // スケール（画面の80%を使用）
  const scaleX = (width * 0.8) / sigmaRange;
  const scaleY = (height * 0.8) / omegaRange;

  // z平面の座標からs平面の座標に変換
  const zToS = (
    zReal: number,
    zImag: number,
  ): { sigma: number; omega: number } => {
    // z = re^(jθ)
    const r = Math.sqrt(zReal * zReal + zImag * zImag);
    const theta = Math.atan2(zImag, zReal);

    // s = ln(z) = ln(r) + jθ
    const sigma = Math.log(Math.max(r, 1e-10)); // 0を避ける
    const omega = theta;

    return { sigma, omega };
  };

  // s平面の座標をSVG座標に変換
  const toSvgX = (sigma: number): number => {
    return Math.max(0, Math.min(width, centerX + sigma * scaleX));
  };

  const toSvgY = (omega: number): number => {
    return Math.max(0, Math.min(height, centerY - omega * scaleY));
  };

  // z平面の極・零点をs平面に変換
  const sPlanePoles = useMemo(() => {
    return poles.map((pole) => {
      const { sigma, omega } = zToS(pole.real, pole.imag);
      return {
        ...pole,
        real: sigma,
        imag: omega,
      };
    });
  }, [poles]);

  const sPlaneZeros = useMemo(() => {
    return zeros.map((zero) => {
      const { sigma, omega } = zToS(zero.real, zero.imag);
      return {
        ...zero,
        real: sigma,
        imag: omega,
      };
    });
  }, [zeros]);

  return (
    <CollapsiblePanel title={t('sPlane.title')} defaultExpanded={false}>
      <div
        style={{
          aspectRatio: '1 / 1',
          maxWidth: '720px',
          width: '100%',
          border: '1px solid #ccc',
          background: '#fafafa',
          minHeight: 0,
        }}
      >
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* グリッド線 */}
          <defs>
            <pattern
              id="sGrid"
              width={scaleX / 5}
              height={scaleY / 5}
              patternUnits="userSpaceOnUse"
            >
              <path
                d={`M ${scaleX / 5} 0 L 0 0 0 ${scaleY / 5}`}
                fill="none"
                stroke="#e0e0e0"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect width={width} height={height} fill="url(#sGrid)" />

          {/* σ軸（実軸） */}
          <line
            x1={0}
            y1={centerY}
            x2={width}
            y2={centerY}
            stroke="#333"
            strokeWidth="2"
          />
          <text x={width - 30} y={centerY - 10} fontSize="12" fill="#333">
            σ (ln|z|)
          </text>

          {/* ω軸（虚軸） */}
          <line
            x1={centerX}
            y1={0}
            x2={centerX}
            y2={height}
            stroke="#333"
            strokeWidth="2"
          />
          <text x={centerX + 10} y={20} fontSize="12" fill="#333">
            ω (arg(z))
          </text>

          {/* ±ナイキスト周波数の点線 */}
          <line
            x1={0}
            y1={toSvgY(Math.PI)}
            x2={width}
            y2={toSvgY(Math.PI)}
            stroke="#1976d2"
            strokeWidth="2"
            strokeDasharray="5,5"
          />
          <text
            x={width - 50}
            y={toSvgY(Math.PI) - 5}
            fontSize="10"
            fill="#1976d2"
          >
            +π
          </text>

          <line
            x1={0}
            y1={toSvgY(-Math.PI)}
            x2={width}
            y2={toSvgY(-Math.PI)}
            stroke="#1976d2"
            strokeWidth="2"
            strokeDasharray="5,5"
          />
          <text
            x={width - 50}
            y={toSvgY(-Math.PI) + 15}
            fontSize="10"
            fill="#1976d2"
          >
            -π
          </text>

          {/* 極と零点の描画 */}
          <PoleZeroRenderer
            poles={sPlanePoles}
            zeros={sPlaneZeros}
            toSvgX={toSvgX}
            toSvgY={toSvgY}
            interactive={false}
          />
        </svg>
      </div>
    </CollapsiblePanel>
  );
};
