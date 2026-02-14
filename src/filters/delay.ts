import type { FilterDesignBase, FilterGenerationResult } from './base';
import type { PoleOrZero, PoleZeroReal } from '../types';
import { DelayFilterPanel } from '../components/filters/DelayFilterPanel';
import { generateFilterId } from '../utils/filterMath';

/**
 * 遅延フィルタ設計
 * H(z) = z^(-order) = 1 / z^order
 * 極: 原点に order 個、零点なし、ゲイン 1
 */
export class DelayFilterDesign implements FilterDesignBase {
  id = 'delay';
  nameKey = 'filters.delay.name';
  descriptionKey = 'filters.delay.description';
  PanelComponent = DelayFilterPanel;

  generate(params: Record<string, any>): FilterGenerationResult {
    const order = Math.max(1, Math.floor(Number(params.order) || 1));
    return this.generateDelayFilter(order);
  }

  /**
   * 遅延フィルタを生成
   * 指定した次数の極を原点に配置する
   */
  private generateDelayFilter(order: number): FilterGenerationResult {
    const poles: PoleOrZero[] = [];
    const zeros: PoleOrZero[] = [];

    for (let i = 0; i < order; i++) {
      poles.push({
        id: generateFilterId(),
        real: 0.0,
        isPole: true,
      } as PoleZeroReal);
    }

    return { poles, zeros, gain: 1.0 };
  }
}
