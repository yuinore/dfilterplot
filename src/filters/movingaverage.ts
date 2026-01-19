import type { FilterDesignBase, FilterGenerationResult } from './base';
import { MovingAverageFilterPanel } from '../components/filters/MovingAverageFilterPanel';
import { generateMovingAverageFilter } from '../utils/movingAverageFilter';

/**
 * 移動平均フィルタ設計
 */
export class MovingAverageFilterDesign implements FilterDesignBase {
  id = 'movingaverage';
  nameKey = 'filters.movingAverage.name';
  descriptionKey = 'filters.movingAverage.description';
  PanelComponent = MovingAverageFilterPanel;

  generate(params: Record<string, any>): FilterGenerationResult {
    const { length } = params;
    return generateMovingAverageFilter(length);
  }
}

