#!/usr/bin/env python3
"""
Durand-Kerner法（DKA法）で多項式のすべての根を求める

多項式: a_n * x^n + a_{n-1} * x^{n-1} + ... + a_1 * x + a_0 = 0

参考:
- https://qiita.com/Shoichiro-Tsutsui/items/3eb34941e4a1e2d302b1
- https://ja.wikipedia.org/wiki/%E3%83%87%E3%83%A5%E3%83%A9%E3%83%B3%E3%83%BC%E3%82%AB%E3%83%BC%E3%83%8A%E3%83%BC%E6%B3%95
"""

import cmath
import math
from typing import List


def durand_kerner(
    coefficients: List[float],
    max_iterations: int = 1000,
    tolerance: float = 1e-10,
) -> List[complex]:
    """
    Durand-Kerner法で多項式のすべての根を求める

    Args:
        coefficients: 係数の配列（降べき順: [a_n, a_{n-1}, ..., a_1, a_0]）
        max_iterations: 最大反復回数（デフォルト: 1000）
        tolerance: 収束判定の許容誤差（デフォルト: 1e-10）

    Returns:
        根の配列（複素数）
    """
    n = len(coefficients) - 1  # 多項式の次数

    if n <= 0:
        raise ValueError('多項式の次数は1以上である必要があります')

    # 最高次の係数が0でないことを確認
    if abs(coefficients[0]) < 1e-10:
        raise ValueError('最高次の係数が0です')

    # 定数項のみの場合
    if n == 0:
        return []

    # 1次式の場合
    if n == 1:
        root = -coefficients[1] / coefficients[0]
        return [complex(root, 0)]

    # 初期値の設定: 単位円上の等間隔の点
    # x_k = r * exp(j * 2πk / n) の形式
    # r は適切な初期半径（係数の大きさから推定）
    max_coeff = max(abs(c) for c in coefficients)
    initial_radius = max(1.0, max_coeff / abs(coefficients[0]))

    roots: List[complex] = []
    for k in range(n):
        angle = (2 * math.pi * k) / n
        real = initial_radius * math.cos(angle)
        imag = initial_radius * math.sin(angle)
        roots.append(complex(real, imag))

    # 多項式の値を計算する関数
    def evaluate_polynomial(x: complex) -> complex:
        result = complex(0, 0)
        x_power = complex(1, 0)  # x^0 = 1

        # 降べき順で計算: a_n * x^n + a_{n-1} * x^{n-1} + ... + a_0
        for i in range(n + 1):
            coeff = coefficients[i]
            result += x_power * coeff
            x_power *= x

        return result

    # 反復計算
    for iteration in range(max_iterations):
        new_roots: List[complex] = []
        converged = True

        for i in range(n):
            x_i = roots[i]

            # P(x_i) を計算
            p_x_i = evaluate_polynomial(x_i)

            # 分母: a_n * ∏_{j≠i}(x_i - x_j)
            denominator = complex(coefficients[0], 0)
            for j in range(n):
                if i != j:
                    denominator *= (x_i - roots[j])

            # 更新: x_i^{(k+1)} = x_i^{(k)} - P(x_i^{(k)}) / (a_n * ∏_{j≠i}(x_i^{(k)} - x_j^{(k)}))
            correction = p_x_i / denominator
            new_x_i = x_i - correction
            new_roots.append(new_x_i)

            # 収束判定: |x_i^{(k+1)} - x_i^{(k)}| < tolerance
            diff = abs(correction)
            if diff > tolerance:
                converged = False

        roots = new_roots

        if converged:
            break

    return roots
