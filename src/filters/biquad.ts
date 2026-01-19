import type { FilterDesignBase, FilterGenerationResult } from './base';
import { BiquadFilterPanel } from '../components/filters/BiquadFilterPanel';
import {
  generateLowPassBiquad,
  generateHighPassBiquad,
  generateBandPassBiquad,
  generateBandStopBiquad,
} from '../utils/biquadFilter';

/**
 * Biquadフィルタ設計
 */
export class BiquadFilterDesign implements FilterDesignBase {
  id = 'biquad';
  nameKey = 'filters.biquad.name';
  descriptionKey = 'filters.biquad.description';
  PanelComponent = BiquadFilterPanel;

  generate(params: Record<string, any>): FilterGenerationResult {
    const type = params.type as string;
    const cutoffFrequency = params.cutoffFrequency as number;
    const qFactor = params.qFactor as number;

    switch (type) {
      case 'lowpass':
        return generateLowPassBiquad(cutoffFrequency, qFactor);
      case 'highpass':
        return generateHighPassBiquad(cutoffFrequency, qFactor);
      case 'bandpass':
        return generateBandPassBiquad(cutoffFrequency, qFactor);
      case 'bandstop':
        return generateBandStopBiquad(cutoffFrequency, qFactor);
      default:
        return generateLowPassBiquad(cutoffFrequency, qFactor);
    }
  }
}

