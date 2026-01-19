/**
 * 極または零点を表す複素数
 */
export interface PoleZero {
  id: string;
  real: number;
  imag: number;
  isPole: boolean; // true: 極, false: 零点
  isConjugate?: boolean; // 複素共役ペアの場合 true
  pairId?: string; // 複素共役ペアの相方の ID
}

/**
 * 伝達関数の周波数応答
 */
export interface FrequencyResponse {
  frequency: number[]; // 周波数 (rad/s)
  magnitude: number[]; // 振幅 (dB)
  phase: number[]; // 位相 (度)
}

