#!/usr/bin/env python3
"""
Durand-Kerner法（DKA法）で多項式のすべての根を求める（mpmath使用）

多項式: a_n * x^n + a_{n-1} * x^{n-1} + ... + a_1 * x + a_0 = 0

参考:
- https://qiita.com/Shoichiro-Tsutsui/items/3eb34941e4a1e2d302b1
- https://ja.wikipedia.org/wiki/%E3%83%87%E3%83%A5%E3%83%A9%E3%83%B3%E3%83%BC%E3%82%AB%E3%83%BC%E3%83%8A%E3%83%BC%E6%B3%95
"""

import mpmath
from typing import List, Union


def durand_kerner(
    coefficients: List[Union[float, mpmath.mpf]],
    max_iterations: int = 1000,
    tolerance: Union[float, mpmath.mpf] = None,
    dps: int = 50,
) -> List[mpmath.mpc]:
    """
    Durand-Kerner法で多項式のすべての根を求める（高精度版）

    Args:
        coefficients: 係数の配列（昇べき順: [a_0, a_1, ..., a_n]）
        max_iterations: 最大反復回数（デフォルト: 1000。dps が大きいときは少なくとも dps*20 回まで自動で拡張）
        tolerance: 収束判定の許容誤差（デフォルト: 10^(-dps+5)）
        dps: 計算精度（10進数の桁数、デフォルト: 50）

    Returns:
        根の配列（mpmath.mpc複素数）
    """
    # 精度を設定
    mpmath.mp.dps = dps

    if tolerance is None:
        # デフォルトの許容誤差: 精度より5桁小さい値
        tolerance = mpmath.mpf(10) ** (-dps + 5)

    # 高精度のときは収束に必要な反復回数が増えるため、上限を緩和する
    effective_max_iterations = max(max_iterations, dps * 20)

    # 係数をmpmath.mpfに変換
    coeffs = [mpmath.mpf(c) for c in coefficients]
    n = len(coeffs) - 1  # 多項式の次数

    if n <= 0:
        raise ValueError("多項式の次数は1以上である必要があります")

    # 最高次の係数が0でないことを確認（昇べきなので a_n = coeffs[n]）
    if abs(coeffs[n]) < tolerance:
        raise ValueError("最高次の係数が0です")

    # 定数項のみの場合
    if n == 0:
        return []

    # 1次式の場合: a_0 + a_1*x = 0 → x = -a_0/a_1
    if n == 1:
        root = -coeffs[0] / coeffs[1]
        return [mpmath.mpc(root, 0)]

    # 初期値の設定: 単位円上の等間隔の点
    # x_k = r * exp(j * 2πk / n) の形式
    # r は適切な初期半径（係数の大きさから推定）
    max_coeff = max(abs(c) for c in coeffs)
    initial_radius = max(mpmath.mpf(1), max_coeff / abs(coeffs[0]))

    roots: List[mpmath.mpc] = []
    for k in range(n):
        angle = (2 * mpmath.pi * k) / n
        real = initial_radius * mpmath.cos(angle)
        imag = initial_radius * mpmath.sin(angle)
        roots.append(mpmath.mpc(real, imag))

    # 多項式の値を計算する関数
    def evaluate_polynomial(x: mpmath.mpc) -> mpmath.mpc:
        result = mpmath.mpc(0, 0)
        x_power = mpmath.mpc(1, 0)  # x^0 = 1

        # 昇べき順で計算: a_0 + a_1 * x + ... + a_n * x^n
        for i in range(n + 1):
            coeff = coeffs[i]
            result += x_power * coeff
            x_power *= x

        return result

    # 反復計算
    for iteration in range(effective_max_iterations):
        new_roots: List[mpmath.mpc] = []
        converged = True

        for i in range(n):
            x_i = roots[i]

            # P(x_i) を計算
            p_x_i = evaluate_polynomial(x_i)

            # 分母: a_n * ∏_{j≠i}(x_i - x_j)（実装は昇べきなので a_n = coeffs[n]）
            denominator = mpmath.mpc(coeffs[n], 0)
            for j in range(n):
                if i != j:
                    denominator *= x_i - roots[j]

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
