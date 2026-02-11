
-- Chat rooms table
CREATE TABLE public.chat_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read rooms" ON public.chat_rooms FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can create rooms" ON public.chat_rooms FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "Admin can delete rooms" ON public.chat_rooms FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Add room_id to messages
ALTER TABLE public.messages ADD COLUMN room_id uuid REFERENCES public.chat_rooms(id) ON DELETE CASCADE;

-- Add is_banned to profiles
ALTER TABLE public.profiles ADD COLUMN is_banned boolean NOT NULL DEFAULT false;

-- Admin can update any profile (for banning)
CREATE POLICY "Admin can update any profile" ON public.profiles FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Admin can delete posts, comments, messages
CREATE POLICY "Admin can delete any post" ON public.posts FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can delete any comment" ON public.comments FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can delete any message" ON public.messages FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Admin can read all roles
CREATE POLICY "Admin can read all roles" ON public.user_roles FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Enable realtime for chat_rooms
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_rooms;
