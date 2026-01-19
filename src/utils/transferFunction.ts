import type { PoleZero, FrequencyResponse } from '../types';

/**
 * 複素数クラス
 */
class Complex {
  constructor(public real: number, public imag: number) {}

  add(other: Complex): Complex {
    return new Complex(this.real + other.real, this.imag + other.imag);
  }

  subtract(other: Complex): Complex {
    return new Complex(this.real - other.real, this.imag - other.imag);
  }

  multiply(other: Complex): Complex {
    return new Complex(
      this.real * other.real - this.imag * other.imag,
      this.real * other.imag + this.imag * other.real
    );
  }

  divide(other: Complex): Complex {
    const denominator = other.real * other.real + other.imag * other.imag;
    return new Complex(
      (this.real * other.real + this.imag * other.imag) / denominator,
      (this.imag * other.real - this.real * other.imag) / denominator
    );
  }

  magnitude(): number {
    return Math.sqrt(this.real * this.real + this.imag * this.imag);
  }

  phase(): number {
    return Math.atan2(this.imag, this.real);
  }

  static fromPolar(magnitude: number, phase: number): Complex {
    return new Complex(magnitude * Math.cos(phase), magnitude * Math.sin(phase));
  }
}

/**
 * 伝達関数 H(z) を計算
 * H(z) = K * ∏(z - zi) / ∏(z - pi)
 */
function evaluateTransferFunction(
  z: Complex,
  zeros: PoleZero[],
  poles: PoleZero[],
  gain: number = 1.0
): Complex {
  let numerator = new Complex(gain, 0);
  let denominator = new Complex(1, 0);

  // 分子: (z - zero1)(z - zero2)...
  for (const zero of zeros) {
    const zeroComplex = new Complex(zero.real, zero.imag);
    numerator = numerator.multiply(z.subtract(zeroComplex));
  }

  // 分母: (z - pole1)(z - pole2)...
  for (const pole of poles) {
    const poleComplex = new Complex(pole.real, pole.imag);
    denominator = denominator.multiply(z.subtract(poleComplex));
  }

  return numerator.divide(denominator);
}

/**
 * 周波数応答を計算
 * z = e^(jω) として H(e^(jω)) を評価
 */
export function calculateFrequencyResponse(
  zeros: PoleZero[],
  poles: PoleZero[],
  numPoints: number = 512
): FrequencyResponse {
  const frequencies: number[] = [];
  const magnitudes: number[] = [];
  const phases: number[] = [];

  // ゲインを自動調整（DC ゲインを 0 dB に正規化）
  let gain = 1.0;
  if (zeros.length > 0 || poles.length > 0) {
    // ω = 0 での応答を計算
    const z0 = new Complex(1, 0); // e^(j*0) = 1
    const h0 = evaluateTransferFunction(z0, zeros, poles, 1.0);
    const mag0 = h0.magnitude();
    if (mag0 > 1e-10) {
      gain = 1.0 / mag0;
    }
  }

  // 周波数範囲: 0 から π (正規化周波数)
  for (let i = 0; i < numPoints; i++) {
    const omega = (Math.PI * i) / (numPoints - 1);
    frequencies.push(omega);

    // z = e^(jω)
    const z = Complex.fromPolar(1, omega);

    // H(e^(jω)) を計算
    const h = evaluateTransferFunction(z, zeros, poles, gain);

    // 振幅 (dB)
    const magnitude = h.magnitude();
    const magnitudeDB = magnitude > 1e-10 ? 20 * Math.log10(magnitude) : -200;
    magnitudes.push(magnitudeDB);

    // 位相 (度)
    const phaseDeg = (h.phase() * 180) / Math.PI;
    phases.push(phaseDeg);
  }

  return {
    frequency: frequencies,
    magnitude: magnitudes,
    phase: phases,
  };
}

/**
 * 対数周波数スケールで周波数応答を計算
 */
export function calculateFrequencyResponseLog(
  zeros: PoleZero[],
  poles: PoleZero[],
  numPoints: number = 512
): FrequencyResponse {
  const frequencies: number[] = [];
  const magnitudes: number[] = [];
  const phases: number[] = [];

  // ゲインを自動調整
  let gain = 1.0;
  if (zeros.length > 0 || poles.length > 0) {
    const z0 = new Complex(1, 0);
    const h0 = evaluateTransferFunction(z0, zeros, poles, 1.0);
    const mag0 = h0.magnitude();
    if (mag0 > 1e-10) {
      gain = 1.0 / mag0;
    }
  }

  // 対数周波数範囲: 10^-3 から π
  const omegaMin = Math.log10(1e-3);
  const omegaMax = Math.log10(Math.PI);

  for (let i = 0; i < numPoints; i++) {
    const logOmega = omegaMin + ((omegaMax - omegaMin) * i) / (numPoints - 1);
    const omega = Math.pow(10, logOmega);
    frequencies.push(omega);

    const z = Complex.fromPolar(1, omega);
    const h = evaluateTransferFunction(z, zeros, poles, gain);

    const magnitude = h.magnitude();
    const magnitudeDB = magnitude > 1e-10 ? 20 * Math.log10(magnitude) : -200;
    magnitudes.push(magnitudeDB);

    const phaseDeg = (h.phase() * 180) / Math.PI;
    phases.push(phaseDeg);
  }

  return {
    frequency: frequencies,
    magnitude: magnitudes,
    phase: phases,
  };
}

/**
 * 群遅延を計算
 * Group delay = -d(phase)/dω
 */
export function calculateGroupDelay(
  zeros: PoleZero[],
  poles: PoleZero[],
  numPoints: number = 512,
  logarithmic: boolean = true
): { frequency: number[]; groupDelay: number[] } {
  const frequencies: number[] = [];
  const groupDelays: number[] = [];

  // ゲインを自動調整
  let gain = 1.0;
  if (zeros.length > 0 || poles.length > 0) {
    const z0 = new Complex(1, 0);
    const h0 = evaluateTransferFunction(z0, zeros, poles, 1.0);
    const mag0 = h0.magnitude();
    if (mag0 > 1e-10) {
      gain = 1.0 / mag0;
    }
  }

  // 周波数範囲の設定
  const omegaMin = logarithmic ? Math.log10(1e-3) : 0;
  const omegaMax = logarithmic ? Math.log10(Math.PI) : Math.PI;

  // 位相を計算
  const phases: number[] = [];
  for (let i = 0; i < numPoints; i++) {
    let omega: number;
    if (logarithmic) {
      const logOmega = omegaMin + ((omegaMax - omegaMin) * i) / (numPoints - 1);
      omega = Math.pow(10, logOmega);
    } else {
      omega = omegaMin + ((omegaMax - omegaMin) * i) / (numPoints - 1);
    }
    frequencies.push(omega);

    const z = Complex.fromPolar(1, omega);
    const h = evaluateTransferFunction(z, zeros, poles, gain);
    phases.push(h.phase());
  }

  // 位相アンラッピング: -π から π の境界でのジャンプを補正
  const unwrappedPhases: number[] = [phases[0]];
  let cumulativeOffset = 0;
  
  for (let i = 1; i < numPoints; i++) {
    const phaseDiff = phases[i] - phases[i - 1];
    
    // 位相差が π より大きい場合（-π から π へのジャンプ）
    if (phaseDiff > Math.PI) {
      cumulativeOffset -= 2 * Math.PI;
    }
    // 位相差が -π より小さい場合（π から -π へのジャンプ）
    else if (phaseDiff < -Math.PI) {
      cumulativeOffset += 2 * Math.PI;
    }
    
    unwrappedPhases.push(phases[i] + cumulativeOffset);
  }

  // 群遅延 = -d(phase)/dω を数値微分で計算（アンラップされた位相を使用）
  for (let i = 0; i < numPoints; i++) {
    let groupDelay: number;
    
    if (i === 0) {
      // 前方差分
      groupDelay = -(unwrappedPhases[i + 1] - unwrappedPhases[i]) / (frequencies[i + 1] - frequencies[i]);
    } else if (i === numPoints - 1) {
      // 後方差分
      groupDelay = -(unwrappedPhases[i] - unwrappedPhases[i - 1]) / (frequencies[i] - frequencies[i - 1]);
    } else {
      // 中心差分
      groupDelay = -(unwrappedPhases[i + 1] - unwrappedPhases[i - 1]) / (frequencies[i + 1] - frequencies[i - 1]);
    }
    
    groupDelays.push(groupDelay);
  }

  return {
    frequency: frequencies,
    groupDelay: groupDelays,
  };
}

/**
 * 極または零点の配列から多項式係数を計算（実数係数）
 * (z - r1)(z - r2)... = z^n + c[n-1]*z^(n-1) + ... + c[1]*z + c[0]
 * 複素共役ペアは (z - (a+jb))(z - (a-jb)) = z^2 - 2a*z + (a^2+b^2) として処理
 * 返り値：係数配列 [c[0], c[1], ..., c[n-1], 1.0]（最高次の係数は1）
 */
function polynomialFromRoots(roots: PoleZero[]): number[] {
  if (roots.length === 0) {
    return [1.0]; // 係数なし = 1
  }

  // 初期値：1
  let coeffs = [1.0];

  // 処理済みフラグ
  const processed = new Array(roots.length).fill(false);

  for (let i = 0; i < roots.length; i++) {
    if (processed[i]) continue;

    const root = roots[i];
    const newCoeffs: number[] = [];

    // 複素共役ペアをチェック
    if (Math.abs(root.imag) > 1e-10 && root.pairId) {
      // 複素共役ペア：(z - (a+jb))(z - (a-jb)) = z^2 - 2a*z + (a^2+b^2)
      const a = root.real;
      const b = Math.abs(root.imag);
      const secondOrderCoeffs = [a * a + b * b, -2 * a, 1.0]; // [c0, c1, c2]

      // 畳み込み：既存の係数と2次多項式を掛ける
      for (let k = 0; k < coeffs.length + 2; k++) {
        newCoeffs[k] = 0;
      }
      for (let j = 0; j < coeffs.length; j++) {
        for (let k = 0; k < 3; k++) {
          newCoeffs[j + k] += coeffs[j] * secondOrderCoeffs[k];
        }
      }

      // ペアの相手もマーク
      const pairIndex = roots.findIndex((r) => r.id === root.pairId);
      if (pairIndex !== -1) {
        processed[pairIndex] = true;
      }
    } else {
      // 実数の根：(z - r) = z - r
      const r = root.real;
      
      for (let k = 0; k < coeffs.length + 1; k++) {
        newCoeffs[k] = 0;
      }
      for (let j = 0; j < coeffs.length; j++) {
        newCoeffs[j] += coeffs[j] * (-r);  // c[j] * (-r)
        newCoeffs[j + 1] += coeffs[j];     // c[j] * z
      }
    }

    coeffs = newCoeffs;
    processed[i] = true;
  }

  return coeffs;
}

/**
 * インパルス応答を計算（係数ベース）
 * 極・零点から伝達関数係数を計算し、差分方程式を実行
 * H(z) = B(z)/A(z) = (b[0] + b[1]*z^-1 + ...) / (1 + a[1]*z^-1 + ...)
 */
export function calculateImpulseResponse(
  zeros: PoleZero[],
  poles: PoleZero[],
  numPoints: number = 128
): { time: number[]; amplitude: number[] } {
  const time: number[] = [];
  const amplitude: number[] = [];

  // 零点から分子多項式係数を計算（z の降べきの順）
  const numeratorCoeffs = polynomialFromRoots(zeros);
  
  // 極から分母多項式係数を計算（z の降べきの順）
  const denominatorCoeffs = polynomialFromRoots(poles);

  // 係数を z^-1 の昇べきの順に変換（差分方程式用）
  // [c[0], c[1], ..., c[n]] → [c[n], c[n-1], ..., c[0]]
  const b = [...numeratorCoeffs].reverse();   // 分子係数
  const a = [...denominatorCoeffs].reverse(); // 分母係数

  // 分母係数を正規化（a[0] = 1 にする）
  const a0 = a[0];
  for (let i = 0; i < a.length; i++) {
    a[i] /= a0;
  }
  for (let i = 0; i < b.length; i++) {
    b[i] /= a0;
  }

  // DC ゲインを 0 dB に正規化
  let gain = 1.0;
  const bSum = b.reduce((sum, val) => sum + val, 0);
  const aSum = a.reduce((sum, val) => sum + val, 0);
  if (Math.abs(bSum) > 1e-10 && Math.abs(aSum) > 1e-10) {
    const dcGain = bSum / aSum;
    gain = 1.0 / dcGain;
  }

  // 分子係数にゲインを適用
  for (let i = 0; i < b.length; i++) {
    b[i] *= gain;
  }

  // 差分方程式を実行
  // y[n] = (b[0]*x[n] + b[1]*x[n-1] + ...) - (a[1]*y[n-1] + a[2]*y[n-2] + ...)
  // ただし a[0] = 1 と正規化されている前提
  
  const x = new Array(numPoints).fill(0); // 入力信号（インパルス）
  x[0] = 1.0; // δ[n]
  
  const y = new Array(numPoints).fill(0); // 出力信号

  for (let n = 0; n < numPoints; n++) {
    time.push(n);
    
    // 分子部分（FIR）
    let sum = 0;
    for (let k = 0; k < b.length; k++) {
      if (n - k >= 0) {
        sum += b[k] * x[n - k];
      }
    }
    
    // 分母部分（IIR、a[0] = 1 なので k=1 から開始）
    for (let k = 1; k < a.length; k++) {
      if (n - k >= 0) {
        sum -= a[k] * y[n - k];
      }
    }
    
    y[n] = sum;
    amplitude.push(sum);
  }

  return { time, amplitude };
}

/**
 * ステップ応答を計算
 * s[n] = Σ h[k] for k = 0 to n
 */
export function calculateStepResponse(
  zeros: PoleZero[],
  poles: PoleZero[],
  numPoints: number = 128
): { time: number[]; amplitude: number[] } {
  const impulse = calculateImpulseResponse(zeros, poles, numPoints);
  const time: number[] = [];
  const amplitude: number[] = [];

  let cumSum = 0;
  for (let i = 0; i < impulse.time.length; i++) {
    time.push(impulse.time[i]);
    cumSum += impulse.amplitude[i];
    amplitude.push(cumSum);
  }

  return { time, amplitude };
}

