-- mood の選択肢を 3択 → 5択 に拡張
-- 追加: moved（感動した）, tired（疲れた）

ALTER TABLE daily_logs
  DROP CONSTRAINT daily_logs_mood_check;

ALTER TABLE daily_logs
  ADD CONSTRAINT daily_logs_mood_check
  CHECK (mood IN ('moved', 'happy', 'neutral', 'tired', 'sad'));
