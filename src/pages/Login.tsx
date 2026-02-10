import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";

const INVITE_CODE = "TF1";

export default function Login() {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (isSignup) {
      if (inviteCode !== INVITE_CODE) {
        setError("Invalid code");
        setLoading(false);
        return;
      }
      const { error: err } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: { display_name: displayName || "User" },
        },
      });
      if (err) { setError(err.message); setLoading(false); return; }
      navigate("/");
    } else {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) { setError(err.message); setLoading(false); return; }
      navigate("/");
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm animate-fade-in">
        <h1 className="mb-1 text-center font-display text-3xl font-bold tracking-tight">TEAM FOCUS</h1>
        <p className="mb-8 text-center text-sm text-muted-foreground">Virtual Entertainment Community</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignup && (
            <>
              <Input placeholder="Display Name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
              <Input placeholder="Invite Code" value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} required />
            </>
          )}
          <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "..." : isSignup ? "Sign Up" : "Log In"}
          </Button>
        </form>

        <button
          type="button"
          onClick={() => { setIsSignup(!isSignup); setError(""); }}
          className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {isSignup ? "Already have an account? Log in" : "Need an account? Sign up"}
        </button>
      </div>
    </div>
  );
}
