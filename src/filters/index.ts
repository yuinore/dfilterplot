import { FilterRegistry } from './base';
import { BiquadFilterDesign } from './biquad';
import { CalculusFilterDesign } from './calculus';
import { CombFilterDesign } from './comb';
import { MovingAverageFilterDesign } from './movingaverage';
import { ButterworthFilterDesign } from './butterworth';
import { SincFilterDesign } from './sinc';
import { GaussianFilterDesign } from './gaussian';

// フィルタを登録
FilterRegistry.register(new BiquadFilterDesign());
FilterRegistry.register(new CalculusFilterDesign());
FilterRegistry.register(new CombFilterDesign());
FilterRegistry.register(new MovingAverageFilterDesign());
FilterRegistry.register(new ButterworthFilterDesign());
FilterRegistry.register(new SincFilterDesign());
FilterRegistry.register(new GaussianFilterDesign());

export * from './base';
export { BiquadFilterDesign } from './biquad';
export { CalculusFilterDesign } from './calculus';
export { CombFilterDesign } from './comb';
export { MovingAverageFilterDesign } from './movingaverage';
export { ButterworthFilterDesign } from './butterworth';
export { SincFilterDesign } from './sinc';
export { GaussianFilterDesign } from './gaussian';
