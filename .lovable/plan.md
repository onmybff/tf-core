

# Admin Panel + Chat Rooms

## Overview

This plan adds two major features:
1. **Admin Panel** (`/admin`) -- visible only to admins, with user management (view, ban, delete) and notice overview
2. **Chat Rooms** -- replace the single group chat with multiple rooms that any user or admin can create

---

## 1. Database Changes

### New table: `chat_rooms`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | default `gen_random_uuid()` |
| name | text | required |
| created_by | uuid | references user, not null |
| created_at | timestamptz | default `now()` |

### Modify `messages` table
- Add column `room_id` (uuid, nullable initially, then backfill and make not-null or keep nullable for legacy)
- Add foreign key to `chat_rooms`

### Add `is_banned` column to `profiles`
- `is_banned boolean default false` -- used to block login/access

### RLS Policies
- `chat_rooms`: authenticated can SELECT; authenticated can INSERT with `created_by = auth.uid()`; admin can DELETE
- `messages`: existing policies stay; add room_id filter awareness
- Admin delete policies: admin can delete any user's posts, comments, messages via `has_role(auth.uid(), 'admin')`

### Enable realtime for `chat_rooms`

---

## 2. New Pages & Components

### Admin Panel (`src/pages/Admin.tsx`)
- **Users tab**: Table listing all profiles (display_name, email from profile, role, banned status). Actions: Ban/Unban toggle, Delete user (deletes profile + cascades)
- **Notices tab**: Reuse existing notice list with admin controls (already built)
- Only accessible if `isAdmin` is true; redirect otherwise

### Chat Rooms (`src/pages/Chat.tsx` -- refactor)
- **Room list view**: Shows all rooms as cards. "Create Room" button opens a simple name input
- **Room detail view**: Same KakaoTalk-style bubble chat, but scoped to `room_id`
- Real-time subscription per room

---

## 3. Navigation Updates

### Sidebar (`AppSidebar.tsx`)
- Add "Admin" link (with Shield icon) -- only visible when `isAdmin` is true

### Router (`App.tsx`)
- Add `/admin` route wrapped in `ProtectedRoute`
- Add an `AdminRoute` wrapper that also checks `isAdmin`

---

## 4. Ban Logic

- When `is_banned` is true on a profile, the `AuthProvider` will detect this and auto sign out the user with a message
- Admin can toggle ban from the admin panel by updating `profiles.is_banned`
- Need an RLS policy allowing admin to update any profile's `is_banned` field

---

## Technical Details

### Migration SQL (single migration)
```sql
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

-- Admin can read all profiles (already exists as "Anyone authenticated can read profiles")
-- Admin can read all user_roles
CREATE POLICY "Admin can read all roles" ON public.user_roles FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Enable realtime for chat_rooms
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_rooms;
```

### Files to create
- `src/pages/Admin.tsx` -- Admin panel with Users and Notices tabs

### Files to modify
- `src/pages/Chat.tsx` -- Refactor to room list + room detail views
- `src/App.tsx` -- Add `/admin` route with admin guard
- `src/components/AppSidebar.tsx` -- Add Admin nav item (admin-only)
- `src/hooks/useAuth.tsx` -- Check `is_banned` on auth state change, auto sign out if banned

