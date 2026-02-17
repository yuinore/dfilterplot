import { FilterRegistry } from './base';
import { FirstOrderIIRFilterDesign } from './firstorderiir';
import { BiquadFilterDesign } from './biquad';
import { CalculusFilterDesign } from './calculus';
import { DelayFilterDesign } from './delay';
import { CombFilterDesign } from './comb';
import { MovingAverageFilterDesign } from './movingaverage';
import { ButterworthFilterDesign } from './butterworth';
import { LinkwitzRileyFilterDesign } from './linkwitzRiley';
import { SincFilterDesign } from './sinc';
import { GaussianFilterDesign } from './gaussian';

// フィルタを登録（ドロップダウン表示順＝登録順）
FilterRegistry.register(new FirstOrderIIRFilterDesign());
FilterRegistry.register(new BiquadFilterDesign());
FilterRegistry.register(new ButterworthFilterDesign());
FilterRegistry.register(new LinkwitzRileyFilterDesign());
FilterRegistry.register(new MovingAverageFilterDesign());
FilterRegistry.register(new CombFilterDesign());
FilterRegistry.register(new CalculusFilterDesign());
FilterRegistry.register(new DelayFilterDesign());
FilterRegistry.register(new SincFilterDesign());
FilterRegistry.register(new GaussianFilterDesign());

export * from './base';
export { FirstOrderIIRFilterDesign } from './firstorderiir';
export { BiquadFilterDesign } from './biquad';
export { ButterworthFilterDesign } from './butterworth';
export { LinkwitzRileyFilterDesign } from './linkwitzRiley';
export { MovingAverageFilterDesign } from './movingaverage';
export { CombFilterDesign } from './comb';
export { CalculusFilterDesign } from './calculus';
export { DelayFilterDesign } from './delay';
export { SincFilterDesign } from './sinc';
export { GaussianFilterDesign } from './gaussian';
