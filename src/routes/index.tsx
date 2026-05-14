import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  Brain, Mic, Award, Trophy, BarChart3, Sparkles, GraduationCap,
  ShieldCheck, Languages, Users, Crown, Eye,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "NovaMentor — Adaptive AI Learning Ecosystem" },
      { name: "description", content: "An AI mentor that adapts to your pace, predicts difficulty, and personalizes every lesson." },
    ],
  }),
});

const features = [
  { icon: Brain, title: "AI Tutor", desc: "Ask any doubt, get clear step-by-step answers." },
  { icon: Mic, title: "Voice Tutor (Multilingual)", desc: "Speak in any language and learn hands-free." },
  { icon: BarChart3, title: "Adaptive Difficulty", desc: "Content tunes itself to your performance." },
  { icon: Award, title: "Auto Certificates", desc: "Earn shareable certificates as you complete topics." },
  { icon: Trophy, title: "Medals & Streaks", desc: "Bronze, Silver, Gold — gamified progress." },
  { icon: Users, title: "Parent Dashboard", desc: "Family view of growth and milestones." },
  { icon: Sparkles, title: "Smart Notes", desc: "AI generates revision notes for any topic." },
  { icon: ShieldCheck, title: "Exam Proctoring", desc: "Secure online assessments." },
  { icon: Languages, title: "Sign Language Videos", desc: "Inclusive learning for everyone." },
  { icon: Eye, title: "Screen Reader Mode", desc: "Built for visually-impaired students." },
  { icon: Crown, title: "Premium Offers", desc: "Special rewards on festivals & events." },
  { icon: GraduationCap, title: "Virtual Classroom", desc: "Live workshops and AR/VR lessons." },
];

function Landing() {
  return (
    <div className="min-h-screen">
      <header className="container mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
            <GraduationCap className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg">NovaMentor</span>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/login"><Button variant="ghost">Sign in</Button></Link>
          <Link to="/signup"><Button className="bg-gradient-primary shadow-glow">Get started</Button></Link>
        </div>
      </header>

      <section className="container mx-auto px-6 pt-16 pb-24 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-xs mb-6">
          <Sparkles className="w-3.5 h-3.5 text-primary-glow" /> Next-gen Adaptive Learning
        </div>
        <h1 className="text-5xl md:text-7xl font-bold leading-[1.05] tracking-tight">
          Your <span className="text-gradient">AI mentor</span><br />that evolves with you.
        </h1>
        <p className="mt-6 max-w-2xl mx-auto text-muted-foreground text-lg">
          NovaMentor analyzes your pace, predicts what's hard, and personalizes every lesson —
          with voice tutoring, smart notes, certificates, medals and a parent view.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link to="/signup"><Button size="lg" className="bg-gradient-primary shadow-glow text-base">Start learning free</Button></Link>
          <Link to="/login"><Button size="lg" variant="outline" className="text-base">I have an account</Button></Link>
        </div>
      </section>

      <section className="container mx-auto px-6 pb-24">
        <h2 className="text-3xl font-bold text-center mb-3">Everything a learner needs</h2>
        <p className="text-center text-muted-foreground mb-12">An entire learning ecosystem in one place.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => (
            <div key={f.title} className="glass rounded-2xl p-6 shadow-card hover:shadow-glow transition-all">
              <div className="w-11 h-11 rounded-xl bg-gradient-primary flex items-center justify-center mb-4">
                <f.icon className="w-5 h-5 text-primary-foreground" />
              </div>
              <h3 className="font-semibold text-lg">{f.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border/40 py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} NovaMentor • Adaptive Learning powered by AI
      </footer>
    </div>
  );
}
