import type { PoleZero, FrequencyResponse, PoleOrZero } from '../types';
import { isPoleZeroPair } from '../types';

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
 * 双二次セクション（Biquad Section）の定義
 * H(z) = (b0 + b1*z^-1 + b2*z^-2) / (1 + a1*z^-1 + a2*z^-2)
 */
interface BiquadSection {
  b0: number;
  b1: number;
  b2: number;
  a1: number;
  a2: number;
}

/**
 * 極・零点を双二次セクションに分割（新しいAPI）
 * 複素共役ペア → 2次セクション
 * 実数の極/零点 → 1次セクション（a2=0, b2=0）
 */
function createBiquadSectionsFromPoleOrZero(
  zeros: PoleOrZero[],
  poles: PoleOrZero[]
): BiquadSection[] {
  const sections: BiquadSection[] = [];
  
  // 零点と極を同時に処理してセクションを作成
  const maxLength = Math.max(zeros.length, poles.length);
  
  for (let i = 0; i < maxLength; i++) {
    let b0 = 1, b1 = 0, b2 = 0;
    let a1 = 0, a2 = 0;
    
    // 零点の処理
    if (i < zeros.length) {
      const zero = zeros[i];
      
      if (isPoleZeroPair(zero)) {
        // 複素共役ペア: (z - (r+ji))(z - (r-ji)) = z^2 - 2r*z + (r^2+i^2)
        b0 = 1.0;
        b1 = -2 * zero.real;
        b2 = zero.real * zero.real + zero.imag * zero.imag;
      } else {
        // 実数: (z - r) = z - r
        b0 = 1.0;
        b1 = -zero.real;
        b2 = 0.0;
      }
    }
    
    // 極の処理
    if (i < poles.length) {
      const pole = poles[i];
      
      if (isPoleZeroPair(pole)) {
        // 複素共役ペア: 分母 = z^2 - 2r*z + (r^2+i^2)
        a1 = -2 * pole.real;
        a2 = pole.real * pole.real + pole.imag * pole.imag;
      } else {
        // 実数: 分母 = z - r
        a1 = -pole.real;
        a2 = 0.0;
      }
    }
    
    sections.push({ b0, b1, b2, a1, a2 });
  }
  
  return sections;
}

/**
 * PoleZero[] を PoleOrZero[] に変換するヘルパー関数
 */
function convertLegacyPoleZeros(items: PoleZero[]): PoleOrZero[] {
  const converted: PoleOrZero[] = [];
  const processed = new Set<string>();
  
  for (const item of items) {
    if (processed.has(item.id)) continue;
    
    if (Math.abs(item.imag) > 1e-10 && item.pairId) {
      // 複素共役ペア（正の虚部のみ保持）
      if (item.imag > 0) {
        converted.push({
          id: item.id,
          real: item.real,
          imag: item.imag,
          isPole: item.isPole,
        });
        processed.add(item.id);
        if (item.pairId) processed.add(item.pairId);
      }
    } else {
      // 実数
      converted.push({
        id: item.id,
        real: item.real,
        isPole: item.isPole,
      });
      processed.add(item.id);
    }
  }
  
  return converted;
}

/**
 * 極・零点を双二次セクションに分割（レガシーAPI）
 * PoleZero[] → PoleOrZero[] に変換してから処理
 */
function createBiquadSections(zeros: PoleZero[], poles: PoleZero[]): BiquadSection[] {
  return createBiquadSectionsFromPoleOrZero(
    convertLegacyPoleZeros(zeros),
    convertLegacyPoleZeros(poles)
  );
}

/**
 * 双二次セクションを実行
 * y[n] = b0*x[n] + b1*x[n-1] + b2*x[n-2] - a1*y[n-1] - a2*y[n-2]
 */
function applyBiquadSection(
  input: number[],
  section: BiquadSection
): number[] {
  const output = new Array(input.length).fill(0);
  
  for (let n = 0; n < input.length; n++) {
    let sum = section.b0 * input[n];
    
    if (n >= 1) {
      sum += section.b1 * input[n - 1];
      sum -= section.a1 * output[n - 1];
    }
    
    if (n >= 2) {
      sum += section.b2 * input[n - 2];
      sum -= section.a2 * output[n - 2];
    }
    
    output[n] = sum;
  }
  
  return output;
}

/**
 * インパルス応答を計算（双二次セクションのカスケード接続）
 * 極・零点をbiquadセクションに分割し、直列に接続して実行
 */
export function calculateImpulseResponse(
  zeros: PoleZero[],
  poles: PoleZero[],
  numPoints: number = 128
): { time: number[]; amplitude: number[] } {
  const time: number[] = [];
  
  // インパルス信号を生成
  let signal = new Array(numPoints).fill(0);
  signal[0] = 1.0; // δ[n]

  // 双二次セクションを作成し、カスケード接続で実行
  const sections = createBiquadSections(zeros, poles);
  for (const section of sections) {
    signal = applyBiquadSection(signal, section);
  }

  // 最大絶対値で正規化
  const maxAbs = Math.max(...signal.map(Math.abs));
  if (maxAbs > 1e-10) {
    for (let i = 0; i < signal.length; i++) {
      signal[i] /= maxAbs;
    }
  }

  // 時間軸と振幅を返す
  const amplitude: number[] = [];
  for (let n = 0; n < numPoints; n++) {
    time.push(n);
    amplitude.push(signal[n]);
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

  // 最大絶対値で正規化
  const maxAbs = Math.max(...amplitude.map(Math.abs));
  if (maxAbs > 1e-10) {
    for (let i = 0; i < amplitude.length; i++) {
      amplitude[i] /= maxAbs;
    }
  }

  return { time, amplitude };
}

