# RhythmQuiz

Gemini APIが生成したメロディーを聴いて、リズムを一線譜に書き取る初級ソルフェージュ練習アプリです。

## 機能

- **メロディー生成**: Gemini 2.5 Flash Lite がキー・拍子・小節数・BPMの設定に基づいてメロディーを生成
- **再生**: Tone.js + Salamander Piano サンプラーで4拍カウントイン付き再生
- **リズム書き取り**: 八分音符・四分音符・付点四分音符をドラッグ＆ドロップで一線譜に配置
- **タイ**: タイ記号をドラッグして音符を連結し、より長い音価を表現
- **派生音**: 派生音ありモードでは、非調性音の登場位置を赤丸でマーク
- **答え合わせ**: タイ正規化後にリズムを比較し、正解リズムを並べて表示

## 技術スタック

| カテゴリ | 技術 |
|---|---|
| フレームワーク | Next.js 16 (App Router) |
| 言語 | TypeScript |
| スタイリング | Tailwind CSS v4 |
| 音楽生成 | Google Gemini 2.5 Flash Lite |
| 音声再生 | Tone.js v15 + Salamander Piano |
| 楽譜描画 | SVG (インライン) |
| DnD | HTML5 ネイティブ Drag & Drop |

## セットアップ

### 1. リポジトリをクローン

```bash
git clone https://github.com/<your-username>/RhythmQuiz.git
cd RhythmQuiz
```

### 2. 依存パッケージをインストール

```bash
npm install
```

### 3. 環境変数を設定

`.env.local` をプロジェクトルートに作成し、Gemini API キーを設定します。

```
GEMINI_API_KEY=your_api_key_here
```

Gemini API キーは [Google AI Studio](https://aistudio.google.com/) で取得できます。

### 4. 開発サーバーを起動

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) をブラウザで開いてください。

## 使い方

1. **設定**: キー・長調/短調・拍子・小節数・BPMを選択。派生音を含める場合はチェックを入れる
2. **生成**: 「メロディー生成」ボタンを押してAIにメロディーを作らせる
3. **再生**: 「再生」ボタンで4拍カウントイン後にメロディーが流れる（何度でも再生可）
4. **書き取り**: パレットから音符をドラッグして一線譜に配置。音符をクリックで削除
5. **派生音マーク**: 派生音ありの場合、赤丸記号を配置済み音符の上にドロップ
6. **答え合わせ**: 「答え合わせ」ボタンで正誤判定。正解リズムを下段に表示

## プロジェクト構成

```
src/
├── app/
│   ├── page.tsx                  # メインページ（クイズUI）
│   └── api/generate-melody/      # Gemini API ルート
├── components/
│   ├── ControlPanel.tsx          # パラメータ選択UI
│   ├── NotePalette.tsx           # ドラッグ元の音符パレット
│   └── Staff.tsx                 # SVG一線譜 + DnD
├── lib/
│   ├── gemini.ts                 # Gemini API クライアント
│   ├── tonePlayer.ts             # Tone.js 再生ロジック
│   ├── judgment.ts               # リズム正規化・判定
│   └── musicUtils.ts             # 調性・音階ユーティリティ
└── types/
    └── melody.ts                 # 型定義
```

## ライセンス

MIT
