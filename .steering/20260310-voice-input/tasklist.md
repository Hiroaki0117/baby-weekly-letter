# 音声入力 - タスクリスト

## タスク一覧

### 1. カスタムフック作成

- [ ] `src/hooks/use-speech-recognition.ts` を作成
  - Web Speech API の型定義（`window.SpeechRecognition` / `window.webkitSpeechRecognition`）
  - `isSupported` 判定ロジック
  - `start` / `stop` / `onresult` / `onerror` / `onend` のハンドリング
  - `transcript`（確定テキスト）と `interimTranscript`（仮テキスト）の分離
  - クリーンアップ処理（アンマウント時に `stop()`）

### 2. マイクボタンコンポーネント作成

- [ ] `src/components/log/voice-input-button.tsx` を作成
  - `useSpeechRecognition` フックを使用
  - 通常時: `Mic` アイコンボタン
  - 録音中: 赤色背景 + パルスアニメーション + `MicOff` アイコン
  - `isSupported === false` で非表示
  - エラー時に toast 表示

### 3. LogForm への統合

- [ ] `src/components/log/log-form.tsx` を変更
  - テキスト入力欄を `relative` ラッパーで囲む
  - 右端に `VoiceInputButton` を絶対配置
  - `onTranscript` コールバックで `setValue("text", ...)` により末尾追記
  - 仮テキスト（`interimTranscript`）の視覚表示（テキスト欄下部に薄いテキスト）

### 4. テスト

- [ ] `__tests__/hooks/use-speech-recognition.test.ts` を作成
  - `isSupported` 判定のテスト（`window.SpeechRecognition` の有無）
  - Web Speech API 非対応時の挙動テスト

### 5. 品質チェック・デプロイ

- [ ] `pnpm lint` 通過
- [ ] `pnpm type-check` 通過
- [ ] `pnpm test` 通過
- [ ] commit & push
