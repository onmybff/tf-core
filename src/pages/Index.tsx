import { useAuth } from "@/hooks/useAuth";

export default function Index() {
  const { profile } = useAuth();

  return (
    <div className="flex h-full flex-col items-center justify-center p-8 animate-fade-in">
      <h1 className="font-display text-5xl font-bold tracking-tight">TEAM FOCUS</h1>
      <p className="mt-3 text-lg text-muted-foreground">Virtual Entertainment Community</p>
      {profile && (
        <p className="mt-6 text-sm text-muted-foreground">
          Welcome back, <span className="font-medium text-foreground">{profile.display_name || "User"}</span>
        </p>
      )}
    </div>
  );
}
