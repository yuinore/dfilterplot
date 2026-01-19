import type { PoleZero } from '../types';

/**
 * 双二次フィルタの極・零点を計算
 */

let nextId = 1000; // フィルタ設計用のIDは1000から開始

function getNextId(): string {
  return (nextId++).toString();
}

/**
 * Low Pass フィルタの極・零点を生成
 * 零点: z = -1（2つ）
 * 極: 単位円内の複素共役ペア
 */
export function generateLowPassBiquad(cutoffFreq: number): {
  poles: PoleZero[];
  zeros: PoleZero[];
} {
  // Q = 0.707 (Butterworth)
  const Q = 0.707;
  const r = 0.9; // 極の半径（単位円内）
  
  // 極の角度
  const angle = cutoffFreq;
  
  const poleId1 = getNextId();
  const poleId2 = getNextId();
  
  const poles: PoleZero[] = [
    {
      id: poleId1,
      real: r * Math.cos(angle),
      imag: r * Math.sin(angle),
      isPole: true,
      pairId: poleId2,
    },
    {
      id: poleId2,
      real: r * Math.cos(angle),
      imag: -r * Math.sin(angle),
      isPole: true,
      pairId: poleId1,
      isConjugate: true,
    },
  ];

  const zeroId1 = getNextId();
  const zeroId2 = getNextId();
  
  const zeros: PoleZero[] = [
    {
      id: zeroId1,
      real: -1,
      imag: 0,
      isPole: false,
    },
    {
      id: zeroId2,
      real: -1,
      imag: 0,
      isPole: false,
    },
  ];

  return { poles, zeros };
}

/**
 * High Pass フィルタの極・零点を生成
 * 零点: z = 1（2つ）
 * 極: 単位円内の複素共役ペア
 */
export function generateHighPassBiquad(cutoffFreq: number): {
  poles: PoleZero[];
  zeros: PoleZero[];
} {
  const r = 0.9;
  const angle = cutoffFreq;
  
  const poleId1 = getNextId();
  const poleId2 = getNextId();
  
  const poles: PoleZero[] = [
    {
      id: poleId1,
      real: r * Math.cos(angle),
      imag: r * Math.sin(angle),
      isPole: true,
      pairId: poleId2,
    },
    {
      id: poleId2,
      real: r * Math.cos(angle),
      imag: -r * Math.sin(angle),
      isPole: true,
      pairId: poleId1,
      isConjugate: true,
    },
  ];

  const zeroId1 = getNextId();
  const zeroId2 = getNextId();
  
  const zeros: PoleZero[] = [
    {
      id: zeroId1,
      real: 1,
      imag: 0,
      isPole: false,
    },
    {
      id: zeroId2,
      real: 1,
      imag: 0,
      isPole: false,
    },
  ];

  return { poles, zeros };
}

/**
 * Band Pass フィルタの極・零点を生成
 * 零点: z = 1 と z = -1
 * 極: 単位円内の複素共役ペア
 */
export function generateBandPassBiquad(centerFreq: number): {
  poles: PoleZero[];
  zeros: PoleZero[];
} {
  const r = 0.95;
  const angle = centerFreq;
  
  const poleId1 = getNextId();
  const poleId2 = getNextId();
  
  const poles: PoleZero[] = [
    {
      id: poleId1,
      real: r * Math.cos(angle),
      imag: r * Math.sin(angle),
      isPole: true,
      pairId: poleId2,
    },
    {
      id: poleId2,
      real: r * Math.cos(angle),
      imag: -r * Math.sin(angle),
      isPole: true,
      pairId: poleId1,
      isConjugate: true,
    },
  ];

  const zeroId1 = getNextId();
  const zeroId2 = getNextId();
  
  const zeros: PoleZero[] = [
    {
      id: zeroId1,
      real: 1,
      imag: 0,
      isPole: false,
    },
    {
      id: zeroId2,
      real: -1,
      imag: 0,
      isPole: false,
    },
  ];

  return { poles, zeros };
}

/**
 * Band Stop (Notch) フィルタの極・零点を生成
 * 零点: 単位円上の複素共役ペア
 * 極: 単位円内の複素共役ペア
 */
export function generateBandStopBiquad(notchFreq: number): {
  poles: PoleZero[];
  zeros: PoleZero[];
} {
  const r = 0.95;
  const angle = notchFreq;
  
  const poleId1 = getNextId();
  const poleId2 = getNextId();
  
  const poles: PoleZero[] = [
    {
      id: poleId1,
      real: r * Math.cos(angle),
      imag: r * Math.sin(angle),
      isPole: true,
      pairId: poleId2,
    },
    {
      id: poleId2,
      real: r * Math.cos(angle),
      imag: -r * Math.sin(angle),
      isPole: true,
      pairId: poleId1,
      isConjugate: true,
    },
  ];

  const zeroId1 = getNextId();
  const zeroId2 = getNextId();
  
  const zeros: PoleZero[] = [
    {
      id: zeroId1,
      real: Math.cos(angle),
      imag: Math.sin(angle),
      isPole: false,
      pairId: zeroId2,
    },
    {
      id: zeroId2,
      real: Math.cos(angle),
      imag: -Math.sin(angle),
      isPole: false,
      pairId: zeroId1,
      isConjugate: true,
    },
  ];

  return { poles, zeros };
}

