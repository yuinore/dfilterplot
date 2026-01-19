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
   * 零点: z = 1, 極: z = 0
   */
  private generateDifferentiator(): FilterGenerationResult {
    const poles: PoleOrZero[] = [];
    const zeros: PoleOrZero[] = [];
    
    // 零点: z = 1
    zeros.push({
      type: 'real',
      id: generateFilterId(),
      real: 1.0,
      isPole: false,
    } as PoleZeroReal);
    
    // ゲイン = 1
    const gain = 1.0;
    
    return { poles, zeros, gain };
  }

  /**
   * 積分フィルタを生成
   * H(z) = 1 / (1 - z^-1) = z / (z - 1)
   * 零点: なし, 極: z = 1
   */
  private generateIntegrator(): FilterGenerationResult {
    const poles: PoleOrZero[] = [];
    const zeros: PoleOrZero[] = [];
    
    // 極: z = 1（単位円上なので不安定）
    poles.push({
      type: 'real',
      id: generateFilterId(),
      real: 1.0,
      isPole: true,
    } as PoleZeroReal);
    
    // ゲイン = 1
    const gain = 1.0;
    
    return { poles, zeros, gain };
  }
}

