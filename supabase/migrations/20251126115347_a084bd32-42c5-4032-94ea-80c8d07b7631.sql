-- Allow thread participants to view read status for messages in their threads
CREATE POLICY "Thread participants can view message read status"
ON message_read_status
FOR SELECT
USING (
  message_id IN (
    SELECT m.id FROM messages m
    WHERE m.thread_id IN (
      SELECT mp.thread_id 
      FROM message_participants mp
      WHERE mp.user_id = auth.uid()
    )
  )
);