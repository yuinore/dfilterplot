/**
 * フィルタ設計で使用する数学ユーティリティ
 */

/**
 * フィルタ設計用のID生成
 */
let nextFilterId = 1000;

export function generateFilterId(): string {
  return (nextFilterId++).toString();
}

/**
 * 複素数クラス
 */
export class Complex {
  real: number;
  imag: number;

  constructor(real: number, imag: number) {
    this.real = real;
    this.imag = imag;
  }

  add(c: Complex): Complex {
    return new Complex(this.real + c.real, this.imag + c.imag);
  }

  subtract(c: Complex): Complex {
    return new Complex(this.real - c.real, this.imag - c.imag);
  }

  multiply(c: Complex): Complex {
    return new Complex(
      this.real * c.real - this.imag * c.imag,
      this.real * c.imag + this.imag * c.real,
    );
  }

  divide(c: Complex): Complex {
    const denom = c.real * c.real + c.imag * c.imag;
    return new Complex(
      (this.real * c.real + this.imag * c.imag) / denom,
      (this.imag * c.real - this.real * c.imag) / denom,
    );
  }

  magnitude(): number {
    return Math.sqrt(this.real * this.real + this.imag * this.imag);
  }

  angle(): number {
    return Math.atan2(this.imag, this.real);
  }
}

/**
 * 双一次変換（Bilinear Transform）
 * s = (2/T) * (1 - z^(-1)) / (1 + z^(-1))
 * => z = (1 + sT/2) / (1 - sT/2)
 *
 * @param analogPole アナログ極（s平面）
 * @param T サンプリング周期（正規化：T=2）
 * @returns デジタル極（z平面）
 */
export function bilinearTransform(analogPole: Complex, T: number = 2): Complex {
  // z = (1 + s*T/2) / (1 - s*T/2)
  const halfT = T / 2;
  const numerator = new Complex(1, 0).add(
    analogPole.multiply(new Complex(halfT, 0)),
  );
  const denominator = new Complex(1, 0).subtract(
    analogPole.multiply(new Complex(halfT, 0)),
  );
  return numerator.divide(denominator);
}

/**
 * 2次方程式 ax^2 + bx + c = 0 を解く
 *
 * @param a 2次の係数
 * @param b 1次の係数
 * @param c 定数項
 * @returns 解の配列（複素数）
 */
export function solveQuadratic(a: number, b: number, c: number): Complex[] {
  const discriminant = b * b - 4 * a * c;

  if (Math.abs(discriminant) < 1e-10) {
    // 重解
    const x = -b / (2 * a);
    return [new Complex(x, 0), new Complex(x, 0)];
  } else if (discriminant > 0) {
    // 実数解
    const sqrtD = Math.sqrt(discriminant);
    return [
      new Complex((-b + sqrtD) / (2 * a), 0),
      new Complex((-b - sqrtD) / (2 * a), 0),
    ];
  } else {
    // 複素数解
    const real = -b / (2 * a);
    const imag = Math.sqrt(-discriminant) / (2 * a);
    return [new Complex(real, imag), new Complex(real, -imag)];
  }
}
