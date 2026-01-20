import type { FilterDesignBase, FilterGenerationResult } from './base';
import type { PoleOrZero, PoleZeroReal, PoleZeroPair } from '../types';
import { GaussianFilterPanel } from '../components/filters/GaussianFilterPanel';
import { durandKerner } from '../utils/durandKerner';

/**
 * ガウシアンフィルタ設計
 * 
 * ガウシアンフィルタのインパルス応答:
 * h[n] = exp(-(n^2) / (2 * sigma^2))
 * 
 * 左右対称になるように n = -halfN から halfN まで計算
 */
export class GaussianFilterDesign implements FilterDesignBase {
  id = 'gaussian';
  nameKey = 'filters.gaussian.name';
  descriptionKey = 'filters.gaussian.description';
  PanelComponent = GaussianFilterPanel;

  generate(params: Record<string, any>): FilterGenerationResult {
    const { sigma, taps } = params;
    return this.generateGaussianFilter(sigma, taps);
  }

  /**
   * ガウシアンフィルタを生成
   * 
   * @param sigma 標準偏差（ガウシアンの幅を制御）
   * @param taps タップ数（奇数、31以下）
   * @returns 極・零点・ゲイン
   */
  private generateGaussianFilter(
    sigma: number,
    taps: number
  ): FilterGenerationResult {
    // タップ数は奇数で31以下
    const N = Math.min(Math.max(3, taps), 31);
    const halfN = Math.floor(N / 2);
    
    // インパルス応答を計算（左右対称）
    const impulseResponse: number[] = [];
    for (let n = -halfN; n <= halfN; n++) {
      const value = Math.exp(-(n * n) / (2 * sigma * sigma));
      impulseResponse.push(value);
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
    
    if (coefficients.length > 1) {
      // 最高次の係数が0でないことを確認
      if (Math.abs(coefficients[0]) > 1e-10) {
        try {
          // 多項式の根を求める
          const roots = durandKerner(coefficients);
          
          // 根をPoleOrZero形式に変換
          for (let i = 0; i < roots.length; i++) {
            const root = roots[i];
            
            // 実軸上の零点
            if (Math.abs(root.imag) < 1e-10) {
              zeros.push({
                type: 'real',
                id: `gaussian_zero_${i}`,
                real: root.real,
                isPole: false,
              } as PoleZeroReal);
            }
            // 上半平面の零点のみ処理（共役ペアとして登録）
            else if (root.imag > 1e-10) {
              zeros.push({
                type: 'pair',
                id: `gaussian_zero_${i}`,
                real: root.real,
                imag: Math.abs(root.imag),
                isPole: false,
              } as PoleZeroPair);
            }
          }
        } catch (error) {
          // DKA法が失敗した場合は零点なし（エラーを無視）
          console.warn('Failed to calculate gaussian filter zeros:', error);
        }
      }
    }
    
    // 極: FIRフィルタなので原点に N-1 個の極
    const poles: PoleOrZero[] = [];
    for (let i = 0; i < N - 1; i++) {
      poles.push({
        type: 'real',
        id: `gaussian_pole_origin_${i}`,
        real: 0,
        isPole: true,
      } as PoleZeroReal);
    }
    
    // ゲイン: 伝達関数の因数分解における全体の係数
    // H(z) = K * z^(-halfN) * ∏(z - z_i)
    // ここで、K は z^(-halfN) の係数、つまり h[halfN] (インパルス応答の最後のサンプル)
    // impulseResponse配列は [h[-halfN], ..., h[0], ..., h[halfN]] の順序
    const gain = impulseResponse[impulseResponse.length - 1];
    
    return { poles, zeros, gain };
  }
}

