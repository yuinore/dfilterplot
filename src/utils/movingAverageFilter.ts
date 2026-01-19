import type { PoleOrZero, PoleZeroReal, PoleZeroPair } from '../types';

/**
 * 移動平均フィルターの生成結果
 */
interface MovingAverageFilterResult {
  poles: PoleOrZero[];
  zeros: PoleOrZero[];
  gain: number;
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
export function generateMovingAverageFilter(length: number): MovingAverageFilterResult {
  const zeros: PoleOrZero[] = [];
  const poles: PoleOrZero[] = [];
  
  // 零点: 1のN乗根（z^N = 1）のうち、z=1 を除く
  // z = exp(j * 2π * k / N) for k = 1, 2, ..., N-1
  for (let k = 1; k < length; k++) {
    const angle = (2 * Math.PI * k) / length;
    const real = Math.cos(angle);
    const imag = Math.sin(angle);
    
    // 実軸上の零点の場合（k = N/2 の場合、z = -1）
    if (Math.abs(imag) < 1e-10) {
      zeros.push({
        type: 'real',
        id: `ma_zero_${k}`,
        real,
        isPole: false,
      } as PoleZeroReal);
    } else {
      // 複素共役ペアを探す
      // k と N-k は共役ペア（exp(j*θ) と exp(-j*θ) = exp(j*(2π-θ))）
      const conjugateK = length - k;
      
      if (k < conjugateK) {
        // まだペアを追加していない場合のみ追加
        zeros.push({
          type: 'pair',
          id: `ma_zero_${k}`,
          real,
          imag: Math.abs(imag),
          isPole: false,
        } as PoleZeroPair);
      }
    }
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

