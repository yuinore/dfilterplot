/**
 * レガシー型定義（後方互換性のため）
 * 複素共役ペアは2つのオブジェクトで表現
 */
export interface PoleZero {
  id: string;
  real: number;
  imag: number;
  isPole: boolean;
  isConjugate?: boolean;
  pairId?: string;
}

/**
 * 実数の極/零点
 */
export interface PoleZeroReal {
  id: string;
  real: number;
  isPole: boolean;
}

/**
 * 複素共役ペア
 * imagは常に正の値（共役ペアは暗黙的に表現）
 */
export interface PoleZeroPair {
  id: string;
  real: number;
  imag: number;
  isPole: boolean;
}

/**
 * 極または零点（ユニオン型）
 */
export type PoleOrZero = PoleZeroReal | PoleZeroPair;

/**
 * 型ガード：実数の極/零点かどうかを判定
 */
export function isPoleZeroReal(pz: PoleOrZero): pz is PoleZeroReal {
  return !('imag' in pz);
}

/**
 * 型ガード：複素共役ペアかどうかを判定
 */
export function isPoleZeroPair(pz: PoleOrZero): pz is PoleZeroPair {
  return 'imag' in pz;
}

/**
 * 新型 → 旧型への変換（後方互換性のため）
 * PoleOrZero[] → PoleZero[]
 */
export function toPoleZeros(items: PoleOrZero[]): PoleZero[] {
  const result: PoleZero[] = [];
  
  for (const item of items) {
    if (isPoleZeroReal(item)) {
      // 実数の場合
      const realItem = item as PoleZeroReal;
      result.push({
        id: realItem.id,
        real: realItem.real,
        imag: 0,
        isPole: realItem.isPole,
      });
    } else if (isPoleZeroPair(item)) {
      // 複素共役ペアの場合
      const pairItem = item as PoleZeroPair;
      const id1 = pairItem.id;
      const id2 = `${pairItem.id}_conj`;
      
      result.push({
        id: id1,
        real: pairItem.real,
        imag: pairItem.imag,
        isPole: pairItem.isPole,
        isConjugate: true,
        pairId: id2,
      });
      
      result.push({
        id: id2,
        real: pairItem.real,
        imag: -pairItem.imag,
        isPole: pairItem.isPole,
        isConjugate: true,
        pairId: id1,
      });
    }
  }
  
  return result;
}

export interface FrequencyResponse {
  frequency: number[];
  magnitude: number[];
  phase: number[];
}
