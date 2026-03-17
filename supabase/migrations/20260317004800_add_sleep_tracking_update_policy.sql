-- 睡眠計測の開始時刻を修正できるようにUPDATEポリシーを追加
CREATE POLICY "family members can update tracking"
  ON sleep_tracking FOR UPDATE
  USING (family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid()))
  WITH CHECK (family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid()));
