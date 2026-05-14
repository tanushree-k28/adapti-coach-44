import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Video, VideoOff, Mic as MicIcon, MicOff, Send, Users, MonitorUp } from "lucide-react";

export const Route = createFileRoute("/app/classroom")({ component: ClassroomPage });

type Msg = { id: string; user_id: string; display_name: string | null; body: string; created_at: string };

function ClassroomPage() {
  const [room] = useState("main");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const [me, setMe] = useState<{ id: string; name: string } | null>(null);
  const [camOn, setCamOn] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [participants, setParticipants] = useState(1);
  const videoRef = useRef<HTMLVideoElement>(null);
  const screenRef = useRef<HTMLVideoElement>(null);
  const camStream = useRef<MediaStream | null>(null);
  const screenStream = useRef<MediaStream | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data: p } = await supabase.from("profiles").select("display_name").eq("id", u.user.id).maybeSingle();
      setMe({ id: u.user.id, name: p?.display_name ?? u.user.email ?? "Student" });

      const { data } = await supabase
        .from("classroom_messages")
        .select("*")
        .eq("room", room)
        .order("created_at", { ascending: true })
        .limit(200);
      if (data) setMessages(data as Msg[]);
    })();

    const channel = supabase
      .channel(`classroom:${room}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "classroom_messages", filter: `room=eq.${room}` },
        (payload) => setMessages((m) => [...m, payload.new as Msg]))
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        setParticipants(Object.keys(state).length || 1);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ online_at: new Date().toISOString() });
        }
      });

    return () => {
      supabase.removeChannel(channel);
      camStream.current?.getTracks().forEach((t) => t.stop());
      screenStream.current?.getTracks().forEach((t) => t.stop());
    };
  }, [room]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!draft.trim() || !me) return;
    const body = draft.trim();
    setDraft("");
    const { error } = await supabase.from("classroom_messages").insert({
      room, user_id: me.id, display_name: me.name, body,
    });
    if (error) toast.error(error.message);
  };

  const toggleCam = async () => {
    if (camOn) {
      camStream.current?.getTracks().forEach((t) => t.stop());
      camStream.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
      setCamOn(false);
      return;
    }
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: micOn });
      camStream.current = s;
      if (videoRef.current) { videoRef.current.srcObject = s; await videoRef.current.play(); }
      setCamOn(true);
    } catch { toast.error("Camera blocked"); }
  };

  const toggleMic = () => {
    if (!camStream.current) { setMicOn(!micOn); return; }
    camStream.current.getAudioTracks().forEach((t) => (t.enabled = !micOn));
    setMicOn(!micOn);
  };

  const shareScreen = async () => {
    try {
      const s = await (navigator.mediaDevices as any).getDisplayMedia({ video: true });
      screenStream.current = s;
      if (screenRef.current) { screenRef.current.srcObject = s; await screenRef.current.play(); }
      s.getVideoTracks()[0].onended = () => {
        screenStream.current = null;
        if (screenRef.current) screenRef.current.srcObject = null;
      };
    } catch { toast.error("Screen share cancelled"); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Virtual Classroom</h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="w-4 h-4" /> {participants} live
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-4">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="aspect-video rounded-2xl bg-black/60 glass overflow-hidden relative">
              <video ref={videoRef} muted playsInline className="w-full h-full object-cover" />
              {!camOn && <div className="absolute inset-0 grid place-items-center text-muted-foreground text-sm">Your camera is off</div>}
              <div className="absolute bottom-2 left-2 text-xs bg-black/60 px-2 py-1 rounded">{me?.name ?? "You"}</div>
            </div>
            <div className="aspect-video rounded-2xl bg-black/60 glass overflow-hidden relative">
              <video ref={screenRef} muted playsInline className="w-full h-full object-contain" />
              <div className="absolute inset-0 grid place-items-center text-muted-foreground text-sm pointer-events-none">
                {screenStream.current ? "" : "Shared screen will appear here"}
              </div>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button onClick={toggleCam} variant={camOn ? "default" : "secondary"} className={camOn ? "bg-gradient-primary" : ""}>
              {camOn ? <Video className="w-4 h-4 mr-2" /> : <VideoOff className="w-4 h-4 mr-2" />} Camera
            </Button>
            <Button onClick={toggleMic} variant={micOn ? "default" : "secondary"} className={micOn ? "bg-gradient-primary" : ""}>
              {micOn ? <MicIcon className="w-4 h-4 mr-2" /> : <MicOff className="w-4 h-4 mr-2" />} Mic
            </Button>
            <Button onClick={shareScreen} variant="secondary">
              <MonitorUp className="w-4 h-4 mr-2" /> Share screen
            </Button>
          </div>
        </div>

        <div className="glass rounded-2xl flex flex-col h-[500px]">
          <div className="p-3 border-b border-border/40 font-semibold text-sm">Live chat — #{room}</div>
          <div ref={listRef} className="flex-1 overflow-y-auto p-3 space-y-2">
            {messages.map((m) => (
              <div key={m.id} className={`text-sm ${m.user_id === me?.id ? "text-right" : ""}`}>
                <div className="text-[10px] text-muted-foreground">{m.display_name ?? "anon"}</div>
                <div className={`inline-block px-3 py-1.5 rounded-2xl ${m.user_id === me?.id ? "bg-gradient-primary text-primary-foreground" : "bg-muted"}`}>
                  {m.body}
                </div>
              </div>
            ))}
            {!messages.length && <div className="text-sm text-muted-foreground text-center mt-8">Be the first to say hello 👋</div>}
          </div>
          <div className="p-2 border-t border-border/40 flex gap-2">
            <Input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Type a message…" />
            <Button onClick={send} size="icon" className="bg-gradient-primary"><Send className="w-4 h-4" /></Button>
          </div>
        </div>
      </div>
    </div>
  );
}
