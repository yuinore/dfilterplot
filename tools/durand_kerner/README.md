# Durand-Kerner法によるフィルタの零点計算（高精度版）

このディレクトリには、Durand-Kerner法（DKA法）を使用してフィルタの零点を計算するPythonスクリプトが含まれています。mpmathを使用した高精度浮動小数点演算により、高次の多項式でも正確に零点を計算できます。

## 必要なパッケージ

```bash
pip install -r requirements.txt
```

または

```bash
pip install mpmath>=1.3.0
```

## ファイル構成

- `durand_kerner.py`: Durand-Kerner法（DKA法）ソルバーの実装（mpmath使用）
- `gaussian_filter.py`: ガウシアンフィルタに関する処理（インパルス応答の計算、係数の計算、零点の計算、mpmath使用）
- `find_zeros.py`: 引数のパースと処理の呼び出しを行うメインスクリプト
- `requirements.txt`: 必要なパッケージのリスト

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
- `--dps <dps>`: 計算精度（10進数の桁数、デフォルト: 50）。高次の多項式ではより大きな値（例: 100）を推奨

**例:**
```bash
# タップ数7、シグマ1.0のガウシアンフィルタの零点を計算（デフォルト精度: 50桁）
python find_zeros.py gauss 7 1.0

# 出力ファイル名を指定
python find_zeros.py gauss 7 1.0 --output result.json

# 高精度計算（100桁）で高次の多項式を解く
python find_zeros.py gauss 31 1.0 --dps 100
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
  "dps": 50,
  "zeros": [
    {"real": 0.1234567890, "imag": 0.9876543210},
    ...
  ]
}
```

## 高精度計算について

このツールはmpmathを使用した高精度浮動小数点演算をサポートしています。`--dps`オプションで計算精度を指定できます：

- **デフォルト（50桁）**: 通常の計算に適しています
- **高精度（100桁以上）**: 高次の多項式や、非常に小さな係数を持つ多項式に推奨

高次の多項式（次数が20以上）を解く場合は、`--dps 100`以上の設定を推奨します。
