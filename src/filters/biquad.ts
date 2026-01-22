import type { FilterDesignBase, FilterGenerationResult } from './base';
import type { PoleOrZero, PoleZeroReal, PoleZeroPair } from '../types';
import { BiquadFilterPanel } from '../components/filters/BiquadFilterPanel';
import { generateFilterId } from '../utils/filterMath';

/**
 * Biquadフィルタ設計
 *
 * Reference: Audio EQ Cookbook by Robert Bristow-Johnson
 * https://webaudio.github.io/Audio-EQ-Cookbook/Audio-EQ-Cookbook.txt
 */
export class BiquadFilterDesign implements FilterDesignBase {
  id = 'biquad';
  nameKey = 'filters.biquad.name';
  descriptionKey = 'filters.biquad.description';
  PanelComponent = BiquadFilterPanel;

  generate(params: Record<string, any>): FilterGenerationResult {
    const type = params.type as string;
    const cutoffFrequency = params.cutoffFrequency as number;
    const qFactor = params.qFactor as number;

    switch (type) {
      case 'lowpass':
        return this.generateLowPassBiquad(cutoffFrequency, qFactor);
      case 'highpass':
        return this.generateHighPassBiquad(cutoffFrequency, qFactor);
      case 'bandpass':
        return this.generateBandPassBiquad(cutoffFrequency, qFactor);
      case 'bandstop':
        return this.generateBandStopBiquad(cutoffFrequency, qFactor);
      default:
        return this.generateLowPassBiquad(cutoffFrequency, qFactor);
    }
  }

  /**
   * 2次方程式 a*z^2 + b*z + c = 0 の根を求める
   */
  private solveQuadratic(
    a: number,
    b: number,
    c: number,
  ): { real: number; imag: number }[] {
    const discriminant = b * b - 4 * a * c;

    if (Math.abs(discriminant) < 1e-10) {
      // 重根
      const root = -b / (2 * a);
      return [
        { real: root, imag: 0 },
        { real: root, imag: 0 },
      ];
    } else if (discriminant > 0) {
      // 実数根
      const sqrtD = Math.sqrt(discriminant);
      return [
        { real: (-b + sqrtD) / (2 * a), imag: 0 },
        { real: (-b - sqrtD) / (2 * a), imag: 0 },
      ];
    } else {
      // 複素根
      const realPart = -b / (2 * a);
      const imagPart = Math.sqrt(-discriminant) / (2 * a);
      return [
        { real: realPart, imag: imagPart },
        { real: realPart, imag: -imagPart },
      ];
    }
  }

  /**
   * biquad係数から極と零点を計算
   * Audio EQ Cookbook Eq 3に従い、ゲイン (b0/a0) も返す
   */
  private calculatePolesZeros(
    b0: number,
    b1: number,
    b2: number,
    a0: number,
    a1: number,
    a2: number,
  ): FilterGenerationResult {
    // 正規化
    const b0n = b0 / a0;
    const b1n = b1 / a0;
    const b2n = b2 / a0;
    const a1n = a1 / a0;
    const a2n = a2 / a0;

    // 零点: b0 + b1*z^-1 + b2*z^-2 = 0
    // z^2を掛けて: b0*z^2 + b1*z + b2 = 0
    const zeroRoots = this.solveQuadratic(b0n, b1n, b2n);

    // 極: 1 + a1*z^-1 + a2*z^-2 = 0
    // z^2を掛けて: z^2 + a1*z + a2 = 0
    const poleRoots = this.solveQuadratic(1, a1n, a2n);

    const poles: PoleOrZero[] = [];
    const zeros: PoleOrZero[] = [];

    // 極を追加
    if (poleRoots.length === 2 && Math.abs(poleRoots[0].imag) > 1e-6) {
      // 複素共役ペア（正の虚部のみ保持）
      poles.push({
        type: 'pair',
        id: generateFilterId(),
        real: poleRoots[0].real,
        imag: Math.abs(poleRoots[0].imag),
        isPole: true,
      } as PoleZeroPair);
    } else {
      // 実数の極
      for (const root of poleRoots) {
        poles.push({
          type: 'real',
          id: generateFilterId(),
          real: root.real,
          isPole: true,
        } as PoleZeroReal);
      }
    }

    // 零点を追加
    if (zeroRoots.length === 2 && Math.abs(zeroRoots[0].imag) > 1e-6) {
      // 複素共役ペア（正の虚部のみ保持）
      zeros.push({
        type: 'pair',
        id: generateFilterId(),
        real: zeroRoots[0].real,
        imag: Math.abs(zeroRoots[0].imag),
        isPole: false,
      } as PoleZeroPair);
    } else {
      // 実数の零点
      for (const root of zeroRoots) {
        zeros.push({
          type: 'real',
          id: generateFilterId(),
          real: root.real,
          isPole: false,
        } as PoleZeroReal);
      }
    }

    // Audio EQ Cookbook Eq 3のゲインファクター (b0/a0)
    const gain = b0 / a0;

    return { poles, zeros, gain };
  }

  /**
   * Low Pass フィルタの極・零点を生成
   * Audio EQ Cookbook: LPF
   */
  private generateLowPassBiquad(
    cutoffFreq: number,
    Q: number,
  ): FilterGenerationResult {
    const w0 = cutoffFreq;
    const cosW0 = Math.cos(w0);
    const sinW0 = Math.sin(w0);
    const alpha = sinW0 / (2 * Q);

    // LPF coefficients
    const b0 = (1 - cosW0) / 2;
    const b1 = 1 - cosW0;
    const b2 = (1 - cosW0) / 2;
    const a0 = 1 + alpha;
    const a1 = -2 * cosW0;
    const a2 = 1 - alpha;

    return this.calculatePolesZeros(b0, b1, b2, a0, a1, a2);
  }

  /**
   * High Pass フィルタの極・零点を生成
   * Audio EQ Cookbook: HPF
   */
  private generateHighPassBiquad(
    cutoffFreq: number,
    Q: number,
  ): FilterGenerationResult {
    const w0 = cutoffFreq;
    const cosW0 = Math.cos(w0);
    const sinW0 = Math.sin(w0);
    const alpha = sinW0 / (2 * Q);

    // HPF coefficients
    const b0 = (1 + cosW0) / 2;
    const b1 = -(1 + cosW0);
    const b2 = (1 + cosW0) / 2;
    const a0 = 1 + alpha;
    const a1 = -2 * cosW0;
    const a2 = 1 - alpha;

    return this.calculatePolesZeros(b0, b1, b2, a0, a1, a2);
  }

  /**
   * Band Pass フィルタの極・零点を生成
   * Audio EQ Cookbook: BPF (constant 0 dB peak gain)
   */
  private generateBandPassBiquad(
    centerFreq: number,
    Q: number,
  ): FilterGenerationResult {
    const w0 = centerFreq;
    const cosW0 = Math.cos(w0);
    const sinW0 = Math.sin(w0);
    const alpha = sinW0 / (2 * Q);

    // BPF coefficients (constant 0 dB peak gain)
    const b0 = alpha;
    const b1 = 0;
    const b2 = -alpha;
    const a0 = 1 + alpha;
    const a1 = -2 * cosW0;
    const a2 = 1 - alpha;

    return this.calculatePolesZeros(b0, b1, b2, a0, a1, a2);
  }

  /**
   * Band Stop (Notch) フィルタの極・零点を生成
   * Audio EQ Cookbook: notch
   */
  private generateBandStopBiquad(
    notchFreq: number,
    Q: number,
  ): FilterGenerationResult {
    const w0 = notchFreq;
    const cosW0 = Math.cos(w0);
    const sinW0 = Math.sin(w0);
    const alpha = sinW0 / (2 * Q);

    // Notch filter coefficients
    const b0 = 1;
    const b1 = -2 * cosW0;
    const b2 = 1;
    const a0 = 1 + alpha;
    const a1 = -2 * cosW0;
    const a2 = 1 - alpha;

    return this.calculatePolesZeros(b0, b1, b2, a0, a1, a2);
  }
}
