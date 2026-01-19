import { FilterRegistry } from './base';
import { BiquadFilterDesign } from './biquad';
import { CalculusFilterDesign } from './calculus';
import { CombFilterDesign } from './comb';
import { MovingAverageFilterDesign } from './movingaverage';

// フィルタを登録
FilterRegistry.register(new BiquadFilterDesign());
FilterRegistry.register(new CalculusFilterDesign());
FilterRegistry.register(new CombFilterDesign());
FilterRegistry.register(new MovingAverageFilterDesign());

export * from './base';
export { BiquadFilterDesign } from './biquad';
export { CalculusFilterDesign } from './calculus';
export { CombFilterDesign } from './comb';
export { MovingAverageFilterDesign } from './movingaverage';

