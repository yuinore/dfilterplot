import type { FilterDesignBase, FilterGenerationResult } from './base';
import type { PoleOrZero, PoleZeroReal, PoleZeroPair } from '../types';
import { MovingAverageFilterPanel } from '../components/filters/MovingAverageFilterPanel';

/**
 * 移動平均フィルタ設計
 */
export class MovingAverageFilterDesign implements FilterDesignBase {
  id = 'movingaverage';
  nameKey = 'filters.movingAverage.name';
  descriptionKey = 'filters.movingAverage.description';
  PanelComponent = MovingAverageFilterPanel;

  generate(params: Record<string, any>): FilterGenerationResult {
    const { length } = params;
    return this.generateMovingAverageFilter(length);
  }

  /**
   * 移動平均フィルターを生成
   * H(z) = (1/N) * (1 + z^(-1) + z^(-2) + ... + z^(-N+1))
   *      = (1/N) * (z^N - 1) / (z^(N-1) * (z - 1))
   * 
   * 時間領域: y[n] = (1/N) * Σ(k=0 to N-1) x[n-k]
   * 
   * 極・零点配置:
   * - 零点: 1のN乗根のうち z=1 を除く N-1 個（単位円上に等間隔）
   * - 極: 原点に N-1 個（z^(-N+1) の項から）
   * 
   * @param length 移動平均の長さ N
   * @returns 極・零点・ゲイン
   */
  private generateMovingAverageFilter(length: number): FilterGenerationResult {
    const zeros: PoleOrZero[] = [];
    const poles: PoleOrZero[] = [];
    
    // 零点: 1のN乗根（z^N = 1）のうち、z=1 を除く
    // z_k = exp(j * 2πk / N) for k = 1, 2, ..., N-1
    // k と N-k は共役ペア: exp(j*2πk/N) と exp(j*2π(N-k)/N) = exp(-j*2πk/N)
    // 上半平面（0 < angle < π、つまり k < N/2）のみ処理
    for (let k = 1; k < length; k++) {
      const angle = (2 * Math.PI * k) / length;
      
      // 実軸上の零点（k = N/2 の場合、z = -1）
      if (k * 2 === length) {
        zeros.push({
          type: 'real',
          id: `ma_zero_${k}`,
          real: -1,
          isPole: false,
        } as PoleZeroReal);
      }
      // 上半平面の零点のみ処理（k < N/2）
      else if (k * 2 < length) {
        const real = Math.cos(angle);
        const imag = Math.sin(angle);
        
        zeros.push({
          type: 'pair',
          id: `ma_zero_${k}`,
          real,
          imag: Math.abs(imag),
          isPole: false,
        } as PoleZeroPair);
      }
      // k > N/2 は下半平面なのでスキップ（上半平面の共役）
    }
    
    // 極: 原点に N-1 個
    for (let i = 0; i < length - 1; i++) {
      poles.push({
        type: 'real',
        id: `ma_pole_origin_${i}`,
        real: 0,
        isPole: true,
      } as PoleZeroReal);
    }
    
    return {
      poles,
      zeros,
      gain: 1.0 / length, // 正規化ゲイン
    };
  }
}

