import type { PoleZero, FrequencyResponse, PoleOrZero } from '../types';
import { isPoleZeroPair, toPoleZeros } from '../types';
import { FREQUENCY_RESPONSE, BODE_PLOT } from '../constants';
import { Complex } from './filterMath';

/**
 * 伝達関数 H(z) を計算
 * H(z) = K * ∏(z - zi) / ∏(z - pi)
 * 実数係数フィルタのためゲイン K は実数
 */
function evaluateTransferFunction(
  z: Complex,
  zeros: PoleZero[],
  poles: PoleZero[],
  gain: number = 1.0,
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
 * 特定の周波数での振幅（dB）を計算
 *
 * @param zeros 零点
 * @param poles 極
 * @param frequency 周波数（rad/s）
 * @param userGain ユーザー指定のゲイン
 * @returns 振幅（dB）
 */
export function calculateMagnitudeAtFrequency(
  zeros: PoleOrZero[],
  poles: PoleOrZero[],
  frequency: number,
  userGain: number = 1.0,
): number {
  const zerosExpanded = toPoleZeros(zeros);
  const polesExpanded = toPoleZeros(poles);

  // z = e^(jω)
  const z = Complex.fromPolar(1, frequency);

  // H(e^(jω)) を計算
  const h = evaluateTransferFunction(z, zerosExpanded, polesExpanded, userGain);

  // 振幅 (dB)
  const magnitude = h.magnitude();
  return magnitude > 1e-10 ? 20 * Math.log10(magnitude) : -200;
}

/**
 * 周波数応答を計算
 * z = e^(jω) として H(e^(jω)) を評価
 */
export function calculateFrequencyResponse(
  zeros: PoleOrZero[],
  poles: PoleOrZero[],
  numPoints: number = FREQUENCY_RESPONSE.NUM_POINTS,
  userGain: number = 1.0,
): FrequencyResponse {
  // PoleOrZero[] を展開して計算用のPoleZero[]に変換
  const zerosExpanded = toPoleZeros(zeros);
  const polesExpanded = toPoleZeros(poles);
  const frequencies: number[] = [];
  const magnitudes: number[] = [];
  const phases: number[] = [];

  const gain = userGain;

  // 周波数範囲: 0 から π (正規化周波数)
  for (let i = 0; i < numPoints; i++) {
    const omega = (Math.PI * i) / (numPoints - 1);
    frequencies.push(omega);

    // z = e^(jω)
    const z = Complex.fromPolar(1, omega);

    // H(e^(jω)) を計算
    const h = evaluateTransferFunction(z, zerosExpanded, polesExpanded, gain);

    // 振幅 (dB)
    const magnitude = h.magnitude();
    const magnitudeDB = magnitude > 1e-10 ? 20 * Math.log10(magnitude) : -200;
    magnitudes.push(magnitudeDB);

    let phase = h.angle();
    if (magnitude < 1e-50) {
      // 振幅が小さすぎる場合は位相が正確に判定できないため、 0 にフォールバックする
      phase = 0.0;
    }
    const phaseDeg = (phase * 180) / Math.PI;
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
  zeros: PoleOrZero[],
  poles: PoleOrZero[],
  numPoints: number = FREQUENCY_RESPONSE.NUM_POINTS,
  octaves: number = BODE_PLOT.DEFAULT_OCTAVES,
  userGain: number = 1.0,
): FrequencyResponse {
  const zerosExpanded = toPoleZeros(zeros);
  const polesExpanded = toPoleZeros(poles);
  const frequencies: number[] = [];
  const magnitudes: number[] = [];
  const phases: number[] = [];

  const gain = userGain;

  // 対数周波数範囲: π / 2^octaves から π（ナイキスト周波数）
  const omegaMax = Math.PI;
  const omegaMin = Math.PI / Math.pow(2, octaves);
  const logOmegaMin = Math.log10(omegaMin);
  const logOmegaMax = Math.log10(omegaMax);

  for (let i = 0; i < numPoints; i++) {
    const logOmega =
      logOmegaMin + ((logOmegaMax - logOmegaMin) * i) / (numPoints - 1);
    const omega = Math.pow(10, logOmega);
    frequencies.push(omega);

    const z = Complex.fromPolar(1, omega);
    const h = evaluateTransferFunction(z, zerosExpanded, polesExpanded, gain);

    const magnitude = h.magnitude();
    const magnitudeDB = magnitude > 1e-10 ? 20 * Math.log10(magnitude) : -200;
    magnitudes.push(magnitudeDB);

    let phase = h.angle();
    if (magnitude < 1e-50) {
      // 振幅が小さすぎる場合は位相が正確に判定できないため、 0 にフォールバックする
      phase = 0.0;
    }
    const phaseDeg = (phase * 180) / Math.PI;
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
  zeros: PoleOrZero[],
  poles: PoleOrZero[],
  numPoints: number = FREQUENCY_RESPONSE.NUM_POINTS,
  logarithmic: boolean = true,
  octaves: number = BODE_PLOT.DEFAULT_OCTAVES,
  userGain: number = 1.0,
): { frequency: number[]; groupDelay: number[] } {
  const zerosExpanded = toPoleZeros(zeros);
  const polesExpanded = toPoleZeros(poles);
  const frequencies: number[] = [];
  const groupDelays: number[] = [];

  const gain = userGain;

  // 周波数範囲の設定
  let omegaMin: number;
  let omegaMax: number;
  if (logarithmic) {
    const maxFreq = Math.PI;
    const minFreq = Math.PI / Math.pow(2, octaves);
    omegaMin = Math.log10(minFreq);
    omegaMax = Math.log10(maxFreq);
  } else {
    omegaMin = 0;
    omegaMax = Math.PI;
  }

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
    const h = evaluateTransferFunction(z, zerosExpanded, polesExpanded, gain);
    const magnitude = h.magnitude();
    const phase = magnitude < 1e-50 ? 0.0 : h.angle();
    phases.push(phase);
  }

  // 位相アンラッピング: -π から π の境界でのジャンプを補正、
  //   および、振幅特性=0 または ∞ の点の前後での ±π のジャンプを補正
  const unwrappedPhases: number[] = [phases[0]];
  let cumulativeOffset = 0;

  for (let i = 1; i < numPoints; i++) {
    let phaseDiff = phases[i] - phases[i - 1];

    // 位相差が π/2 より大きい場合（±π または ±2π のジャンプ）
    while (phaseDiff > Math.PI / 2) {
      cumulativeOffset -= Math.PI;
      phaseDiff -= Math.PI;
    }
    // 位相差が -π/2 より小さい場合（±π または ±2π のジャンプ）
    while (phaseDiff < -Math.PI / 2) {
      cumulativeOffset += Math.PI;
      phaseDiff += Math.PI;
    }

    unwrappedPhases.push(phases[i] + cumulativeOffset);
  }

  // 群遅延 = -d(phase)/dω を数値微分で計算（アンラップされた位相を使用）
  for (let i = 0; i < numPoints; i++) {
    let groupDelay: number;

    if (i === 0 || i === 1) {
      // 前方差分
      groupDelay =
        -(unwrappedPhases[i + 1] - unwrappedPhases[i]) /
        (frequencies[i + 1] - frequencies[i]);
    } else if (i === numPoints - 1) {
      // 後方差分
      groupDelay =
        -(unwrappedPhases[i] - unwrappedPhases[i - 1]) /
        (frequencies[i] - frequencies[i - 1]);
    } else {
      // 中心差分
      groupDelay =
        -(unwrappedPhases[i + 1] - unwrappedPhases[i - 1]) /
        (frequencies[i + 1] - frequencies[i - 1]);
    }

    groupDelays.push(groupDelay);
  }

  if (!logarithmic) {
    // 直流での位相は安定しないため、最初の群遅延を2番目の群遅延に設定する。
    // （バンドパスフィルタ等で、ω→0 の極限で位相が ±90° になることがあるため）
    // 周波数軸は揃えたいので、最初の項目を unshift することはしない。
    groupDelays[0] = groupDelays[1];
  }

  // 群遅延を 1e-8 の倍数に揃える (微小誤差の解消のため)
  const roundedGroupDelays = groupDelays.map(
    (delay) => Math.round(delay / 1e-8) * 1e-8,
  );

  return {
    frequency: frequencies,
    groupDelay: roundedGroupDelays,
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

interface BiquadDecompositionResult {
  sections: BiquadSection[];
  delaySamples: number;
}

/**
 * 極・零点を双二次セクションに分割（新しいAPI）
 * 複素共役ペア → 2次セクション
 * 実数の極/零点 → 1次セクション（a2=0, b2=0）
 */
function createBiquadSectionsFromPoleOrZero(
  zeros: PoleOrZero[],
  poles: PoleOrZero[],
): BiquadDecompositionResult {
  const sections: BiquadSection[] = [];

  // 零点と極を同時に処理してセクションを作成
  const maxLength = Math.max(zeros.length, poles.length);

  for (let i = 0; i < maxLength; i++) {
    let b0 = 1,
      b1 = 0,
      b2 = 0;
    let a1 = 0,
      a2 = 0;

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

  // 極と零点の有効個数（複素共役ペアは2個分）の差 = グローバルな遅延サンプル数（正: 遅延、負: 非因果）
  const countPoleOrZeros = (items: PoleOrZero[]) =>
    items.reduce((sum, pz) => sum + (isPoleZeroPair(pz) ? 2 : 1), 0);
  const totalPoles = countPoleOrZeros(poles);
  const totalZeros = countPoleOrZeros(zeros);
  const delaySamples = totalPoles - totalZeros;
  return { sections, delaySamples };
}

/**
 * 双二次セクションを実行
 * y[n] = b0*x[n] + b1*x[n-1] + b2*x[n-2] - a1*y[n-1] - a2*y[n-2]
 */
function applyBiquadSection(input: number[], section: BiquadSection): number[] {
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
  zeros: PoleOrZero[],
  poles: PoleOrZero[],
  numPoints: number = 128,
  userGain: number = 1.0,
): { time: number[]; amplitude: number[] } {
  const time: number[] = [];

  // インパルス信号を生成
  let signal = new Array(numPoints).fill(0);
  signal[0] = 1.0; // δ[n]

  // 双二次セクションを作成し、カスケード接続で実行
  const { sections, delaySamples } = createBiquadSectionsFromPoleOrZero(
    zeros,
    poles,
  );
  for (const section of sections) {
    signal = applyBiquadSection(signal, section);
  }

  for (let i = 0; i < signal.length; i++) {
    signal[i] *= userGain;
  }

  // 時間軸と振幅を返す（負のインデックスは time で表現、amplitude/signal はそのまま）
  const amplitude: number[] = [];
  for (let n = 0; n < numPoints; n++) {
    time.push(delaySamples + n);
    amplitude.push(signal[n]);
  }

  return { time, amplitude };
}

/**
 * ステップ応答を計算
 * s[n] = Σ h[k] for k = 0 to n
 */
export function calculateStepResponse(
  zeros: PoleOrZero[],
  poles: PoleOrZero[],
  numPoints: number = 128,
  userGain: number = 1.0,
): { time: number[]; amplitude: number[] } {
  const impulse = calculateImpulseResponse(zeros, poles, numPoints, userGain);
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
