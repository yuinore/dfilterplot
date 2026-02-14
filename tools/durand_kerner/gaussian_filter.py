#!/usr/bin/env python3
"""
ガウシアンフィルタに関する処理（mpmath使用）

ガウシアンフィルタのインパルス応答の計算、係数の計算、零点の計算を行う
"""

import mpmath
import sys
from typing import List, Union

from durand_kerner import durand_kerner


def calculate_gaussian_impulse_response(
    sigma: Union[float, mpmath.mpf],
    taps: int,
    window_function: str = 'none',
    dps: int = 50,
) -> List[mpmath.mpf]:
    """
    ガウシアンフィルタのインパルス応答を計算（高精度版）

    Args:
        sigma: 標準偏差（ガウシアンの幅を制御）
        taps: タップ数（奇数、31以下）
        window_function: 窓関数 ('none' | 'hann')
        dps: 計算精度（10進数の桁数、デフォルト: 50）

    Returns:
        インパルス応答の配列（mpmath.mpf）
    """
    # 精度を設定
    mpmath.mp.dps = dps

    # 係数をmpmath.mpfに変換
    sigma_mp = mpmath.mpf(sigma)

    # タップ数は奇数で31以下
    N = min(max(3, taps), 31)
    half_n = N // 2

    # インパルス応答を計算（左右対称）
    impulse_response: List[mpmath.mpf] = []
    for n in range(-half_n, half_n + 1):
        n_mp = mpmath.mpf(n)
        value = mpmath.exp(-(n_mp * n_mp) / (2 * sigma_mp * sigma_mp))
        impulse_response.append(value)

    # 窓関数を適用
    if window_function == 'hann':
        for i in range(len(impulse_response)):
            # 最初のサンプルが 0 にならないように、窓関数の長さは N + 1 になるようにする
            n = i - half_n  # -half_n から half_n までのインデックス
            normalized_index = mpmath.mpf(n + half_n + 1) / mpmath.mpf(N + 1)  # 0 から 1 に正規化
            window_value = mpmath.mpf(0.5) * (mpmath.mpf(1) - mpmath.cos(2 * mpmath.pi * normalized_index))
            impulse_response[i] *= window_value

    # ノーマライズ
    sum_val = sum(impulse_response)
    impulse_response = [h / sum_val for h in impulse_response]

    return impulse_response


def calculate_gaussian_zeros(
    taps: int,
    sigma: Union[float, mpmath.mpf],
    dps: int = 50,
) -> List[mpmath.mpc]:
    """
    ガウシアンフィルタの零点を計算（高精度版）

    Args:
        taps: タップ数（奇数）
        sigma: 標準偏差（シグマ）
        dps: 計算精度（10進数の桁数、デフォルト: 50）

    Returns:
        零点の配列（mpmath.mpc複素数）
    """
    # インパルス応答を計算
    impulse_response = calculate_gaussian_impulse_response(sigma, taps, window_function='hann', dps=dps)

    # 伝達関数 H(z) = Σ h[n] * z^(-n) の係数を計算
    # z^(-n) の係数が h[n] なので、降べき順に並べると:
    # H(z) = h[-halfN] * z^(halfN) + ... + h[0] + ... + h[halfN] * z^(-halfN)
    # これを z^(-halfN) で割ると:
    # H(z) * z^(halfN) = h[-halfN] * z^(2*halfN) + ... + h[0] * z^(halfN) + ... + h[halfN]
    # つまり、多項式の係数は [h[-halfN], h[-halfN+1], ..., h[0], ..., h[halfN]]
    coefficients = impulse_response.copy()

    # 0次の係数（定数項）を削除した回数をカウント（原点の極の数）
    removed_constant_terms_count = 0

    # 最高次の係数が0に近い場合は削除（x=∞の根は省略可能）
    # 削除後も再度0チェックを行い、0以外になるまで繰り返す
    trimmed_coefficients = coefficients.copy()

    # ガウシアンフィルタの零点の許容誤差
    # 係数のトリミング用には、他の許容誤差よりも1段階大きな誤差が必要
    # （durandKernerで解くには小さすぎる係数を適切に除去するため）
    gaussian_filter_zero_tolerance = mpmath.mpf(10) ** (-dps + 4)

    if len(coefficients) > 1:
        while (
            len(trimmed_coefficients) > 1
            and abs(trimmed_coefficients[0]) <= gaussian_filter_zero_tolerance
        ):
            trimmed_coefficients = trimmed_coefficients[1:]

        # 0次の係数（定数項）が0に近い場合は削除（z=0の根を削除し、原点に極を追加）
        # 削除後も再度0チェックを行い、0以外になるまで繰り返す
        while (
            len(trimmed_coefficients) > 1
            and abs(trimmed_coefficients[-1]) <= gaussian_filter_zero_tolerance
        ):
            trimmed_coefficients = trimmed_coefficients[:-1]
            removed_constant_terms_count += 1

        # 最高次の係数が0でないことを確認
        if (
            len(trimmed_coefficients) > 1
            and abs(trimmed_coefficients[0]) > gaussian_filter_zero_tolerance
        ):
            try:
                # 多項式の根を求める（高精度版）
                roots = durand_kerner(trimmed_coefficients, dps=dps)

                # 上半平面の零点のみ返す（実軸上の零点も含む）
                zeros = []
                zero_tolerance = mpmath.mpf(10) ** (-dps + 5)
                for root in roots:
                    # 実軸上の零点または上半平面の零点
                    if abs(root.imag) < zero_tolerance or root.imag > zero_tolerance:
                        zeros.append(root)

                return zeros
            except Exception as e:
                # DKA法が失敗した場合は零点なし（エラーを無視）
                print(f'Warning: Failed to calculate gaussian filter zeros: {e}', file=sys.stderr)
                return []

    return []
