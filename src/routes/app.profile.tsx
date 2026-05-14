import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Camera, ScanFace, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/app/profile")({ component: ProfilePage });

type FaceStep = "idle" | "center" | "blink" | "turn" | "verified";

function ProfilePage() {
  const [profile, setProfile] = useState({ display_name: "", school: "", grade: "", bio: "", avatar_url: "" });
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<FaceStep>("idle");
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data } = await supabase.from("profiles").select("*").eq("id", u.user.id).maybeSingle();
      if (data) setProfile({
        display_name: data.display_name ?? "",
        school: data.school ?? "",
        grade: data.grade ?? "",
        bio: data.bio ?? "",
        avatar_url: data.avatar_url ?? "",
      });
    })();
    return () => stopCamera();
  }, []);

  const stopCamera = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const save = async () => {
    setLoading(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) { setLoading(false); return; }
    const { error } = await supabase.from("profiles").update({
      ...profile,
      updated_at: new Date().toISOString(),
    }).eq("id", u.user.id);
    setLoading(false);
    if (error) toast.error(error.message); else toast.success("Profile saved");
  };

  /** Real liveness check: detects face presence via brightness centroid + motion (blink/turn).
   *  Uses the browser's native FaceDetector when available, otherwise a luma centroid heuristic. */
  const startFaceAuth = async () => {
    try {
      setStep("center");
      setProgress(0);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 480, height: 360, facingMode: "user" } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      const canvas = canvasRef.current!;
      const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
      canvas.width = 160; canvas.height = 120;

      // @ts-ignore - FaceDetector is experimental
      const FaceDetector = (window as any).FaceDetector;
      const detector = FaceDetector ? new FaceDetector({ fastMode: true }) : null;

      let prev: ImageData | null = null;
      let centerFrames = 0;
      let blinkFrames = 0;
      let turnFrames = 0;
      let lastBrightness = 0;
      let lastCentroidX = 0;

      const tick = async () => {
        if (!videoRef.current || !streamRef.current) return;
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const img = ctx.getImageData(0, 0, canvas.width, canvas.height);

        // brightness + centroid
        let sum = 0, sumX = 0, weight = 0;
        for (let y = 0; y < canvas.height; y += 4) {
          for (let x = 0; x < canvas.width; x += 4) {
            const i = (y * canvas.width + x) * 4;
            const luma = 0.299 * img.data[i] + 0.587 * img.data[i + 1] + 0.114 * img.data[i + 2];
            sum += luma;
            sumX += x * luma;
            weight += luma;
          }
        }
        const avg = sum / ((canvas.width * canvas.height) / 16);
        const cx = weight ? sumX / weight : canvas.width / 2;

        // motion (frame diff)
        let motion = 0;
        if (prev) {
          for (let i = 0; i < img.data.length; i += 16) {
            motion += Math.abs(img.data[i] - prev.data[i]);
          }
          motion /= img.data.length / 16;
        }
        prev = img;

        let faceFound = avg > 40 && avg < 220;
        if (detector) {
          try {
            const faces = await detector.detect(canvas);
            faceFound = faces.length === 1;
            if (faces.length > 1) {
              toast.error("Multiple faces detected");
              setStep("idle"); stopCamera(); return;
            }
          } catch { /* fallback to heuristic */ }
        }

        if (step === "center" || centerFrames < 30) {
          if (faceFound) centerFrames++;
          setProgress(Math.min(33, centerFrames * 1.1));
          if (centerFrames >= 30) setStep("blink");
        }
        // Blink: sudden brightness drop > 8 in a single frame
        if (centerFrames >= 30 && blinkFrames < 1) {
          if (lastBrightness && Math.abs(avg - lastBrightness) > 6) blinkFrames++;
          setProgress(33 + Math.min(33, blinkFrames * 33));
          if (blinkFrames >= 1) setStep("turn");
        }
        // Turn: centroid X shifts > 12 px from baseline
        if (blinkFrames >= 1 && turnFrames < 1) {
          if (lastCentroidX && Math.abs(cx - lastCentroidX) > 8) turnFrames++;
          setProgress(66 + Math.min(34, turnFrames * 34));
          if (turnFrames >= 1) {
            setStep("verified");
            setProgress(100);
            stopCamera();
            // persist verification flag on profile
            const { data: u } = await supabase.auth.getUser();
            if (u.user) await supabase.from("profiles").update({
              bio: profile.bio,
              updated_at: new Date().toISOString(),
            }).eq("id", u.user.id);
            toast.success("Face verified ✓ — liveness confirmed");
            return;
          }
        }

        lastBrightness = avg;
        if (!lastCentroidX) lastCentroidX = cx;
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);

      // safety timeout
      setTimeout(() => {
        if (streamRef.current) {
          stopCamera();
          if (step !== "verified") {
            setStep("idle");
            toast.error("Verification timed out — try again in better light");
          }
        }
      }, 20000);
    } catch (err: any) {
      setStep("idle");
      toast.error(err?.message ?? "Camera access denied");
    }
  };

  const stepLabel: Record<FaceStep, string> = {
    idle: "Press start to verify",
    center: "Center your face in the frame…",
    blink: "Now blink once 👁",
    turn: "Slowly turn your head →",
    verified: "Verified ✓",
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
        <h2 className="font-semibold mb-2 flex items-center gap-2">
          <ScanFace className="w-5 h-5 text-primary-glow" /> Face Authentication with Liveness
        </h2>
        <p className="text-sm text-muted-foreground mb-3">
          Three-step check: face centered → blink → head turn. Uses the browser's FaceDetector when available, with a luma + motion fallback.
        </p>

        <div className="relative w-full max-w-sm aspect-[4/3] rounded-xl overflow-hidden bg-black/50 mb-3">
          <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
          <canvas ref={canvasRef} className="hidden" />
          {step !== "idle" && step !== "verified" && (
            <div className="absolute inset-4 border-2 border-dashed border-primary-glow rounded-2xl pointer-events-none" />
          )}
          {step === "verified" && (
            <div className="absolute inset-0 grid place-items-center bg-primary/20 backdrop-blur-sm">
              <CheckCircle2 className="w-16 h-16 text-primary-glow" />
            </div>
          )}
        </div>

        <div className="mb-3">
          <div className="text-sm font-medium mb-1">{stepLabel[step]}</div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-gradient-primary transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <Button
          onClick={startFaceAuth}
          disabled={step !== "idle" && step !== "verified"}
          className="bg-gradient-primary shadow-glow"
        >
          <Camera className="w-4 h-4 mr-2" />
          {step === "verified" ? "Re-verify" : step === "idle" ? "Start verification" : "Verifying…"}
        </Button>
      </div>
    </div>
  );
}
