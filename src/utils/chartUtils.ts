/**
 * Chart.jsのグラフ表示に関するユーティリティ関数
 */

/**
 * y軸の範囲を計算する
 * データの範囲とデフォルト範囲を比較し、両方を含む範囲を返す
 * 軸の範囲は10の累乗の倍数に丸められる
 * 
 * @param dataMin データの最小値
 * @param dataMax データの最大値
 * @param defaultMin デフォルトの最小値
 * @param defaultMax デフォルトの最大値
 * @returns y軸の最小値と最大値
 */
export function calculateAxisRange(
  dataMin: number,
  dataMax: number,
  defaultMin: number,
  defaultMax: number
): { min: number; max: number } {
  // データの最大値より1桁小さい 10 の累乗数を計算（刻み幅）
  const dataMaxAbs = Math.max(0.001, Math.abs(dataMax));
  const maxStep = Math.pow(10, Math.floor(Math.log10(dataMaxAbs) - 1));

  // データの最小値より1桁小さい 10 の累乗数を計算（刻み幅）
  const dataMinAbs = Math.max(0.001, Math.abs(dataMin));
  const minStep = Math.pow(10, Math.floor(Math.log10(dataMinAbs) - 1));

  // max が dataMax より大きく、かつ maxStep の倍数となるようにする
  // さらに defaultMax 以上であることを保証
  const max = Math.max(defaultMax, Math.ceil(dataMax / maxStep + 1) * maxStep);

  // min が dataMin より小さく、かつ minStep の倍数となるようにする
  // さらに defaultMin 以下であることを保証
  const min = Math.min(defaultMin, Math.floor(dataMin / minStep - 1) * minStep);
  
  return { min, max };
}

/**
 * 配列の最小値を取得する
 * 
 * @param data 数値配列
 * @returns 最小値
 */
export function getArrayMin(data: number[]): number {
  if (data.length === 0) return 0;
  return Math.min(...data);
}

/**
 * 配列の最大値を取得する
 * 
 * @param data 数値配列
 * @returns 最大値
 */
export function getArrayMax(data: number[]): number {
  if (data.length === 0) return 0;
  return Math.max(...data);
}

/**
 * インパルス応答・ステップ応答のy軸範囲を計算する
 * 
 * @param amplitude 振幅データの配列
 * @param defaultMin デフォルトの最小値（デフォルト: -0.5）
 * @param defaultMax デフォルトの最大値（デフォルト: 1.5）
 * @returns y軸の最小値と最大値
 */
export function calculateTimeResponseAxisRange(
  amplitude: number[],
  defaultMin: number = -0.5,
  defaultMax: number = 1.5
): { min: number; max: number } {
  const dataMin = getArrayMin(amplitude);
  const dataMax = getArrayMax(amplitude);
  
  return calculateAxisRange(dataMin, dataMax, defaultMin, defaultMax);
}

