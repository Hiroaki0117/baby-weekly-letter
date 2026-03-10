# 音声入力 - 設計

## 実装アプローチ

Web Speech API（SpeechRecognition）を使ったブラウザ内音声認識。サーバーサイド処理は不要。カスタムフック `useSpeechRecognition` に認識ロジックを集約し、LogForm のテキスト入力欄にマイクボタンを追加する。

## 変更するコンポーネント・ファイル

### 新規作成

| ファイル | 用途 |
|----------|------|
| `src/hooks/use-speech-recognition.ts` | Web Speech API のカスタムフック |
| `src/components/log/voice-input-button.tsx` | マイクボタンコンポーネント |

### 変更

| ファイル | 変更内容 |
|----------|----------|
| `src/components/log/log-form.tsx` | テキスト入力欄にマイクボタンを追加 |

## 詳細設計

### 1. カスタムフック: `useSpeechRecognition`

```ts
type UseSpeechRecognitionReturn = {
  isSupported: boolean;      // ブラウザが Web Speech API に対応しているか
  isListening: boolean;      // 現在録音中か
  transcript: string;        // 確定済みテキスト
  interimTranscript: string; // 仮テキスト（認識中）
  start: () => void;         // 録音開始
  stop: () => void;          // 録音停止
  error: string | null;      // エラーメッセージ
};
```

**内部実装:**

- `SpeechRecognition` インスタンスを `useRef` で保持
- `lang: "ja-JP"`、`continuous: true`、`interimResults: true` で設定
- `onresult` で確定テキスト（`isFinal === true`）と仮テキストを分離
- `onerror` でマイク権限拒否（`not-allowed`）等のエラーをハンドリング
- `onend` で `isListening` を `false` に更新（無音での自動停止を含む）
- コンポーネントのアンマウント時に `stop()` をクリーンアップ

### 2. コンポーネント: `VoiceInputButton`

```ts
type VoiceInputButtonProps = {
  onTranscript: (text: string) => void;  // 確定テキストをフォームに渡すコールバック
  disabled?: boolean;
};
```

**UI仕様:**

- 通常時: マイクアイコン（Mic）ボタン。テキスト入力欄の右端に配置
- 録音中: 赤色背景 + パルスアニメーション + MicOff アイコンに切り替え
- アイコンは `lucide-react` の `Mic` / `MicOff` を使用
- `isSupported === false` の場合は `null` を返す（非表示）

**動作フロー:**

1. マイクボタンタップ → `start()` 呼び出し → ブラウザがマイク権限を要求
2. 音声認識開始 → `interimTranscript` がリアルタイムで更新
3. 確定テキストが生成されるたびに `onTranscript(text)` を呼び出し
4. 再度タップ or 無音 → `stop()` → 録音終了

### 3. LogForm への統合

**変更箇所:** テキスト入力欄（`Textarea`）のラッパーを `relative` な `div` にし、右端に `VoiceInputButton` を絶対配置する。

```
┌─────────────────────────────────┐
│ 今日の出来事                     │
│ ┌─────────────────────── [🎤] ┐ │
│ │ 今日は公園で遊んで…          │ │
│ │                              │ │
│ └──────────────────────────────┘ │
└─────────────────────────────────┘
```

**テキスト挿入ロジック:**

- `onTranscript` コールバックで受け取った確定テキストを、React Hook Form の `setValue("text", currentText + transcribedText)` で末尾追記
- 仮テキスト（`interimTranscript`）はフォームの値には反映せず、視覚的なインジケータ（テキスト欄下部に薄いテキストで表示）として表示

### 4. エラーハンドリング

| エラー | 対応 |
|--------|------|
| マイク権限拒否 | toast でエラーメッセージ「マイクの使用が許可されていません。ブラウザの設定を確認してください」 |
| 認識エラー（network等） | toast でエラーメッセージ「音声認識でエラーが発生しました。もう一度お試しください」 |
| 非対応ブラウザ | マイクボタンを非表示（エラーメッセージなし） |

## 影響範囲

- **既存機能への影響**: なし。テキスト入力欄の横にボタンが追加されるだけで、既存のフォーム動作は変わらない
- **データモデル**: 変更なし。音声入力の結果は通常のテキストとして `daily_logs.text` に保存される
- **API**: 変更なし。すべてブラウザ内で完結
- **テスト**: `useSpeechRecognition` フックのユニットテスト追加（Web Speech API のモックが必要なため、対応判定ロジックのみテスト対象）
