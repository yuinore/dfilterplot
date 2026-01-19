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
  constructor(public real: number, public imag: number) {}

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
 * バターワースアナログプロトタイプの極を計算
 * 
 * @param order フィルタ次数
 * @returns アナログ極の配列（s平面）
 */
function calculateButterworthPoles(order: number): Complex[] {
  const poles: Complex[] = [];
  
  for (let k = 0; k < order; k++) {
    // s_k = exp(j * (π/2 + (2k+1)π/(2n)))
    const angle = Math.PI / 2 + ((2 * k + 1) * Math.PI) / (2 * order);
    const real = Math.cos(angle);
    const imag = Math.sin(angle);
    poles.push(new Complex(real, imag));
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
  // 1. アナログプロトタイプの極を計算
  const analogPoles = calculateButterworthPoles(order);
  
  // 2. 周波数ワーピングを考慮してアナログ極をスケーリング
  // ωc_analog = tan(ωc_digital * T/2) where T=2
  const warpedCutoff = Math.tan(cutoffFrequency / 2);
  const scaledAnalogPoles = analogPoles.map(
    (pole) => new Complex(pole.real * warpedCutoff, pole.imag * warpedCutoff)
  );
  
  // 3. 双一次変換でデジタル極に変換
  const digitalPoles = scaledAnalogPoles.map((pole) => bilinearTransform(pole, 2));
  
  // 4. PoleOrZero形式に変換
  const poles: PoleOrZero[] = [];
  const processed = new Set<number>();
  
  for (let i = 0; i < digitalPoles.length; i++) {
    if (processed.has(i)) continue;
    
    const pole = digitalPoles[i];
    
    // 実軸上の極
    if (Math.abs(pole.imag) < 1e-10) {
      poles.push({
        type: 'real',
        id: `butterworth_pole_${i}`,
        real: pole.real,
        isPole: true,
      } as PoleZeroReal);
      processed.add(i);
    } else {
      // 複素共役ペア
      poles.push({
        type: 'pair',
        id: `butterworth_pole_${i}`,
        real: pole.real,
        imag: Math.abs(pole.imag),
        isPole: true,
      } as PoleZeroPair);
      processed.add(i);
      
      // 共役ペアを探してマーク
      for (let j = i + 1; j < digitalPoles.length; j++) {
        if (
          Math.abs(digitalPoles[j].real - pole.real) < 1e-10 &&
          Math.abs(digitalPoles[j].imag + pole.imag) < 1e-10
        ) {
          processed.add(j);
          break;
        }
      }
    }
  }
  
  // 5. 零点: ローパスフィルタは z=-1 に order 個の零点
  const zeros: PoleOrZero[] = [];
  for (let i = 0; i < order; i++) {
    zeros.push({
      type: 'real',
      id: `butterworth_zero_${i}`,
      real: -1,
      isPole: false,
    } as PoleZeroReal);
  }
  
  // 6. DC ゲインを1に正規化
  // H(z=1) = 1 となるようにゲインを計算
  let numerator = 1.0;
  let denominator = 1.0;
  
  for (const zero of zeros) {
    numerator *= Math.abs(1 - (zero as PoleZeroReal).real);
  }
  
  for (const pole of poles) {
    if (pole.type === 'real') {
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
  // 1. ローパスプロトタイプを生成
  const lpPrototype = generateLowPassButterworth(order, cutoffFrequency);
  
  // 2. LP→HP変換: 極はそのまま、零点を z=1 に移動
  const zeros: PoleOrZero[] = [];
  for (let i = 0; i < order; i++) {
    zeros.push({
      type: 'real',
      id: `butterworth_zero_hp_${i}`,
      real: 1,
      isPole: false,
    } as PoleZeroReal);
  }
  
  // 3. Nyquist周波数でのゲインを1に正規化
  // H(z=-1) = 1 となるようにゲインを計算
  let numerator = 1.0;
  let denominator = 1.0;
  
  for (const zero of zeros) {
    numerator *= Math.abs(-1 - (zero as PoleZeroReal).real);
  }
  
  for (const pole of lpPrototype.poles) {
    if (pole.type === 'real') {
      denominator *= Math.abs(-1 - pole.real);
    } else {
      const p = pole as PoleZeroPair;
      const dist = Math.sqrt((-1 - p.real) ** 2 + p.imag ** 2);
      denominator *= dist * dist; // 共役ペア分
    }
  }
  
  const gain = denominator / numerator;
  
  return {
    poles: lpPrototype.poles,
    zeros,
    gain,
  };
}

