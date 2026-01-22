/**
 * スナップの閾値
 */
export const SNAP_THRESHOLD = 0.1;

/**
 * 座標スナップのユーティリティ関数
 */

/**
 * 値が0に近い場合、0にスナップ
 */
function snapToZero(value: number, threshold: number): number {
  if (Math.abs(value) <= threshold) {
    return 0;
  }
  return value;
}

/**
 * 実軸上の特別な点（0, ±1）にスナップ
 */
function snapRealAxisPoint(real: number, threshold: number): number {
  // 0にスナップ
  if (Math.abs(real) <= threshold) {
    return 0;
  }
  // 1にスナップ
  if (Math.abs(real - 1) <= threshold) {
    return 1;
  }
  // -1にスナップ
  if (Math.abs(real + 1) <= threshold) {
    return -1;
  }
  return real;
}

/**
 * 単位円上の点を計算
 */
function projectToUnitCircle(
  real: number,
  imag: number,
): { real: number; imag: number } {
  const magnitude = Math.sqrt(real * real + imag * imag);
  if (magnitude === 0) {
    return { real: 1, imag: 0 };
  }
  return {
    real: real / magnitude,
    imag: imag / magnitude,
  };
}

/**
 * 1の4乗根（±1, ±j）へのスナップ
 * 単位円上の特別な点：(1,0), (0,1), (-1,0), (0,-1)
 */
function snapToFourthRootsOfUnity(
  real: number,
  imag: number,
  threshold: number,
): { real: number; imag: number } | null {
  const fourthRoots = [
    { real: 1, imag: 0 }, // 1
    { real: 0, imag: 1 }, // j
    { real: -1, imag: 0 }, // -1
    { real: 0, imag: -1 }, // -j
  ];

  for (const root of fourthRoots) {
    const distance = Math.sqrt(
      Math.pow(real - root.real, 2) + Math.pow(imag - root.imag, 2),
    );
    if (distance <= threshold) {
      return root;
    }
  }

  return null;
}

/**
 * スナップ機能を適用
 *
 * アルゴリズム：
 *
 * 【実軸上の点（isRealAxisOnly = true）の場合】
 * - 原点 (0,0)、または単位円とx軸の交点 (±1,0) にスナップ
 *
 * 【複素共役ペアの点（isRealAxisOnly = false）の場合】
 * 1. 単位円上にスナップ（単位円からの距離が閾値以内）
 *    1-A. さらに1の4乗根（±1, ±j）に近い場合はその点にスナップ
 * 2. 軸へのスナップ
 *    2-A. x軸にスナップ（y座標が0に近い場合）
 *    2-B. y軸にスナップ（x座標が0に近い場合）
 *
 * これにより以下の点にスナップ可能：
 * - 単位円上の任意の点
 * - 1の4乗根：(1,0), (0,1), (-1,0), (0,-1)
 * - 原点：(0,0)
 * - x軸上の任意の点：(x,0)
 * - y軸上の任意の点：(0,y)
 */
export function applySnap(
  real: number,
  imag: number,
  enableSnap: boolean,
  isRealAxisOnly: boolean = false,
): { real: number; imag: number } {
  if (!enableSnap) {
    return { real, imag };
  }

  // 実軸上の点の場合は虚部を0に固定し、実部は特別な点（0, ±1）にスナップ
  if (isRealAxisOnly) {
    return {
      real: snapRealAxisPoint(real, SNAP_THRESHOLD),
      imag: 0,
    };
  }

  // 1. 単位円上へのスナップをチェック
  const magnitude = Math.sqrt(real * real + imag * imag);
  const distanceFromUnitCircle = Math.abs(magnitude - 1.0);

  if (distanceFromUnitCircle <= SNAP_THRESHOLD) {
    // 単位円上にスナップ
    const projected = projectToUnitCircle(real, imag);

    // 1-A. さらに1の4乗根のいずれかに近い場合は、その点にスナップ
    const rootSnap = snapToFourthRootsOfUnity(
      projected.real,
      projected.imag,
      SNAP_THRESHOLD,
    );
    if (rootSnap) {
      return rootSnap;
    }

    return projected;
  }

  // 2. 軸へのスナップ
  // 2-A. x軸にスナップ（y座標が0に近い場合）
  const snappedImag = snapToZero(imag, SNAP_THRESHOLD);

  // 2-B. y軸にスナップ（x座標が0に近い場合）
  const snappedReal = snapToZero(real, SNAP_THRESHOLD);

  return {
    real: snappedReal,
    imag: snappedImag,
  };
}
