
-- 1. Add CHECK constraint to restrict role values
ALTER TABLE public.chat_messages ADD CONSTRAINT chat_messages_valid_role CHECK (role IN ('user', 'assistant', 'system'));

-- 2. Drop the existing overly permissive ALL policy
DROP POLICY IF EXISTS "Users can CRUD own chat messages" ON public.chat_messages;

-- 3. Create separate SELECT policy (user can read own messages)
CREATE POLICY "Users can read own chat messages"
ON public.chat_messages FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- 4. Create INSERT policy that also validates conversation ownership
CREATE POLICY "Users can insert own chat messages"
ON public.chat_messages FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND role = 'user'
  AND EXISTS (
    SELECT 1 FROM public.conversations
    WHERE conversations.id = chat_messages.conversation_id
    AND conversations.user_id = auth.uid()
  )
);

-- 5. Create UPDATE policy
CREATE POLICY "Users can update own chat messages"
ON public.chat_messages FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 6. Create DELETE policy
CREATE POLICY "Users can delete own chat messages"
ON public.chat_messages FOR DELETE TO authenticated
USING (auth.uid() = user_id);
