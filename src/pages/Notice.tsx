import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Pin, Plus, Trash2, Edit2 } from "lucide-react";
import { format } from "date-fns";

interface Notice {
  id: string;
  user_id: string;
  title: string;
  content: string;
  is_pinned: boolean;
  created_at: string;
}

export default function NoticePage() {
  const { isAdmin, user } = useAuth();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchNotices = async () => {
    const { data } = await supabase
      .from("notices")
      .select("*")
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false });
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

  const startEdit = (n: Notice) => {
    setEditId(n.id); setTitle(n.title); setContent(n.content); setShowForm(true);
  };

  return (
    <div className="mx-auto max-w-2xl p-6 animate-fade-in">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Notices</h1>
        {isAdmin && (
          <Button size="sm" onClick={() => { setShowForm(!showForm); setEditId(null); setTitle(""); setContent(""); }}>
            <Plus className="mr-1 h-4 w-4" /> New Notice
          </Button>
        )}
      </div>

      {isAdmin && showForm && (
        <Card className="mb-6">
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
          <Card key={n.id} className={`transition-colors ${n.is_pinned ? "border-foreground/20" : ""}`}>
            <CardContent className="py-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 cursor-pointer" onClick={() => setExpanded(expanded === n.id ? null : n.id)}>
                  <div className="flex items-center gap-2">
                    {n.is_pinned && <Pin className="h-3 w-3 text-foreground" />}
                    <h3 className="font-medium text-sm">{n.title}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{format(new Date(n.created_at), "MMM d, yyyy")}</p>
                </div>
                {isAdmin && (
                  <div className="flex gap-1 ml-2">
                    <button onClick={() => handlePin(n.id, n.is_pinned)} className="p-1 text-muted-foreground hover:text-foreground transition-colors">
                      <Pin className="h-3 w-3" />
                    </button>
                    <button onClick={() => startEdit(n)} className="p-1 text-muted-foreground hover:text-foreground transition-colors">
                      <Edit2 className="h-3 w-3" />
                    </button>
                    <button onClick={() => handleDelete(n.id)} className="p-1 text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
              {expanded === n.id && (
                <p className="mt-3 text-sm whitespace-pre-wrap border-t pt-3">{n.content}</p>
              )}
            </CardContent>
          </Card>
        ))}
        {notices.length === 0 && <p className="text-center text-sm text-muted-foreground py-12">No notices yet.</p>}
      </div>
    </div>
  );
}
