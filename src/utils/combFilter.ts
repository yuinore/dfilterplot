import type { PoleOrZero, PoleZeroReal, PoleZeroPair } from '../types';

/**
 * コムフィルターの生成結果
 */
interface CombFilterResult {
  poles: PoleOrZero[];
  zeros: PoleOrZero[];
  gain: number;
}

/**
 * M次の根を計算する
 * z^M = a の解を求める
 * 
 * @param a 係数
 * @param M 次数（遅延サンプル数）
 * @returns M個の根（PoleOrZero形式）
 */
function calculateMthRoots(a: number, M: number): PoleOrZero[] {
  const roots: PoleOrZero[] = [];
  
  // a の絶対値と偏角を計算
  const magnitude = Math.pow(Math.abs(a), 1 / M);
  const baseAngle = a >= 0 ? 0 : Math.PI; // a が負の場合は π
  
  for (let k = 0; k < M; k++) {
    const angle = (baseAngle + 2 * Math.PI * k) / M;
    const real = magnitude * Math.cos(angle);
    const imag = magnitude * Math.sin(angle);
    
    // 実軸上の根の場合
    if (Math.abs(imag) < 1e-10) {
      roots.push({
        type: 'real',
        id: `comb_${k}`,
        real,
        isPole: false,
      } as PoleZeroReal);
    } else {
      // 複素共役ペアを探す
      let foundConjugate = false;
      for (let j = k + 1; j < M; j++) {
        const angle2 = (baseAngle + 2 * Math.PI * j) / M;
        const real2 = magnitude * Math.cos(angle2);
        const imag2 = magnitude * Math.sin(angle2);
        
        // 共役ペアを見つけた
        if (Math.abs(real - real2) < 1e-10 && Math.abs(imag + imag2) < 1e-10) {
          roots.push({
            type: 'pair',
            id: `comb_${k}`,
            real,
            imag: Math.abs(imag),
            isPole: false,
          } as PoleZeroPair);
          foundConjugate = true;
          break;
        }
      }
      
      // 共役ペアが既に追加されている場合はスキップ
      if (!foundConjugate) {
        // 既に追加されているかチェック
        const alreadyAdded = roots.some(
          (r) =>
            r.type === 'pair' &&
            Math.abs(r.real - real) < 1e-10 &&
            Math.abs((r as PoleZeroPair).imag - Math.abs(imag)) < 1e-10
        );
        
        if (!alreadyAdded) {
          roots.push({
            type: 'pair',
            id: `comb_${k}`,
            real,
            imag: Math.abs(imag),
            isPole: false,
          } as PoleZeroPair);
        }
      }
    }
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
export function generateFeedforwardComb(delay: number, gain: number): CombFilterResult {
  // 零点: z^M = -α
  const zeros = calculateMthRoots(-gain, delay);
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
export function generateFeedbackComb(delay: number, gain: number): CombFilterResult {
  // 極: z^M = α
  const poles = calculateMthRoots(gain, delay);
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

