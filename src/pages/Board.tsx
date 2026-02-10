import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { MessageSquare, Plus, ArrowLeft, Trash2 } from "lucide-react";

interface Post {
  id: string;
  user_id: string;
  title: string;
  content: string;
  created_at: string;
  profiles: { display_name: string; avatar_url: string } | null;
}

interface Comment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles: { display_name: string } | null;
}

export default function Board() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchPosts = async () => {
    const { data } = await supabase
      .from("posts")
      .select("*, profiles!posts_user_id_fkey(display_name, avatar_url)")
      .order("created_at", { ascending: false });
    if (data) setPosts(data as any);
  };

  const fetchComments = async (postId: string) => {
    const { data } = await supabase
      .from("comments")
      .select("*, profiles!comments_user_id_fkey(display_name)")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });
    if (data) setComments(data as any);
  };

  useEffect(() => { fetchPosts(); }, []);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    await supabase.from("posts").insert({ user_id: user.id, title, content });
    setTitle(""); setContent(""); setShowForm(false);
    await fetchPosts();
    setLoading(false);
  };

  const handleDeletePost = async (postId: string) => {
    await supabase.from("posts").delete().eq("id", postId);
    setSelectedPost(null);
    await fetchPosts();
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedPost) return;
    await supabase.from("comments").insert({ user_id: user.id, post_id: selectedPost.id, content: commentText });
    setCommentText("");
    await fetchComments(selectedPost.id);
  };

  const handleDeleteComment = async (commentId: string) => {
    await supabase.from("comments").delete().eq("id", commentId);
    if (selectedPost) await fetchComments(selectedPost.id);
  };

  const openPost = (post: Post) => {
    setSelectedPost(post);
    fetchComments(post.id);
  };

  if (selectedPost) {
    return (
      <div className="mx-auto max-w-2xl p-6 animate-fade-in">
        <button onClick={() => setSelectedPost(null)} className="mb-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-xl">{selectedPost.title}</CardTitle>
            <p className="text-xs text-muted-foreground">
              {selectedPost.profiles?.display_name ?? "Unknown"} · {format(new Date(selectedPost.created_at), "MMM d, yyyy")}
            </p>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm">{selectedPost.content}</p>
            {selectedPost.user_id === user?.id && (
              <Button variant="ghost" size="sm" className="mt-4 text-destructive" onClick={() => handleDeletePost(selectedPost.id)}>
                <Trash2 className="mr-1 h-3 w-3" /> Delete Post
              </Button>
            )}
          </CardContent>
        </Card>

        <div className="mt-6">
          <h3 className="mb-3 font-display text-sm font-semibold">Comments ({comments.length})</h3>
          <div className="space-y-2">
            {comments.map((c) => (
              <div key={c.id} className="flex items-start justify-between rounded-md border p-3">
                <div>
                  <p className="text-xs font-medium">{c.profiles?.display_name ?? "Unknown"}</p>
                  <p className="text-sm">{c.content}</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(c.created_at), "MMM d, HH:mm")}</p>
                </div>
                {c.user_id === user?.id && (
                  <button onClick={() => handleDeleteComment(c.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
          <form onSubmit={handleAddComment} className="mt-3 flex gap-2">
            <Input placeholder="Write a comment..." value={commentText} onChange={(e) => setCommentText(e.target.value)} required className="flex-1" />
            <Button type="submit" size="sm">Send</Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl p-6 animate-fade-in">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Board</h1>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-1 h-4 w-4" /> New Post
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <form onSubmit={handleCreatePost} className="space-y-3">
              <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
              <Textarea placeholder="Content" value={content} onChange={(e) => setContent(e.target.value)} required rows={4} />
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={loading}>Post</Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {posts.map((post) => (
          <Card key={post.id} className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => openPost(post)}>
            <CardContent className="flex items-center justify-between py-4">
              <div>
                <h3 className="font-medium text-sm">{post.title}</h3>
                <p className="text-xs text-muted-foreground">
                  {post.profiles?.display_name ?? "Unknown"} · {format(new Date(post.created_at), "MMM d, yyyy")}
                </p>
              </div>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
        ))}
        {posts.length === 0 && <p className="text-center text-sm text-muted-foreground py-12">No posts yet. Be the first!</p>}
      </div>
    </div>
  );
}
