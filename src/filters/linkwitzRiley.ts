import type { FilterDesignBase, FilterGenerationResult } from './base';
import type { PoleOrZero, PoleZeroReal, PoleZeroPair } from '../types';
import { LinkwitzRileyFilterPanel } from '../components/filters/LinkwitzRileyFilterPanel';
import { ButterworthFilterDesign } from './butterworth';
import { Complex, bilinearTransform } from '../utils/filterMath';

/**
 * Linkwitz-Riley フィルタ設計
 */
export class LinkwitzRileyFilterDesign implements FilterDesignBase {
  id = 'linkwitzRiley';
  nameKey = 'filters.linkwitzRiley.name';
  descriptionKey = 'filters.linkwitzRiley.description';
  PanelComponent = LinkwitzRileyFilterPanel;

  generate(params: Record<string, any>): FilterGenerationResult {
    const { order, crossoverFrequency, gainLow, gainHigh } = params;

    if (order % 2 !== 0 || order < 2) {
      throw new Error('order must be a positive even number');
    }

    const halfOrder = order / 2;

    if (Math.abs(crossoverFrequency - Math.PI) < 1e-10) {
      // 大きさが gainLow のインパルスだが、
      // わかりやすさのために、約分せずオマケで -1 に極と零点を halfOrder * 2 個配置しておく
      return {
        poles: Array.from(
          { length: halfOrder * 2 },
          (_, i) =>
            ({
              type: 'real',
              id: `linkwitzRiley_pole_${i}`,
              real: -1,
              isPole: true,
            }) as PoleZeroReal,
        ),
        zeros: Array.from(
          { length: halfOrder * 2 },
          (_, i) =>
            ({
              type: 'real',
              id: `linkwitzRiley_zero_${i}`,
              real: -1,
              isPole: false,
            }) as PoleZeroReal,
        ),
        gain: gainLow,
      };
    }

    // バターワースフィルタの極を取得
    const butterworthGenerationLowPassResult =
      new ButterworthFilterDesign().generate({
        type: 'lowpass',
        order: halfOrder,
        cutoffFrequency: crossoverFrequency,
      });

    // バターワースフィルタを 2 個直列接続する（参照の共有を避けるためコピーしてから ID を付与）
    const bwPoles = butterworthGenerationLowPassResult.poles;
    const poles: PoleOrZero[] = [
      ...bwPoles.map((p, i) =>
        'imag' in p
          ? ({ ...p, id: `linkwitzRiley_${i}_p` } as PoleZeroPair)
          : ({ ...p, id: `linkwitzRiley_${i}_p` } as PoleZeroReal),
      ),
      ...bwPoles.map((p, i) =>
        'imag' in p
          ? ({
              ...p,
              id: `linkwitzRiley_${bwPoles.length + i}_p`,
            } as PoleZeroPair)
          : ({
              ...p,
              id: `linkwitzRiley_${bwPoles.length + i}_p`,
            } as PoleZeroReal),
      ),
    ];

    // 零点を追加
    let zeros: PoleOrZero[] = [];

    if (gainHigh >= 1e-10) {
      zeros = this.calculateLinkwitzRileyZerosAsPoleOrZero(
        halfOrder,
        crossoverFrequency,
        gainLow,
        gainHigh,
        'linkwitzRiley_zero',
      );
    } else {
      for (let i = 0; i < halfOrder * 2; i++) {
        zeros.push({
          type: 'real',
          id: `linkwitzRiley_zero_${i}`,
          real: -1.0,
          isPole: false,
        } as PoleZeroReal);
      }
    }

    // 指定周波数で振幅 1 になるゲインを求め、gainLow / gainHigh でスケールする
    let gain: number;
    if (Math.max(gainLow, gainHigh) < 1e-10) {
      gain = 0.0;
    } else if (gainLow >= gainHigh) {
      // DC (ω=0) で振幅 1 に正規化し、gainLow 倍
      gain = this.calculateGainAtFrequency(zeros, poles, 0.0) * gainLow;
    } else {
      // ナイキスト (ω=π) で振幅 1、位相 0° or 180° に正規化し、gainHigh 倍
      const desiredNyquistPhase = halfOrder % 2 === 0 ? 1 : -1;
      gain =
        desiredNyquistPhase *
        this.calculateGainAtFrequency(zeros, poles, Math.PI) *
        gainHigh;
    }

    return { poles, zeros, gain };
  }

  /**
   * 指定角周波数 ω における伝達関数の複素ゲインを計算
   * H(e^{jω}) = ∏(z - zero) / ∏(z - pole) の値を返す（z = e^{jω}）
   * 負の実部（位相 180°）にも対応するため Complex で返す
   */
  private calculateComplexGainAtFrequency(
    zeros: PoleOrZero[],
    poles: PoleOrZero[],
    omega: number,
  ): Complex {
    const z = new Complex(Math.cos(omega), Math.sin(omega));

    let numerator = new Complex(1, 0);
    for (const zero of zeros) {
      if ('imag' in zero) {
        const zeroPlus = new Complex(zero.real, zero.imag);
        const zeroMinus = new Complex(zero.real, -zero.imag);
        numerator = numerator.multiply(
          z.subtract(zeroPlus).multiply(z.subtract(zeroMinus)),
        );
      } else {
        const zeroReal = new Complex(zero.real, 0);
        numerator = numerator.multiply(z.subtract(zeroReal));
      }
    }

    let denominator = new Complex(1, 0);
    for (const pole of poles) {
      if ('imag' in pole) {
        const polePlus = new Complex(pole.real, pole.imag);
        const poleMinus = new Complex(pole.real, -pole.imag);
        denominator = denominator.multiply(
          z.subtract(polePlus).multiply(z.subtract(poleMinus)),
        );
      } else {
        const poleReal = new Complex(pole.real, 0);
        denominator = denominator.multiply(z.subtract(poleReal));
      }
    }

    return denominator.divide(numerator);
  }

  /**
   * 指定角周波数 ω での伝達関数の実部ゲインを計算（振幅特性のノーマライズ用）
   * 位相 180°（負の実部）の場合は負のゲインを返す
   */
  private calculateGainAtFrequency(
    zeros: PoleOrZero[],
    poles: PoleOrZero[],
    omega: number,
  ): number {
    const complexGain = this.calculateComplexGainAtFrequency(
      zeros,
      poles,
      omega,
    );
    return complexGain.real;
  }

  /**
   * Linkwitz-Riley フィルタの零点を計算（PoleOrZero形式で直接生成）
   *
   * @param halfOrder バターワースフィルタ 1 個あたりのフィルタ次数
   * @param crossoverFrequency クロスオーバー周波数
   * @param gainLow 低域ゲイン
   * @param gainHigh 高域ゲイン
   * @param idPrefix 零点のIDプレフィックス
   * @returns デジタル零点の配列（PoleOrZero形式）
   */
  private calculateLinkwitzRileyZerosAsPoleOrZero(
    halfOrder: number,
    crossoverFrequency: number,
    gainLow: number,
    gainHigh: number,
    idPrefix: string,
  ): PoleOrZero[] {
    const zeros: PoleOrZero[] = [];

    if (halfOrder != Math.round(halfOrder)) {
      throw new Error('halfOrder must be an integer');
    }

    // 周波数ワーピング
    const T = 1; // サンプリング周期（正規化）
    const warpedCrossoverFrequency =
      (2 / T) * Math.tan((crossoverFrequency * T) / 2);
    // G = Πp_k/ω_c^(4n) = Π|p_k|/ω_c^(4n) = ω_c^(2n)/ω_c^(4n) = 1/ω_c^(2n)
    const analogGainLowBand =
      1.0 * Math.pow(warpedCrossoverFrequency, 2 * halfOrder);
    const analogGainHighBand = 1.0;

    // 零点の magnitude を計算 ( (2n√)(β/α))
    const alpha = gainLow * analogGainLowBand;
    const beta = gainHigh * analogGainHighBand;
    const magnitude = Math.pow(Math.abs(alpha / beta), 1 / (2 * halfOrder));

    for (let k = 0; k < 2 * halfOrder; k++) {
      // 奇数次のバターワースフィルタを 2 個直列に接続すると、位相が低域バンドと 180 度ずれるため、
      // 干渉が発生しないように、位相を反転させる。
      let angle;
      if (halfOrder % 2 === 0) {
        angle = ((2 * k + 1) * 2 * Math.PI) / (4 * halfOrder);
      } else {
        angle = ((2 * k + 0) * 2 * Math.PI) / (4 * halfOrder);
      }

      // アナログ零点
      const analogZero = new Complex(
        magnitude * Math.cos(angle),
        magnitude * Math.sin(angle),
      );
      const digitalZero = bilinearTransform(analogZero, T);

      // 実軸上の零点（angle = π の場合）
      if (Math.abs(digitalZero.imag) < 1e-10) {
        zeros.push({
          type: 'real',
          id: `${idPrefix}_${k}`,
          real: digitalZero.real,
          isPole: false,
        } as PoleZeroReal);
      }
      // 上半平面の零点のみ処理（共役ペアとして登録）
      else if (digitalZero.imag > 1e-10) {
        zeros.push({
          type: 'pair',
          id: `${idPrefix}_${k}`,
          real: digitalZero.real,
          imag: Math.abs(digitalZero.imag),
          isPole: false,
        } as PoleZeroPair);
      }
    }

    return zeros;
  }
}
