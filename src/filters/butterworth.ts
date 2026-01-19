import type { FilterDesignBase, FilterGenerationResult } from './base';
import { ButterworthFilterPanel } from '../components/filters/ButterworthFilterPanel';
import {
  generateLowPassButterworth,
  generateHighPassButterworth,
} from '../utils/butterworthFilter';

/**
 * バターワースフィルタ設計
 */
export class ButterworthFilterDesign implements FilterDesignBase {
  id = 'butterworth';
  nameKey = 'filters.butterworth.name';
  descriptionKey = 'filters.butterworth.description';
  PanelComponent = ButterworthFilterPanel;

  generate(params: Record<string, any>): FilterGenerationResult {
    const { type, order, cutoffFrequency } = params;
    
    if (type === 'lowpass') {
      return generateLowPassButterworth(order, cutoffFrequency);
    } else if (type === 'highpass') {
      return generateHighPassButterworth(order, cutoffFrequency);
    }
    
    throw new Error(`Unknown butterworth filter type: ${type}`);
  }
}

