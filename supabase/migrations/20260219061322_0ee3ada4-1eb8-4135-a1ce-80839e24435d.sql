
-- Drop restrictive policies and recreate as permissive
DROP POLICY IF EXISTS "Users can read own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can insert own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can update own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can delete own conversations" ON conversations;

CREATE POLICY "Users can read own conversations" ON conversations FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own conversations" ON conversations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own conversations" ON conversations FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own conversations" ON conversations FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Also fix chat_messages policies
DROP POLICY IF EXISTS "Users can read own messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can insert own messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can delete own messages" ON chat_messages;

CREATE POLICY "Users can read own messages" ON chat_messages FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM conversations c WHERE c.id = chat_messages.conversation_id AND c.user_id = auth.uid()));
CREATE POLICY "Users can insert own messages" ON chat_messages FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM conversations c WHERE c.id = chat_messages.conversation_id AND c.user_id = auth.uid()));
CREATE POLICY "Users can delete own messages" ON chat_messages FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM conversations c WHERE c.id = chat_messages.conversation_id AND c.user_id = auth.uid()));
