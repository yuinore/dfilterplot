import { FilterRegistry } from './base';
import { BiquadFilterDesign } from './biquad';
import { CalculusFilterDesign } from './calculus';

// フィルタを登録
FilterRegistry.register(new BiquadFilterDesign());
FilterRegistry.register(new CalculusFilterDesign());

export * from './base';
export { BiquadFilterDesign } from './biquad';
export { CalculusFilterDesign } from './calculus';

