import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { format } from "date-fns";

interface Message {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles: { display_name: string } | null;
}

export default function Chat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    const { data } = await supabase
      .from("messages")
      .select("*, profiles!messages_user_id_fkey(display_name)")
      .order("created_at", { ascending: true })
      .limit(200);
    if (data) setMessages(data as any);
  };

  useEffect(() => {
    fetchMessages();

    const channel = supabase
      .channel("group-chat")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, async (payload) => {
        const { data } = await supabase
          .from("messages")
          .select("*, profiles!messages_user_id_fkey(display_name)")
          .eq("id", payload.new.id)
          .single();
        if (data) setMessages((prev) => [...prev, data as any]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !text.trim()) return;
    const msg = text.trim();
    setText("");
    await supabase.from("messages").insert({ user_id: user.id, content: msg });
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b px-6 py-3">
        <h1 className="font-display text-lg font-bold">Group Chat</h1>
        <p className="text-xs text-muted-foreground">{messages.length} messages</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg) => {
          const isOwn = msg.user_id === user?.id;
          return (
            <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] ${isOwn ? "" : ""}`}>
                {!isOwn && (
                  <p className="mb-1 text-xs font-medium text-muted-foreground">{msg.profiles?.display_name ?? "Unknown"}</p>
                )}
                <div className={`rounded-2xl px-4 py-2 text-sm ${isOwn ? "bg-chat-own text-chat-own-foreground rounded-br-sm" : "bg-chat-other text-chat-other-foreground rounded-bl-sm"}`}>
                  {msg.content}
                </div>
                <p className={`mt-1 text-[10px] text-muted-foreground ${isOwn ? "text-right" : "text-left"}`}>
                  {format(new Date(msg.created_at), "HH:mm")}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="border-t px-4 py-3 flex gap-2">
        <Input
          placeholder="Type a message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="flex-1"
          autoComplete="off"
        />
        <Button type="submit" size="icon" disabled={!text.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
