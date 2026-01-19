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
 * 極・零点を双二次セクションに分割
 * 複素共役ペア → 2次セクション
 * 実数の極/零点 → 1次セクション（a2=0, b2=0）
 */
function createBiquadSections(zeros: PoleZero[], poles: PoleZero[]): BiquadSection[] {
  const sections: BiquadSection[] = [];
  
  // 処理済みフラグ
  const processedZeros = new Array(zeros.length).fill(false);
  const processedPoles = new Array(poles.length).fill(false);

  // 零点と極をペアリングしてセクションを作成
  let zeroIdx = 0;
  let poleIdx = 0;

  while (zeroIdx < zeros.length || poleIdx < poles.length) {
    // 処理済みの零点をスキップ
    while (zeroIdx < zeros.length && processedZeros[zeroIdx]) {
      zeroIdx++;
    }

    // 処理済みの極をスキップ
    while (poleIdx < poles.length && processedPoles[poleIdx]) {
      poleIdx++;
    }

    // すべて処理済みならループを抜ける
    if (zeroIdx >= zeros.length && poleIdx >= poles.length) {
      break;
    }

    let b0 = 1, b1 = 0, b2 = 0;
    let a1 = 0, a2 = 0;

    // 零点の処理
    if (zeroIdx < zeros.length) {
      const zero = zeros[zeroIdx];
      
      if (Math.abs(zero.imag) > 1e-10 && zero.pairId) {
        // 複素共役ペア
        const r = zero.real;
        const i = Math.abs(zero.imag);
        b0 = 1.0;
        b1 = -2 * r;
        b2 = r * r + i * i;
        
        // ペアの相手もマーク
        const pairIdx = zeros.findIndex((z) => z.id === zero.pairId);
        if (pairIdx !== -1) {
          processedZeros[pairIdx] = true;
        }
      } else {
        // 実数の零点
        b0 = 1.0;
        b1 = -zero.real;
        b2 = 0.0;
      }
      
      processedZeros[zeroIdx] = true;
      zeroIdx++;
    }

    // 極の処理
    if (poleIdx < poles.length) {
      const pole = poles[poleIdx];
      
      if (Math.abs(pole.imag) > 1e-10 && pole.pairId) {
        // 複素共役ペア
        const r = pole.real;
        const i = Math.abs(pole.imag);
        a1 = -2 * r;
        a2 = r * r + i * i;
        
        // ペアの相手もマーク
        const pairIdx = poles.findIndex((p) => p.id === pole.pairId);
        if (pairIdx !== -1) {
          processedPoles[pairIdx] = true;
        }
      } else {
        // 実数の極
        a1 = -pole.real;
        a2 = 0.0;
      }
      
      processedPoles[poleIdx] = true;
      poleIdx++;
    }

    sections.push({ b0, b1, b2, a1, a2 });
  }

  return sections;
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

  // 双二次セクションを作成
  const sections = createBiquadSections(zeros, poles);

  // デバッグ出力
  console.log('=== Impulse Response Debug (Biquad Cascade) ===');
  console.log('Zeros:', zeros);
  console.log('Poles:', poles);
  console.log('Biquad sections:', sections);

  // 各セクションをカスケード接続で実行
  for (let i = 0; i < sections.length; i++) {
    signal = applyBiquadSection(signal, sections[i]);
    console.log(`After section ${i}:`, signal.slice(0, 10));
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

  // デバッグ出力
  console.log('Impulse response (first 10):', signal.slice(0, 10));
  if (numPoints > 20) {
    console.log('Impulse response (last 10):', signal.slice(-10));
  }
  console.log('Max amplitude (before normalization):', maxAbs);
  console.log('Max amplitude (after normalization):', Math.max(...signal.map(Math.abs)));
  console.log('==============================\n');

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

