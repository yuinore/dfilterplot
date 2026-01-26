# Durand-Kerner法によるフィルタの零点計算

このディレクトリには、Durand-Kerner法（DKA法）を使用してフィルタの零点を計算するPythonスクリプトが含まれています。

## ファイル構成

- `durand_kerner.py`: Durand-Kerner法（DKA法）ソルバーの実装
- `gaussian_filter.py`: ガウシアンフィルタに関する処理（インパルス応答の計算、係数の計算、零点の計算）
- `find_zeros.py`: 引数のパースと処理の呼び出しを行うメインスクリプト

## 使用方法

```bash
python find_zeros.py <filter_type> [filter_type_specific_args...]
```

### 現在対応しているフィルタタイプ

#### ガウシアンフィルタ (`gauss`)

```bash
python find_zeros.py gauss <taps> <sigma>
```

**引数:**
- `gauss`: フィルタタイプ
- `taps`: タップ数（奇数）
- `sigma`: 標準偏差（シグマ）

**オプション:**
- `--output <filename>`: 出力JSONファイル名（デフォルト: `zeros.json`）

**例:**
```bash
# タップ数7、シグマ1.0のガウシアンフィルタの零点を計算
python find_zeros.py gauss 7 1.0

# 出力ファイル名を指定
python find_zeros.py gauss 7 1.0 --output result.json
```

## 出力

- コンソール: 各零点の実部と虚部を表示
- JSONファイル: 零点の情報をJSON形式で保存

JSONファイルの形式:
```json
{
  "filter_type": "gauss",
  "taps": 7,
  "sigma": 1.0,
  "zeros": [
    {"real": 0.1234567890, "imag": 0.9876543210},
    ...
  ]
}
```
