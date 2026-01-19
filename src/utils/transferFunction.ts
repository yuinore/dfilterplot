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
 * インパルス応答を計算
 * h[n] = Σ (residues_k * pole_k^n) for n >= 0
 */
export function calculateImpulseResponse(
  zeros: PoleZero[],
  poles: PoleZero[],
  numPoints: number = 128
): { time: number[]; amplitude: number[] } {
  const time: number[] = [];
  const amplitude: number[] = [];

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

  // 簡易実装: z変換の逆変換を周波数領域から時間領域へ変換
  // h[n] を IFFT で近似計算
  const N = 512;
  const freqResponse: Complex[] = [];
  
  for (let k = 0; k < N; k++) {
    const omega = (2 * Math.PI * k) / N;
    const z = Complex.fromPolar(1, omega);
    const h = evaluateTransferFunction(z, zeros, poles, gain);
    freqResponse.push(h);
  }

  // 簡易IFFT（DFT）
  for (let n = 0; n < numPoints; n++) {
    time.push(n);
    let sum = new Complex(0, 0);
    
    for (let k = 0; k < N; k++) {
      const angle = (2 * Math.PI * k * n) / N;
      const exponential = new Complex(Math.cos(angle), -Math.sin(angle));
      sum = sum.add(freqResponse[k].multiply(exponential));
    }
    
    amplitude.push(sum.real / N);
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

