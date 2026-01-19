import type { PoleZero, PoleOrZero, PoleZeroReal, PoleZeroPair } from '../types';

/**
 * 双二次フィルタの極・零点を計算
 * 
 * Reference: Audio EQ Cookbook by Robert Bristow-Johnson
 * https://webaudio.github.io/Audio-EQ-Cookbook/Audio-EQ-Cookbook.txt
 */

let nextId = 1000; // フィルタ設計用のIDは1000から開始

function getNextId(): string {
  return (nextId++).toString();
}

/**
 * 2次方程式 a*z^2 + b*z + c = 0 の根を求める
 * z^-2 の形式から z^2 の形式に変換: c + b*z + a*z^2 = 0
 */
function solveQuadratic(a: number, b: number, c: number): { real: number; imag: number }[] {
  if (Math.abs(a) < 1e-10) {
    // 1次方程式
    if (Math.abs(b) < 1e-10) return [];
    const z = -c / b;
    return [{ real: z, imag: 0 }];
  }

  const discriminant = b * b - 4 * a * c;
  
  if (discriminant >= 0) {
    // 実根
    const sqrtD = Math.sqrt(discriminant);
    const z1 = (-b + sqrtD) / (2 * a);
    const z2 = (-b - sqrtD) / (2 * a);
    return [
      { real: z1, imag: 0 },
      { real: z2, imag: 0 },
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
 * biquad係数から極と零点を計算（新型）
 */
function calculatePolesZeros(
  b0: number,
  b1: number,
  b2: number,
  a0: number,
  a1: number,
  a2: number
): { poles: PoleOrZero[]; zeros: PoleOrZero[] } {
  // 正規化
  const b0n = b0 / a0;
  const b1n = b1 / a0;
  const b2n = b2 / a0;
  const a1n = a1 / a0;
  const a2n = a2 / a0;

  // 零点: b0 + b1*z^-1 + b2*z^-2 = 0
  // => b0*z^2 + b1*z + b2 = 0 (z^-2を掛けて変換)
  const zeroRoots = solveQuadratic(b2n, b1n, b0n);

  // 極: 1 + a1*z^-1 + a2*z^-2 = 0
  // => a2 + a1*z + z^2 = 0
  const poleRoots = solveQuadratic(a2n, a1n, 1);

  const poles: PoleOrZero[] = [];
  const zeros: PoleOrZero[] = [];

  // 極を追加
  if (poleRoots.length === 2 && Math.abs(poleRoots[0].imag) > 1e-6) {
    // 複素共役ペア（正の虚部のみ保持）
    poles.push({
      id: getNextId(),
      real: poleRoots[0].real,
      imag: Math.abs(poleRoots[0].imag),
      isPole: true,
    } as PoleZeroPair);
  } else {
    // 実数の極
    for (const root of poleRoots) {
      poles.push({
        id: getNextId(),
        real: root.real,
        isPole: true,
      } as PoleZeroReal);
    }
  }

  // 零点を追加
  if (zeroRoots.length === 2 && Math.abs(zeroRoots[0].imag) > 1e-6) {
    // 複素共役ペア（正の虚部のみ保持）
    zeros.push({
      id: getNextId(),
      real: zeroRoots[0].real,
      imag: Math.abs(zeroRoots[0].imag),
      isPole: false,
    } as PoleZeroPair);
  } else {
    // 実数の零点
    for (const root of zeroRoots) {
      zeros.push({
        id: getNextId(),
        real: root.real,
        isPole: false,
      } as PoleZeroReal);
    }
  }

  return { poles, zeros };
}

/**
 * Low Pass フィルタの極・零点を生成
 * Audio EQ Cookbook: LPF
 */
export function generateLowPassBiquad(cutoffFreq: number, Q: number): {
  poles: PoleOrZero[];
  zeros: PoleOrZero[];
} {
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

  return calculatePolesZeros(b0, b1, b2, a0, a1, a2);
}

/**
 * High Pass フィルタの極・零点を生成
 * Audio EQ Cookbook: HPF
 */
export function generateHighPassBiquad(cutoffFreq: number, Q: number): {
  poles: PoleOrZero[];
  zeros: PoleOrZero[];
} {
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

  return calculatePolesZeros(b0, b1, b2, a0, a1, a2);
}

/**
 * Band Pass フィルタの極・零点を生成
 * Audio EQ Cookbook: BPF (constant 0 dB peak gain)
 */
export function generateBandPassBiquad(centerFreq: number, Q: number): {
  poles: PoleOrZero[];
  zeros: PoleOrZero[];
} {
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

  return calculatePolesZeros(b0, b1, b2, a0, a1, a2);
}

/**
 * Band Stop (Notch) フィルタの極・零点を生成
 * Audio EQ Cookbook: notch
 */
export function generateBandStopBiquad(notchFreq: number, Q: number): {
  poles: PoleOrZero[];
  zeros: PoleOrZero[];
} {
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

  return calculatePolesZeros(b0, b1, b2, a0, a1, a2);
}

