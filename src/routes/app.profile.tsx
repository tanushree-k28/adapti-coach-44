import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Camera, ScanFace } from "lucide-react";

export const Route = createFileRoute("/app/profile")({ component: ProfilePage });

function ProfilePage() {
  const [profile, setProfile] = useState({ display_name: "", school: "", grade: "", bio: "", avatar_url: "" });
  const [loading, setLoading] = useState(false);
  const [faceVerified, setFaceVerified] = useState(false);
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data } = await supabase.from("profiles").select("*").eq("id", u.user.id).maybeSingle();
      if (data) setProfile({ display_name: data.display_name ?? "", school: data.school ?? "", grade: data.grade ?? "", bio: data.bio ?? "", avatar_url: data.avatar_url ?? "" });
    })();
    return () => streamRef.current?.getTracks().forEach((t) => t.stop());
  }, []);

  const save = async () => {
    setLoading(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { error } = await supabase.from("profiles").update({ ...profile, updated_at: new Date().toISOString() }).eq("id", u.user.id);
    setLoading(false);
    if (error) toast.error(error.message); else toast.success("Profile saved");
  };

  const startFaceAuth = async () => {
    try {
      setScanning(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
      setTimeout(() => {
        stream.getTracks().forEach((t) => t.stop());
        setScanning(false); setFaceVerified(true); toast.success("Face verified ✓");
      }, 2500);
    } catch { setScanning(false); toast.error("Camera access denied"); }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Profile</h1>

      <div className="glass rounded-2xl p-6 shadow-card space-y-4">
        <div><Label>Display name</Label><Input value={profile.display_name} onChange={(e) => setProfile({ ...profile, display_name: e.target.value })} /></div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div><Label>School</Label><Input value={profile.school} onChange={(e) => setProfile({ ...profile, school: e.target.value })} /></div>
          <div><Label>Grade</Label><Input value={profile.grade} onChange={(e) => setProfile({ ...profile, grade: e.target.value })} /></div>
        </div>
        <div><Label>Bio</Label><Textarea rows={3} value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} /></div>
        <div><Label>Avatar URL</Label><Input value={profile.avatar_url} onChange={(e) => setProfile({ ...profile, avatar_url: e.target.value })} placeholder="https://…" /></div>
        <Button onClick={save} disabled={loading} className="bg-gradient-primary shadow-glow">{loading ? "Saving…" : "Save profile"}</Button>
      </div>

      <div className="glass rounded-2xl p-6 shadow-card">
        <h2 className="font-semibold mb-2 flex items-center gap-2"><ScanFace className="w-5 h-5 text-primary-glow" /> Face Authentication (Beta)</h2>
        <p className="text-sm text-muted-foreground mb-3">Live camera-based identity check. Demo flow — for production, integrate a face-recognition model.</p>
        <video ref={videoRef} className={`w-full max-w-sm rounded-xl mb-3 ${scanning ? "block" : "hidden"}`} muted playsInline />
        <Button onClick={startFaceAuth} disabled={scanning} className="bg-gradient-primary shadow-glow">
          <Camera className="w-4 h-4 mr-2" /> {scanning ? "Scanning…" : faceVerified ? "Re-verify" : "Verify with Face"}
        </Button>
        {faceVerified && <p className="text-sm text-primary-glow mt-2">✓ Identity verified</p>}
      </div>
    </div>
  );
}
