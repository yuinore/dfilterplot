import type { FilterDesignBase, FilterGenerationResult } from './base';
import type { PoleOrZero, PoleZeroReal } from '../types';
import { FirstOrderIIRFilterPanel } from '../components/filters/FirstOrderIIRFilterPanel';
import { generateFilterId } from '../utils/filterMath';

/**
 * 一次 IIR フィルタ設計
 * 1次伝達関数による LPF / HPF。極・零点が各1個の実数。
 *
 * LPF: H(z) = (1-α)z/(z-α), 極 z=α, 零点 z=0, ゲイン (1-α). α = e^(-ωc)
 * HPF: H(z) = ((1+α)/2)(z-1)/(z-α), 極 z=α, 零点 z=1, ゲイン (1+α)/2
 */
export class FirstOrderIIRFilterDesign implements FilterDesignBase {
  id = 'firstorderiir';
  nameKey = 'filters.firstorderiir.name';
  descriptionKey = 'filters.firstorderiir.description';
  PanelComponent = FirstOrderIIRFilterPanel;

  generate(params: Record<string, any>): FilterGenerationResult {
    const type = params.type as string;
    const cutoffFrequency = params.cutoffFrequency as number;

    const alpha = Math.exp(-cutoffFrequency);

    switch (type) {
      case 'lowpass':
        return this.generateLowPass(alpha);
      case 'highpass':
        return this.generateHighPass(alpha);
      default:
        return this.generateLowPass(alpha);
    }
  }

  /**
   * 1次 LPF: 極 z=α, 零点 z=0, ゲイン (1-α)
   */
  private generateLowPass(alpha: number): FilterGenerationResult {
    const poles: PoleOrZero[] = [];
    const zeros: PoleOrZero[] = [];

    poles.push({
      id: generateFilterId(),
      real: alpha,
      isPole: true,
    } as PoleZeroReal);

    zeros.push({
      id: generateFilterId(),
      real: 0.0,
      isPole: false,
    } as PoleZeroReal);

    return { poles, zeros, gain: 1 - alpha };
  }

  /**
   * 1次 HPF: 極 z=α, 零点 z=1, ゲイン (1+α)/2
   */
  private generateHighPass(alpha: number): FilterGenerationResult {
    const poles: PoleOrZero[] = [];
    const zeros: PoleOrZero[] = [];

    poles.push({
      id: generateFilterId(),
      real: alpha,
      isPole: true,
    } as PoleZeroReal);

    zeros.push({
      id: generateFilterId(),
      real: 1.0,
      isPole: false,
    } as PoleZeroReal);

    return { poles, zeros, gain: (1 + alpha) / 2 };
  }
}
