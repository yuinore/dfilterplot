import type { FilterDesignBase, FilterGenerationResult } from './base';
import type { PoleOrZero, PoleZeroReal, PoleZeroPair } from '../types';
import { ButterworthFilterPanel } from '../components/filters/ButterworthFilterPanel';
import { Complex, bilinearTransform } from '../utils/filterMath';

/**
 * バターワースフィルタ設計
 */
export class ButterworthFilterDesign implements FilterDesignBase {
  id = 'butterworth';
  nameKey = 'filters.butterworth.name';
  descriptionKey = 'filters.butterworth.description';
  PanelComponent = ButterworthFilterPanel;

  generate(params: Record<string, any>): FilterGenerationResult {
    const { type, order, cutoffFrequency } = params;

    if (type === 'lowpass') {
      return this.generateLowPassButterworth(order, cutoffFrequency);
    } else if (type === 'highpass') {
      return this.generateHighPassButterworth(order, cutoffFrequency);
    }

    throw new Error(`Unknown butterworth filter type: ${type}`);
  }

  /**
   * バターワースフィルタの極を計算（PoleOrZero形式で直接生成）
   *
   * @param order フィルタ次数
   * @param cutoffFrequency カットオフ周波数（rad/s）
   * @param idPrefix 極のIDプレフィックス
   * @returns デジタル極の配列（PoleOrZero形式）
   */
  private calculateButterworthPolesAsPoleOrZero(
    order: number,
    cutoffFrequency: number,
    idPrefix: string,
  ): PoleOrZero[] {
    const poles: PoleOrZero[] = [];

    // 周波数ワーピング
    const T = 1; // サンプリング周期（正規化）
    const warpedCutoff = (2 / T) * Math.tan((cutoffFrequency * T) / 2);

    // LPF と HPF では極配置が同じ（極が単位円上に対称に配置されているため）
    for (let k = 0; k < order; k++) {
      // s_k = exp(j * (π/2 + (2k+1)π/(2n)))
      const angle = Math.PI / 2 + ((2 * k + 1) * Math.PI) / (2 * order);

      // 実軸上の極（angle = π の場合）
      if (Math.abs(angle - Math.PI) < 1e-10) {
        // アナログ極: s = -warpedCutoff
        const analogPole = new Complex(-warpedCutoff, 0);
        const digitalPole = bilinearTransform(analogPole, T);

        poles.push({
          type: 'real',
          id: `${idPrefix}_${k}`,
          real: digitalPole.real,
          isPole: true,
        } as PoleZeroReal);
      }
      // 上半平面の極のみ処理（共役ペアとして登録）
      else if (angle < Math.PI) {
        // アナログ極: s = warpedCutoff * exp(j * angle)
        const analogReal = Math.cos(angle) * warpedCutoff;
        const analogImag = Math.sin(angle) * warpedCutoff;
        const analogPole = new Complex(analogReal, analogImag);
        const digitalPole = bilinearTransform(analogPole, T);

        poles.push({
          type: 'pair',
          id: `${idPrefix}_${k}`,
          real: digitalPole.real,
          imag: Math.abs(digitalPole.imag),
          isPole: true,
        } as PoleZeroPair);
        // 下半平面の共役ペアは自動的に含まれるので、スキップする必要なし
      }
      // angle > π の極は上半平面の極の共役なので無視
    }

    return poles;
  }

  /**
   * ローパス バターワースフィルタを生成
   *
   * @param order フィルタ次数
   * @param cutoffFrequency カットオフ周波数（rad/s）
   * @returns 極・零点・ゲイン
   */
  private generateLowPassButterworth(
    order: number,
    cutoffFrequency: number,
  ): FilterGenerationResult {
    // 極を直接PoleOrZero形式で計算
    const poles = this.calculateButterworthPolesAsPoleOrZero(
      order,
      cutoffFrequency,
      'butterworth_lp_pole',
    );

    // 零点: ローパスフィルタは z=-1 に order 個の零点
    const zeros: PoleOrZero[] = [];
    for (let i = 0; i < order; i++) {
      zeros.push({
        type: 'real',
        id: `butterworth_lp_zero_${i}`,
        real: -1,
        isPole: false,
      } as PoleZeroReal);
    }

    // DC ゲインを1に正規化: H(z=1) = 1
    let numerator = 1.0;
    let denominator = 1.0;

    for (const zero of zeros) {
      numerator *= Math.abs(1 - (zero as PoleZeroReal).real);
    }

    for (const pole of poles) {
      if ('type' in pole && pole.type === 'real') {
        denominator *= Math.abs(1 - pole.real);
      } else {
        const p = pole as PoleZeroPair;
        const dist = Math.sqrt((1 - p.real) ** 2 + p.imag ** 2);
        denominator *= dist * dist; // 共役ペア分
      }
    }

    const gain = denominator / numerator;

    return { poles, zeros, gain };
  }

  /**
   * ハイパス バターワースフィルタを生成
   *
   * @param order フィルタ次数
   * @param cutoffFrequency カットオフ周波数（rad/s）
   * @returns 極・零点・ゲイン
   */
  private generateHighPassButterworth(
    order: number,
    cutoffFrequency: number,
  ): FilterGenerationResult {
    // 極を直接PoleOrZero形式で計算（LPと同じ極を使用）
    const poles = this.calculateButterworthPolesAsPoleOrZero(
      order,
      cutoffFrequency,
      'butterworth_hp_pole',
    );

    // 零点: ハイパスフィルタは z=1 に order 個の零点
    const zeros: PoleOrZero[] = [];
    for (let i = 0; i < order; i++) {
      zeros.push({
        type: 'real',
        id: `butterworth_hp_zero_${i}`,
        real: 1,
        isPole: false,
      } as PoleZeroReal);
    }

    // Nyquist周波数でのゲインを1に正規化: H(z=-1) = 1
    let numerator = 1.0;
    let denominator = 1.0;

    for (const zero of zeros) {
      numerator *= Math.abs(-1 - (zero as PoleZeroReal).real);
    }

    for (const pole of poles) {
      if ('type' in pole && pole.type === 'real') {
        denominator *= Math.abs(-1 - pole.real);
      } else {
        const p = pole as PoleZeroPair;
        const dist = Math.sqrt((-1 - p.real) ** 2 + p.imag ** 2);
        denominator *= dist * dist; // 共役ペア分
      }
    }

    const gain =
      cutoffFrequency < Math.PI - 1e-9 ? denominator / numerator : 0.0;

    return { poles, zeros, gain };
  }
}
