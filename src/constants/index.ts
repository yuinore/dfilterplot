/**
 * フィルタ可視化の定数定義
 */

/**
 * 周波数応答の計算に関する定数
 */
export const FREQUENCY_RESPONSE = {
  /** 周波数応答の計算ポイント数 */
  NUM_POINTS: 512,
} as const;

/**
 * ボード線図の表示に関する定数
 */
export const BODE_PLOT = {
  /** 振幅特性の最小値 (dB) */
  MAGNITUDE_MIN_DB: -100,
  /** 振幅特性の最大値 (dB) */
  MAGNITUDE_MAX_DB: 40,
} as const;

/**
 * 時間応答の計算に関する定数
 */
export const TIME_RESPONSE = {
  /** インパルス応答とステップ応答の表示長（サンプル数） */
  NUM_SAMPLES: 64,
} as const;

