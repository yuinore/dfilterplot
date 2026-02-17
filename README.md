# Digital Filter Plotter

デジタルフィルタの極・零点配置と伝達関数を可視化するインタラクティブなWebアプリケーション

## 概要

複素平面上に極と零点を配置し、伝達関数の周波数応答や時間応答をリアルタイムに表示します。極・零点をドラッグするか、フィルタ設計からプリセットを選択して利用できます。

極と零点はデジタルフィルタの実装において必ずしも考慮しなければならないものではなく、このアプリケーションは専ら数学的な洞察を深めるために制作されています。

## 技術スタック

- **フレームワーク**: React 19 + TypeScript + Vite
- **UI ライブラリ**: Material-UI (MUI)
- **グラフ描画**: Chart.js
- **国際化**: react-i18next (日本語・英語対応)
- **複素平面描画**: SVG

## 主な機能

- 複素平面での極・零点のドラッグ操作（ダブルクリックで削除）
- フィルタ設計プリセット（双二次、移動平均、バターワースなど）
- ボード線図（振幅・位相・群遅延）、インパルス応答、ステップ応答のリアルタイム表示

## 開発コマンド

### Install

```bash
yarn install
```

### Development

```bash
yarn dev
```

Then open the URL shown in the terminal (e.g. `http://localhost:5173`).

### Build

```bash
yarn build
```

Output is in the `dist/` directory.

### Preview production build

```bash
yarn preview
```

### Lint & format

```bash
yarn lint:fix
yarn format
```

## 参考文献 / References

- [Audio EQ Cookbook by Robert Bristow-Johnson](https://webaudio.github.io/Audio-EQ-Cookbook/Audio-EQ-Cookbook.txt) - Biquad filter design equations
- [Bode Plot - Interactive Pole/Zero Placement | Control Systems Academy](https://controlsystemsacademy.com/0019/0019.html) - Interactive visualization of pole/zero placement
- [Digital Filter by Paul Falstad](https://www.falstad.com/dfilter/) - Interactive digital filter simulator
- [マルチバンド（オーディオクロスオーバー）処理を実現するフィルタ（Butterworth, Linkwitz-Riley）のPython実装（2バンド） - Wizard Notes](https://www.wizard-notes.com/entry/python/audio-crossover-filter-2-band) - 2-band audio crossover filters (Butterworth, Linkwitz-Riley) in Python

## About This Project

This is an educational learning application and a disposable repository. The codebase does not follow DRY (Don't Repeat Yourself) principles, and code readability has not been prioritized. However, contributions are welcome.

このプロジェクトは教育用の学習アプリケーションであり、使い捨てのリポジトリです。コードベースは DRY 原則に従っておらず、コードの可読性も優先されていません。ただし、コントリビューションは歓迎します。

## License

MIT License. See [LICENSE](LICENSE) file for details.

## Author

Directed & Built by [yuinore](https://github.com/yuinore)
