import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Send, Plus, ArrowLeft } from "lucide-react";
import { format } from "date-fns";

interface ChatRoom {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
}

interface Message {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  room_id: string | null;
  profiles: { display_name: string } | null;
}

export default function Chat() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [roomName, setRoomName] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const fetchRooms = async () => {
    const { data } = await supabase.from("chat_rooms").select("*").order("created_at", { ascending: false });
    if (data) setRooms(data);
  };

  useEffect(() => { fetchRooms(); }, []);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !roomName.trim()) return;
    await supabase.from("chat_rooms").insert({ name: roomName.trim(), created_by: user.id });
    setRoomName("");
    setShowCreate(false);
    await fetchRooms();
  };

  if (selectedRoom) {
    return <RoomChat room={selectedRoom} onBack={() => setSelectedRoom(null)} />;
  }

  return (
    <div className="mx-auto max-w-2xl p-6 animate-fade-in">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Chat Rooms</h1>
        <Button size="sm" onClick={() => setShowCreate(!showCreate)}>
          <Plus className="mr-1 h-4 w-4" /> New Room
        </Button>
      </div>

      {showCreate && (
        <Card className="mb-4">
          <CardContent className="pt-6">
            <form onSubmit={handleCreateRoom} className="flex gap-2">
              <Input placeholder="Room name" value={roomName} onChange={(e) => setRoomName(e.target.value)} required className="flex-1" />
              <Button type="submit" size="sm">Create</Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setShowCreate(false)}>Cancel</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {rooms.map((room) => (
          <Card key={room.id} className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => setSelectedRoom(room)}>
            <CardContent className="py-4">
              <h3 className="font-medium text-sm">{room.name}</h3>
              <p className="text-xs text-muted-foreground">{format(new Date(room.created_at), "MMM d, yyyy")}</p>
            </CardContent>
          </Card>
        ))}
        {rooms.length === 0 && <p className="text-center text-sm text-muted-foreground py-12">No chat rooms yet. Create one!</p>}
      </div>
    </div>
  );
}

function RoomChat({ room, onBack }: { room: ChatRoom; onBack: () => void }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    const { data } = await supabase
      .from("messages")
      .select("*, profiles!messages_user_id_fkey(display_name)")
      .eq("room_id", room.id)
      .order("created_at", { ascending: true })
      .limit(200);
    if (data) setMessages(data as any);
  };

  useEffect(() => {
    fetchMessages();

    const channel = supabase
      .channel(`room-${room.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `room_id=eq.${room.id}` }, async (payload) => {
        const { data } = await supabase
          .from("messages")
          .select("*, profiles!messages_user_id_fkey(display_name)")
          .eq("id", payload.new.id)
          .single();
        if (data) setMessages((prev) => [...prev, data as any]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [room.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !text.trim()) return;
    const msg = text.trim();
    setText("");
    await supabase.from("messages").insert({ user_id: user.id, content: msg, room_id: room.id });
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b px-6 py-3 flex items-center gap-3">
        <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="font-display text-lg font-bold">{room.name}</h1>
          <p className="text-xs text-muted-foreground">{messages.length} messages</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg) => {
          const isOwn = msg.user_id === user?.id;
          return (
            <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
              <div className="max-w-[75%]">
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

      <form onSubmit={handleSend} className="border-t px-4 py-3 flex gap-2">
        <Input placeholder="Type a message..." value={text} onChange={(e) => setText(e.target.value)} className="flex-1" autoComplete="off" />
        <Button type="submit" size="icon" disabled={!text.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
