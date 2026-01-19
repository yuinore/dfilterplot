/**
 * フィルタ可視化の定数定義
 */

/**
 * 周波数応答の計算に関する定数
 */
export const FREQUENCY_RESPONSE = {
  /** 周波数応答の計算ポイント数 */
  NUM_POINTS: 2048,
} as const;

/**
 * ボード線図の表示に関する定数
 */
export const BODE_PLOT = {
  /** 振幅特性の最小値 (dB) */
  MAGNITUDE_MIN_DB: -40,
  /** 振幅特性の最大値 (dB) */
  MAGNITUDE_MAX_DB: 40,
  /** オクターブ数の選択肢 */
  OCTAVE_OPTIONS: [2, 4, 6, 8, 10] as const,
  /** デフォルトのオクターブ数（音声信号処理で一般的な範囲） */
  DEFAULT_OCTAVES: 10,
} as const;

/**
 * 時間応答の計算に関する定数
 */
export const TIME_RESPONSE = {
  /** インパルス応答とステップ応答の表示長（サンプル数） */
  NUM_SAMPLES: 64,
} as const;

