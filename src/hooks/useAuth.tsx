import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

interface AuthContext {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  profile: { display_name: string; bio: string; avatar_url: string } | null;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthCtx = createContext<AuthContext>({
  user: null,
  loading: true,
  isAdmin: false,
  profile: null,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [profile, setProfile] = useState<AuthContext["profile"]>(null);

  const fetchProfile = async (uid: string) => {
    const { data } = await supabase.from("profiles").select("display_name, bio, avatar_url, is_banned").eq("user_id", uid).single();
    if (data) {
      if (data.is_banned) {
        await supabase.auth.signOut();
        setUser(null);
        setProfile(null);
        return;
      }
      setProfile(data);
    }
  };

  const fetchRole = async (uid: string) => {
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", uid);
    setIsAdmin(data?.some((r) => r.role === "admin") ?? false);
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        try {
          await fetchProfile(u.id);
          await fetchRole(u.id);
        } catch (e) {
          console.error("Error fetching user data:", e);
        }
      } else {
        setProfile(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthCtx.Provider value={{ user, loading, isAdmin, profile, signOut: () => supabase.auth.signOut().then(() => {}), refreshProfile }}>
      {children}
    </AuthCtx.Provider>
  );
}
