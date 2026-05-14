import { createFileRoute } from "@tanstack/react-router";
import { Smile, Glasses, Gamepad2, Eye, Hand, ShieldCheck, Video, Store } from "lucide-react";

export const Route = createFileRoute("/app/features")({ component: FeaturesPage });

const upcoming = [
  { icon: Smile, title: "Emotion Detection", desc: "Webcam-based mood analysis to adapt tone & pace." },
  { icon: Glasses, title: "AR / VR Lessons", desc: "Immersive 3D learning for science & history." },
  { icon: Gamepad2, title: "Gamified Learning", desc: "Quests, XP, leaderboards and bossfights." },
  { icon: Eye, title: "Screen Reader Mode", desc: "Full accessibility for blind learners." },
  { icon: Hand, title: "Sign Language Videos", desc: "Inclusive video lessons with signing tutors." },
  { icon: ShieldCheck, title: "Exam Proctoring", desc: "AI-watched secure online assessments." },
  { icon: Video, title: "Virtual Classroom", desc: "Live workshops with real teachers." },
  { icon: Store, title: "Workshop Marketplace", desc: "Browse and book live expert sessions." },
];

function FeaturesPage() {
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">More Features</h1><p className="text-sm text-muted-foreground">Roadmap of advanced capabilities — preview the vision.</p></div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {upcoming.map((f) => (
          <div key={f.title} className="glass rounded-2xl p-6 shadow-card hover:shadow-glow transition-all">
            <div className="w-11 h-11 rounded-xl bg-gradient-primary flex items-center justify-center mb-3"><f.icon className="w-5 h-5 text-primary-foreground" /></div>
            <h3 className="font-semibold">{f.title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{f.desc}</p>
            <div className="mt-3 inline-block text-[10px] tracking-wider px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">PREVIEW</div>
          </div>
        ))}
      </div>
    </div>
  );
}
