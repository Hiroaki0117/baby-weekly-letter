-- children テーブルに gender カラムを追加
ALTER TABLE children ADD COLUMN gender text;
-- 値: 'male' / 'female' / NULL（未設定）
