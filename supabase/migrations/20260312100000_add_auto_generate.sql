-- report_preferences に自動生成フラグを追加（デフォルト有効）
ALTER TABLE report_preferences
  ADD COLUMN auto_generate boolean NOT NULL DEFAULT true;
