import type { FilterDesignBase, FilterGenerationResult } from './base';
import type { PoleOrZero, PoleZeroReal, PoleZeroPair } from '../types';
import { SincFilterPanel } from '../components/filters/SincFilterPanel';
import { durandKerner } from '../utils/durandKerner';

/**
 * Sincフィルタ設計
 *
 * 理想的なローパスフィルタのインパルス応答:
 * h[n] = sin(π * n * fc) / (π * n)  (n ≠ 0)
 * h[0] = fc  (n = 0)
 *
 * 左右対称になるように n = -N/2 から N/2 まで計算
 */
export class SincFilterDesign implements FilterDesignBase {
  id = 'sinc';
  nameKey = 'filters.sinc.name';
  descriptionKey = 'filters.sinc.description';
  PanelComponent = SincFilterPanel;

  generate(params: Record<string, any>): FilterGenerationResult {
    const { cutoffFrequency, taps, windowFunction = 'none' } = params;
    return this.generateSincFilter(cutoffFrequency, taps, windowFunction);
  }

  /**
   * Sincフィルタを生成
   *
   * @param cutoffFrequency カットオフ周波数（rad/s）
   * @param taps タップ数（奇数、31以下）
   * @param windowFunction 窓関数 ('none' | 'hann')
   * @returns 極・零点・ゲイン
   */
  private generateSincFilter(
    cutoffFrequency: number,
    taps: number,
    windowFunction: string = 'none',
  ): FilterGenerationResult {
    // タップ数は奇数で31以下
    const N = Math.min(Math.max(3, taps), 31);
    const halfN = Math.floor(N / 2);

    // インパルス応答を計算（左右対称）
    const impulseResponse: number[] = [];
    for (let n = -halfN; n <= halfN; n++) {
      if (n === 0) {
        impulseResponse.push(cutoffFrequency / Math.PI);
      } else {
        const value = Math.sin(cutoffFrequency * n) / (Math.PI * n);
        impulseResponse.push(value);
      }
    }

    // 窓関数を適用
    if (windowFunction === 'hann') {
      for (let i = 0; i < impulseResponse.length; i++) {
        // 最初のサンプルが 0 にならないように、窓関数の長さは N + 1 になるようにする
        const n = i - halfN; // -halfN から halfN までのインデックス
        const normalizedIndex = (n + halfN + 1) / (N + 1); // 0 から 1 に正規化
        const windowValue = 0.5 * (1 - Math.cos(2 * Math.PI * normalizedIndex));
        impulseResponse[i] *= windowValue;
      }
    }

    // ノーマライズ
    const sum = impulseResponse.reduce((acc, curr) => acc + curr, 0);
    for (let i = 0; i < impulseResponse.length; i++) {
      impulseResponse[i] /= sum;
    }

    // 伝達関数 H(z) = Σ h[n] * z^(-n) の係数を計算
    // z^(-n) の係数が h[n] なので、降べき順に並べると:
    // H(z) = h[-halfN] * z^(halfN) + ... + h[0] + ... + h[halfN] * z^(-halfN)
    // これを z^(-halfN) で割ると:
    // H(z) * z^(halfN) = h[-halfN] * z^(2*halfN) + ... + h[0] * z^(halfN) + ... + h[halfN]
    // つまり、多項式の係数は [h[-halfN], h[-halfN+1], ..., h[0], ..., h[halfN]]
    const coefficients = [...impulseResponse];

    // 零点を求める（DKA法を使用）
    // H(z) * z^(halfN) = 0 の根を求める
    const zeros: PoleOrZero[] = [];

    // 0次の係数（定数項）を削除した回数をカウント（原点の極の数）
    let removedConstantTermsCount = 0;

    // 最高次の係数が0に近い場合は削除（x=∞の根は省略可能）
    // 削除後も再度0チェックを行い、0以外になるまで繰り返す
    let trimmedCoefficients = [...coefficients];

    // Sincフィルタの零点の許容誤差
    // 1e-10 は durandKerner で解くには小さすぎるので、1e-5 ～ 1e-6 に設定
    const sincFilterZeroTolerance = 1e-5;

    if (coefficients.length > 1) {
      while (
        trimmedCoefficients.length > 1 &&
        Math.abs(trimmedCoefficients[0]) <= sincFilterZeroTolerance
      ) {
        trimmedCoefficients = trimmedCoefficients.slice(1);
      }

      // 0次の係数（定数項）が0に近い場合は削除（z=0の根を削除し、原点に極を追加）
      // 削除後も再度0チェックを行い、0以外になるまで繰り返す
      while (
        trimmedCoefficients.length > 1 &&
        Math.abs(trimmedCoefficients[trimmedCoefficients.length - 1]) <=
          sincFilterZeroTolerance
      ) {
        trimmedCoefficients = trimmedCoefficients.slice(0, -1);
        removedConstantTermsCount++;
      }

      // 最高次の係数が0でないことを確認
      if (
        trimmedCoefficients.length > 1 &&
        Math.abs(trimmedCoefficients[0]) > sincFilterZeroTolerance
      ) {
        try {
          // 多項式の根を求める
          const roots = durandKerner(trimmedCoefficients);

          // 根をPoleOrZero形式に変換
          for (let i = 0; i < roots.length; i++) {
            const root = roots[i];

            // 実軸上の零点
            if (Math.abs(root.imag) < 1e-10) {
              zeros.push({
                type: 'real',
                id: `sinc_zero_${i}`,
                real: root.real,
                isPole: false,
              } as PoleZeroReal);
            }
            // 上半平面の零点のみ処理（共役ペアとして登録）
            else if (root.imag >= 1e-10) {
              zeros.push({
                type: 'pair',
                id: `sinc_zero_${i}`,
                real: root.real,
                imag: Math.abs(root.imag),
                isPole: false,
              } as PoleZeroPair);
            }
          }
        } catch (error) {
          // DKA法が失敗した場合は零点なし（エラーを無視）
          console.warn('Failed to calculate sinc filter zeros:', error);
        }
      }
    }

    // 極: FIRフィルタなので原点に N-1 個の極
    // ただし、多項式の次数を削減した場合は、その数に応じて FIR フィルタのタップ数が減ることに注意する
    // 代わりに、0次の係数（定数項）を削除した分だけ原点に極を追加し、遅延を追加する（zで割った分）
    const poles: PoleOrZero[] = [];
    const poleCount = Math.max(
      0,
      trimmedCoefficients.length - 1 + removedConstantTermsCount,
    );
    for (let i = 0; i < poleCount; i++) {
      poles.push({
        type: 'real',
        id: `sinc_pole_origin_${i}`,
        real: 0,
        isPole: true,
      } as PoleZeroReal);
    }

    // ゲイン: 伝達関数の因数分解における全体の係数
    // H(z) = K * z^(-halfN) * ∏(z - z_i)
    // ここで、K は z^(-halfN) の係数、つまり h[halfN] (インパルス応答の最後のサンプル)
    // impulseResponse配列は [h[-halfN], ..., h[0], ..., h[halfN]] の順序
    // トリミング後の係数を使用する（定数項が削除された場合は、削除後の最後の係数）
    const gain =
      trimmedCoefficients.length > 0
        ? trimmedCoefficients[trimmedCoefficients.length - 1]
        : impulseResponse[impulseResponse.length - 1];

    return { poles, zeros, gain };
  }
}
