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

