import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Pin, Trash2, Edit2, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";

interface UserRow {
  user_id: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  is_banned: boolean;
  created_at: string;
  roles: string[];
}

interface Notice {
  id: string;
  user_id: string;
  title: string;
  content: string;
  is_pinned: boolean;
  created_at: string;
}

export default function Admin() {
  const { isAdmin, loading } = useAuth();

  if (loading) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading...</div>;
  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <div className="mx-auto max-w-4xl p-6 animate-fade-in">
      <h1 className="font-display text-2xl font-bold mb-6">Admin Panel</h1>
      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="notices">Notices</TabsTrigger>
        </TabsList>
        <TabsContent value="users"><UsersTab /></TabsContent>
        <TabsContent value="notices"><NoticesTab /></TabsContent>
      </Tabs>
    </div>
  );
}

function UsersTab() {
  const [users, setUsers] = useState<UserRow[]>([]);

  const fetchUsers = async () => {
    const { data: profiles } = await supabase.from("profiles").select("user_id, display_name, bio, avatar_url, is_banned, created_at");
    const { data: roles } = await supabase.from("user_roles").select("user_id, role");
    if (!profiles) return;
    const roleMap: Record<string, string[]> = {};
    roles?.forEach((r: any) => {
      if (!roleMap[r.user_id]) roleMap[r.user_id] = [];
      roleMap[r.user_id].push(r.role);
    });
    setUsers(profiles.map((p: any) => ({ ...p, roles: roleMap[p.user_id] || ["user"] })));
  };

  useEffect(() => { fetchUsers(); }, []);

  const toggleBan = async (userId: string, currentBanned: boolean) => {
    await supabase.from("profiles").update({ is_banned: !currentBanned }).eq("user_id", userId);
    await fetchUsers();
  };

  const deleteUser = async (userId: string) => {
    if (!confirm("Delete this user's profile and all their data?")) return;
    await supabase.from("messages").delete().eq("user_id", userId);
    await supabase.from("comments").delete().eq("user_id", userId);
    await supabase.from("posts").delete().eq("user_id", userId);
    await supabase.from("profiles").delete().eq("user_id", userId);
    await fetchUsers();
  };

  return (
    <div className="mt-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead>Banned</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((u) => (
            <TableRow key={u.user_id}>
              <TableCell className="font-medium">{u.display_name}</TableCell>
              <TableCell>
                {u.roles.map((r) => (
                  <Badge key={r} variant={r === "admin" ? "default" : "secondary"} className="mr-1 text-xs">
                    {r}
                  </Badge>
                ))}
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">{format(new Date(u.created_at), "MMM d, yyyy")}</TableCell>
              <TableCell>
                <Switch checked={u.is_banned} onCheckedChange={() => toggleBan(u.user_id, u.is_banned)} />
              </TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteUser(u.user_id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {users.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">No users found.</p>}
    </div>
  );
}

function NoticesTab() {
  const { user } = useAuth();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const fetchNotices = async () => {
    const { data } = await supabase.from("notices").select("*").order("is_pinned", { ascending: false }).order("created_at", { ascending: false });
    if (data) setNotices(data);
  };

  useEffect(() => { fetchNotices(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (editId) {
      await supabase.from("notices").update({ title, content }).eq("id", editId);
    } else {
      await supabase.from("notices").insert({ user_id: user.id, title, content });
    }
    setTitle(""); setContent(""); setShowForm(false); setEditId(null);
    await fetchNotices();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("notices").delete().eq("id", id);
    await fetchNotices();
  };

  const handlePin = async (id: string, pinned: boolean) => {
    await supabase.from("notices").update({ is_pinned: !pinned }).eq("id", id);
    await fetchNotices();
  };

  return (
    <div className="mt-4">
      <div className="mb-4 flex justify-end">
        <Button size="sm" onClick={() => { setShowForm(!showForm); setEditId(null); setTitle(""); setContent(""); }}>
          <Plus className="mr-1 h-4 w-4" /> New Notice
        </Button>
      </div>

      {showForm && (
        <Card className="mb-4">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-3">
              <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
              <Textarea placeholder="Content" value={content} onChange={(e) => setContent(e.target.value)} required rows={4} />
              <div className="flex gap-2">
                <Button type="submit" size="sm">{editId ? "Update" : "Publish"}</Button>
                <Button type="button" variant="outline" size="sm" onClick={() => { setShowForm(false); setEditId(null); }}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {notices.map((n) => (
          <Card key={n.id} className={n.is_pinned ? "border-foreground/20" : ""}>
            <CardContent className="py-4 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  {n.is_pinned && <Pin className="h-3 w-3 text-foreground" />}
                  <h3 className="font-medium text-sm">{n.title}</h3>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{format(new Date(n.created_at), "MMM d, yyyy")}</p>
              </div>
              <div className="flex gap-1 ml-2">
                <button onClick={() => handlePin(n.id, n.is_pinned)} className="p-1 text-muted-foreground hover:text-foreground transition-colors">
                  <Pin className="h-3 w-3" />
                </button>
                <button onClick={() => { setEditId(n.id); setTitle(n.title); setContent(n.content); setShowForm(true); }} className="p-1 text-muted-foreground hover:text-foreground transition-colors">
                  <Edit2 className="h-3 w-3" />
                </button>
                <button onClick={() => handleDelete(n.id)} className="p-1 text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
        {notices.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">No notices yet.</p>}
      </div>
    </div>
  );
}
