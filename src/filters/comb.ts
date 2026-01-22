import type { FilterDesignBase, FilterGenerationResult } from './base';
import type { PoleOrZero, PoleZeroReal, PoleZeroPair } from '../types';
import { CombFilterPanel } from '../components/filters/CombFilterPanel';

/**
 * コムフィルタ設計
 */
export class CombFilterDesign implements FilterDesignBase {
  id = 'comb';
  nameKey = 'filters.comb.name';
  descriptionKey = 'filters.comb.description';
  PanelComponent = CombFilterPanel;

  generate(params: Record<string, any>): FilterGenerationResult {
    const { type, delay, gain } = params;

    if (type === 'feedforward') {
      return this.generateFeedforwardComb(delay, gain);
    } else if (type === 'feedback') {
      return this.generateFeedbackComb(delay, gain);
    }

    throw new Error(`Unknown comb filter type: ${type}`);
  }

  /**
   * M次の根を計算する（PoleOrZero形式で直接生成）
   * z^M = a の解を求める
   *
   * z_k = |a|^(1/M) * exp(j * (θ + 2πk) / M), k = 0, 1, ..., M-1
   * ここで θ は a の偏角
   *
   * @param a 係数
   * @param M 次数（遅延サンプル数）
   * @returns M個の根（PoleOrZero形式）
   */
  private calculateMthRoots(a: number, M: number): PoleOrZero[] {
    const roots: PoleOrZero[] = [];

    // a の絶対値と偏角を計算
    const magnitude = Math.pow(Math.abs(a), 1 / M);
    const baseAngle = a >= 0 ? 0 : Math.PI; // a が負の場合は π

    // k = 0 から M-1 まで
    // 上半平面（0 < angle < π）の根のみを処理し、共役ペアとして登録
    for (let k = 0; k < M; k++) {
      const angle = (baseAngle + 2 * Math.PI * k) / M;
      const real = magnitude * Math.cos(angle);
      const imag = magnitude * Math.sin(angle);

      // 実軸上の根（imag ≈ 0）
      if (Math.abs(imag) < 1e-10) {
        roots.push({
          type: 'real',
          id: `comb_${k}`,
          real,
          isPole: false,
        } as PoleZeroReal);
      }
      // 上半平面の根のみ処理（0 < imag）
      else if (imag > 1e-10) {
        roots.push({
          type: 'pair',
          id: `comb_${k}`,
          real,
          imag: Math.abs(imag),
          isPole: false,
        } as PoleZeroPair);
      }
      // 下半平面の根（imag < 0）は上半平面の共役なのでスキップ
    }

    return roots;
  }

  /**
   * フィードフォワード型コムフィルターを生成
   * H(z) = 1 + α·z^(-M) = (z^M + α) / z^M
   *
   * @param delay 遅延サンプル数 M
   * @param gain ゲイン α
   * @returns 極・零点・ゲイン
   */
  private generateFeedforwardComb(
    delay: number,
    gain: number,
  ): FilterGenerationResult {
    // 零点: z^M = -α
    const zeros = this.calculateMthRoots(-gain, delay);
    zeros.forEach((z) => {
      z.isPole = false;
    });

    // 極: z = 0 (M重根)
    const poles: PoleOrZero[] = [];
    for (let i = 0; i < delay; i++) {
      poles.push({
        type: 'real',
        id: `pole_origin_${i}`,
        real: 0,
        isPole: true,
      } as PoleZeroReal);
    }

    return {
      poles,
      zeros,
      gain: 1.0,
    };
  }

  /**
   * フィードバック型コムフィルターを生成
   * H(z) = 1 / (1 - α·z^(-M)) = z^M / (z^M - α)
   *
   * @param delay 遅延サンプル数 M
   * @param gain ゲイン α
   * @returns 極・零点・ゲイン
   */
  private generateFeedbackComb(
    delay: number,
    gain: number,
  ): FilterGenerationResult {
    // 極: z^M = α
    const poles = this.calculateMthRoots(gain, delay);
    poles.forEach((p) => {
      p.isPole = true;
    });

    // 零点: z = 0 (M重根)
    const zeros: PoleOrZero[] = [];
    for (let i = 0; i < delay; i++) {
      zeros.push({
        type: 'real',
        id: `zero_origin_${i}`,
        real: 0,
        isPole: false,
      } as PoleZeroReal);
    }

    return {
      poles,
      zeros,
      gain: 1.0,
    };
  }
}
