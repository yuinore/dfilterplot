import { Complex } from './filterMath';

/**
 * Durand-Kerner法（DKA法）で多項式のすべての根を求める
 * 
 * 多項式: a_n * x^n + a_{n-1} * x^{n-1} + ... + a_1 * x + a_0 = 0
 * 
 * 参考:
 * - https://qiita.com/Shoichiro-Tsutsui/items/3eb34941e4a1e2d302b1
 * - https://ja.wikipedia.org/wiki/%E3%83%87%E3%83%A5%E3%83%A9%E3%83%B3%E3%83%BC%E3%82%AB%E3%83%BC%E3%83%8A%E3%83%BC%E6%B3%95
 * 
 * @param coefficients 係数の配列（降べき順: [a_n, a_{n-1}, ..., a_1, a_0]）
 * @param maxIterations 最大反復回数（デフォルト: 1000）
 * @param tolerance 収束判定の許容誤差（デフォルト: 1e-10）
 * @returns 根の配列（複素数）
 */
export function durandKerner(
  coefficients: number[],
  maxIterations: number = 1000,
  tolerance: number = 1e-10
): Complex[] {
  const n = coefficients.length - 1; // 多項式の次数
  
  if (n <= 0) {
    throw new Error('多項式の次数は1以上である必要があります');
  }
  
  // 最高次の係数が0でないことを確認
  if (Math.abs(coefficients[0]) < 1e-10) {
    throw new Error('最高次の係数が0です');
  }
  
  // 定数項のみの場合
  if (n === 0) {
    return [];
  }
  
  // 1次式の場合
  if (n === 1) {
    const root = -coefficients[1] / coefficients[0];
    return [new Complex(root, 0)];
  }
  
  // 初期値の設定: 単位円上の等間隔の点
  // x_k = r * exp(j * 2πk / n) の形式
  // r は適切な初期半径（係数の大きさから推定）
  const maxCoeff = Math.max(...coefficients.map(Math.abs));
  const initialRadius = Math.max(1.0, maxCoeff / Math.abs(coefficients[0]));
  
  let roots: Complex[] = [];
  for (let k = 0; k < n; k++) {
    const angle = (2 * Math.PI * k) / n;
    const real = initialRadius * Math.cos(angle);
    const imag = initialRadius * Math.sin(angle);
    roots.push(new Complex(real, imag));
  }
  
  // 多項式の値を計算する関数
  const evaluatePolynomial = (x: Complex): Complex => {
    let result = new Complex(0, 0);
    let xPower = new Complex(1, 0); // x^0 = 1
    
    // 降べき順で計算: a_n * x^n + a_{n-1} * x^{n-1} + ... + a_0
    for (let i = 0; i <= n; i++) {
      const coeff = coefficients[i];
      result = result.add(xPower.multiply(new Complex(coeff, 0)));
      xPower = xPower.multiply(x);
    }
    
    return result;
  };
  
  // 反復計算
  for (let iteration = 0; iteration < maxIterations; iteration++) {
    const newRoots: Complex[] = [];
    let converged = true;
    
    for (let i = 0; i < n; i++) {
      const x_i = roots[i];
      
      // P(x_i) を計算
      const p_x_i = evaluatePolynomial(x_i);
      
      // 分母: a_n * ∏_{j≠i}(x_i - x_j)
      let denominator = new Complex(coefficients[0], 0);
      for (let j = 0; j < n; j++) {
        if (i !== j) {
          denominator = denominator.multiply(x_i.subtract(roots[j]));
        }
      }
      
      // 更新: x_i^{(k+1)} = x_i^{(k)} - P(x_i^{(k)}) / (a_n * ∏_{j≠i}(x_i^{(k)} - x_j^{(k)}))
      const correction = p_x_i.divide(denominator);
      const new_x_i = x_i.subtract(correction);
      newRoots.push(new_x_i);
      
      // 収束判定: |x_i^{(k+1)} - x_i^{(k)}| < tolerance
      const diff = correction.magnitude();
      if (diff > tolerance) {
        converged = false;
      }
    }
    
    roots = newRoots;
    
    if (converged) {
      break;
    }
  }
  
  return roots;
}

