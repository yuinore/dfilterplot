import type { FilterDesignBase, FilterGenerationResult } from './base';
import { CalculusFilterPanel } from '../components/filters/CalculusFilterPanel';
import {
  generateDifferentiator,
  generateIntegrator,
} from '../utils/biquadFilter';

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
        return generateDifferentiator();
      case 'integrator':
        return generateIntegrator();
      default:
        return generateDifferentiator();
    }
  }
}

