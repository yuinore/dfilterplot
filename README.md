# Digital Filter Plotter

デジタルフィルタの極・零点配置と伝達関数を可視化するインタラクティブなWebアプリケーション

## 概要

複素平面上に極と零点を配置し、リアルタイムに伝達関数のボード線図（振幅特性・位相特性）を表示します。

## 技術スタック

- **フレームワーク**: React 19 + TypeScript + Vite
- **UI ライブラリ**: Material-UI (MUI)
- **グラフ描画**: Chart.js
- **国際化**: react-i18next (日本語・英語対応)
- **複素平面描画**: SVG

## 機能

- 複素平面上での極・零点の配置と移動（ドラッグ操作）
- 実数係数フィルタの制約（複素共役ペア）
- 極・零点の追加・削除
- ボード線図のリアルタイム表示
  - 振幅特性（dB）
  - 位相特性（度）

## 開発

```bash
# 依存関係のインストール
yarn

# 開発サーバーの起動
yarn dev

# ビルド
yarn build

# プレビュー
yarn preview
```

## アーキテクチャ / Architecture

### フィルタ設計の拡張性

新しいフィルタを追加する場合：

1. **UIコンポーネントの作成** (`src/components/filters/MyFilterPanel.tsx`)
   ```typescript
   import type { FilterPanelProps } from '../../filters/base';
   
   export const MyFilterPanel = ({ onChange, logarithmicFrequency }: FilterPanelProps) => {
     const [myParam, setMyParam] = useState(defaultValue);
     
     useEffect(() => {
       onChange({ myParam });
     }, [myParam, onChange]);
     
     return <Box>{/* UI要素 */}</Box>;
   };
   ```

2. **フィルタクラスの作成** (`src/filters/myfilter.ts`)
   ```typescript
   import type { FilterDesignBase } from './base';
   import { MyFilterPanel } from '../components/filters/MyFilterPanel';
   
   export class MyFilterDesign implements FilterDesignBase {
     id = 'myfilter';
     nameKey = 'filters.myfilter.name';
     PanelComponent = MyFilterPanel;
     
     generate(params) {
       // フィルタ生成ロジック
       return { poles, zeros, gain };
     }
   }
   ```

3. **フィルタの登録** (`src/filters/index.ts`)
   ```typescript
   import { MyFilterDesign } from './myfilter';
   FilterRegistry.register(new MyFilterDesign());
   ```

4. **翻訳の追加** (`src/locales/ja.json`, `src/locales/en.json`)
   ```json
   "filters": {
     "myfilter": {
       "name": "My Filter"
     }
   }
   ```

**設計思想:**
- **1フィルタ = 1UIコンポーネント = 1ファイル** でスケーラビリティを確保
- 各フィルタは専用のUIコンポーネントを持ち、完全に独立
- FilterRegistryによる自動検出でアプリケーションコードの変更不要

## 参考文献 / References

- [Audio EQ Cookbook by Robert Bristow-Johnson](https://webaudio.github.io/Audio-EQ-Cookbook/Audio-EQ-Cookbook.txt) - Biquad filter design equations
- [Bode Plot - Interactive Pole/Zero Placement | Control Systems Academy](https://controlsystemsacademy.com/0019/0019.html) - Interactive visualization of pole/zero placement
- [Digital Filter by Paul Falstad](https://www.falstad.com/dfilter/) - Interactive digital filter simulator

## About This Project

This is an educational learning application and a disposable repository. The codebase does not follow DRY (Don't Repeat Yourself) principles, and code readability has not been prioritized. However, contributions are welcome.

このプロジェクトは教育用の学習アプリケーションであり、使い捨てのリポジトリです。コードベースは DRY 原則に従っておらず、コードの可読性も優先されていません。ただし、コントリビューションは歓迎します。

## ライセンス

MIT
