import type { PoleOrZero, PoleZeroReal, PoleZeroPair } from '../types';

/**
 * バターワースフィルターの生成結果
 */
interface ButterworthFilterResult {
  poles: PoleOrZero[];
  zeros: PoleOrZero[];
  gain: number;
}

/**
 * 複素数クラス（内部計算用）
 */
class Complex {
  real: number;
  imag: number;

  constructor(real: number, imag: number) {
    this.real = real;
    this.imag = imag;
  }

  add(c: Complex): Complex {
    return new Complex(this.real + c.real, this.imag + c.imag);
  }

  subtract(c: Complex): Complex {
    return new Complex(this.real - c.real, this.imag - c.imag);
  }

  multiply(c: Complex): Complex {
    return new Complex(
      this.real * c.real - this.imag * c.imag,
      this.real * c.imag + this.imag * c.real
    );
  }

  divide(c: Complex): Complex {
    const denom = c.real * c.real + c.imag * c.imag;
    return new Complex(
      (this.real * c.real + this.imag * c.imag) / denom,
      (this.imag * c.real - this.real * c.imag) / denom
    );
  }
}

/**
 * バターワースフィルタの極を計算（PoleOrZero形式で直接生成）
 * 
 * @param order フィルタ次数
 * @param cutoffFrequency カットオフ周波数（rad/s）
 * @param idPrefix 極のIDプレフィックス
 * @returns デジタル極の配列（PoleOrZero形式）
 */
function calculateButterworthPolesAsPoleOrZero(
  order: number,
  cutoffFrequency: number,
  idPrefix: string
): PoleOrZero[] {
  const poles: PoleOrZero[] = [];
  
  // 周波数ワーピング
  const warpedCutoff = Math.tan(cutoffFrequency / 2);
  const T = 2; // サンプリング周期（正規化）
  
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
 * 双一次変換（Bilinear Transform）
 * s = (2/T) * (1 - z^(-1)) / (1 + z^(-1))
 * => z = (1 + sT/2) / (1 - sT/2)
 * 
 * @param analogPole アナログ極（s平面）
 * @param T サンプリング周期（正規化：T=2）
 * @returns デジタル極（z平面）
 */
function bilinearTransform(analogPole: Complex, T: number = 2): Complex {
  // z = (1 + s*T/2) / (1 - s*T/2)
  const halfT = T / 2;
  const numerator = new Complex(1, 0).add(analogPole.multiply(new Complex(halfT, 0)));
  const denominator = new Complex(1, 0).subtract(analogPole.multiply(new Complex(halfT, 0)));
  return numerator.divide(denominator);
}

/**
 * ローパス バターワースフィルタを生成
 * 
 * @param order フィルタ次数
 * @param cutoffFrequency カットオフ周波数（rad/s）
 * @returns 極・零点・ゲイン
 */
export function generateLowPassButterworth(
  order: number,
  cutoffFrequency: number
): ButterworthFilterResult {
  // 極を直接PoleOrZero形式で計算
  const poles = calculateButterworthPolesAsPoleOrZero(order, cutoffFrequency, 'butterworth_lp_pole');
  
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
export function generateHighPassButterworth(
  order: number,
  cutoffFrequency: number
): ButterworthFilterResult {
  // 極を直接PoleOrZero形式で計算（LPと同じ極を使用）
  const poles = calculateButterworthPolesAsPoleOrZero(order, cutoffFrequency, 'butterworth_hp_pole');
  
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
  
  const gain = denominator / numerator;
  
  return { poles, zeros, gain };
}

