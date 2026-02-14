import type { FilterDesignBase, FilterGenerationResult } from './base';
import type { PoleOrZero, PoleZeroReal } from '../types';
import { CalculusFilterPanel } from '../components/filters/CalculusFilterPanel';
import { generateFilterId } from '../utils/filterMath';

/**
 * 微積分フィルタ設計
 */
export class CalculusFilterDesign implements FilterDesignBase {
  id = 'calculus';
  nameKey = 'filters.calculus.name';
  descriptionKey = 'filters.calculus.description';
  PanelComponent = CalculusFilterPanel;

  generate(params: Record<string, any>): FilterGenerationResult {
    const type = params.type as string;

    switch (type) {
      case 'differentiator':
        return this.generateDifferentiator();
      case 'integrator':
        return this.generateIntegrator();
      default:
        return this.generateDifferentiator();
    }
  }

  /**
   * 微分フィルタを生成
   * H(z) = 1 - z^-1 = (z - 1) / z
   * 零点: z = 1, 極: z = 0（1個ずつで delaySamples = 0）
   */
  private generateDifferentiator(): FilterGenerationResult {
    const poles: PoleOrZero[] = [];
    const zeros: PoleOrZero[] = [];

    // 零点: z = 1
    zeros.push({
      id: generateFilterId(),
      real: 1.0,
      isPole: false,
    } as PoleZeroReal);

    // 極: z = 0（遅延因子）
    poles.push({
      id: generateFilterId(),
      real: 0.0,
      isPole: true,
    } as PoleZeroReal);

    // ゲイン = 1
    const gain = 1.0;

    return { poles, zeros, gain };
  }

  /**
   * 積分フィルタを生成
   * H(z) = 1 / (1 - z^-1) = z / (z - 1)
   * 零点: z = 0, 極: z = 1（1個ずつで delaySamples = 0）
   */
  private generateIntegrator(): FilterGenerationResult {
    const poles: PoleOrZero[] = [];
    const zeros: PoleOrZero[] = [];

    // 零点: z = 0（進み因子）
    zeros.push({
      id: generateFilterId(),
      real: 0.0,
      isPole: false,
    } as PoleZeroReal);

    // 極: z = 1（単位円上なので不安定）
    poles.push({
      id: generateFilterId(),
      real: 1.0,
      isPole: true,
    } as PoleZeroReal);

    // ゲイン = 1
    const gain = 1.0;

    return { poles, zeros, gain };
  }
}
