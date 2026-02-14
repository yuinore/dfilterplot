#!/usr/bin/env python3
"""
フィルタの零点を計算するメインスクリプト（mpmath使用）

コマンドライン引数:
    python find_zeros.py <filter_type> [filter_type_specific_args...] [--dps DPS]

    現在対応しているフィルタタイプ:
    - gauss <taps> <sigma>: ガウシアンフィルタ
        - taps: タップ数（奇数）
        - sigma: 標準偏差（シグマ）

    オプション:
    - --dps DPS: 計算精度（10進数の桁数、デフォルト: 50）
"""

import argparse
import json
import sys
from pathlib import Path

from gaussian_filter import calculate_gaussian_zeros


def main():
    parser = argparse.ArgumentParser(
        description='フィルタの零点を計算する（高精度版）'
    )
    parser.add_argument(
        'filter_type',
        type=str,
        choices=['gauss'],
        help='フィルタタイプ（現在は "gauss" のみ対応）',
    )
    parser.add_argument(
        'taps',
        type=int,
        nargs='?',
        help='タップ数（奇数、gaussの場合に必要）',
    )
    parser.add_argument(
        'sigma',
        type=float,
        nargs='?',
        help='標準偏差（シグマ、gaussの場合に必要）',
    )
    parser.add_argument(
        '--output',
        type=str,
        default='zeros.json',
        help='出力JSONファイル名（デフォルト: zeros.json）',
    )
    parser.add_argument(
        '--dps',
        type=int,
        default=50,
        help='計算精度（10進数の桁数、デフォルト: 50）',
    )

    args = parser.parse_args()

    if args.filter_type == 'gauss':
        # ガウシアンフィルタの場合、tapsとsigmaが必要
        if args.taps is None or args.sigma is None:
            parser.error('gauss フィルタには taps と sigma が必要です')

        # タップ数が奇数であることを確認
        if args.taps % 2 == 0:
            print('Error: タップ数は奇数である必要があります', file=sys.stderr)
            sys.exit(1)

        # 零点を計算（高精度版）
        zeros = calculate_gaussian_zeros(args.taps, args.sigma, dps=args.dps)

        # 結果をコンソールに表示
        print(f'ガウシアンフィルタの零点（タップ数: {args.taps}, シグマ: {args.sigma}, 精度: {args.dps}桁）')
        print(f'零点の数: {len(zeros)}')
        print()
        print('零点（実部, 虚部）:')
        for i, zero in enumerate(zeros):
            # mpmath.mpcをfloatに変換して表示
            real_val = float(zero.real)
            imag_val = float(zero.imag)
            print(f'  {i+1}: {real_val:.15e}, {imag_val:.15e}')

        # JSONファイルに出力
        output_data = {
            'filter_type': 'gauss',
            'taps': args.taps,
            'sigma': args.sigma,
            'dps': args.dps,
            'zeros': [
                {'real': float(zero.real), 'imag': float(zero.imag)}
                for zero in zeros
            ],
        }

        output_path = Path(args.output)
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(output_data, f, indent=2, ensure_ascii=False)

        print()
        print(f'結果を {output_path} に保存しました')
    else:
        print(f'Error: 未対応のフィルタタイプ: {args.filter_type}', file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
