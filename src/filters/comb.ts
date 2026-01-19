import type { FilterDesignBase, FilterGenerationResult } from './base';
import { CombFilterPanel } from '../components/filters/CombFilterPanel';
import {
  generateFeedforwardComb,
  generateFeedbackComb,
} from '../utils/combFilter';

/**
 * コムフィルタ設計
 */
export class CombFilterDesign implements FilterDesignBase {
  id = 'comb';
  nameKey = 'filters.comb.name';
  descriptionKey = 'filters.comb.description';
  PanelComponent = CombFilterPanel;

  generate(params: Record<string, any>): FilterGenerationResult {
    const { type, delay, gain } = params;
    
    if (type === 'feedforward') {
      return generateFeedforwardComb(delay, gain);
    } else if (type === 'feedback') {
      return generateFeedbackComb(delay, gain);
    }
    
    throw new Error(`Unknown comb filter type: ${type}`);
  }
}

