import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  GraduationCap, User, Phone, Cake, School, BookOpen, Mail, Lock,
  ArrowRight, ArrowLeft, Sparkles, CheckCircle2, Rocket,
} from "lucide-react";

export const Route = createFileRoute("/signup")({ component: SignupPage });

const schema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 chars").max(60),
  phone: z.string().trim().regex(/^[+\d][\d\s\-()]{6,18}$/, "Enter a valid phone number"),
  age: z.coerce.number().int().min(8, "Min age is 8").max(100, "Max age is 100"),
  college: z.string().trim().min(2, "College required").max(100),
  course: z.string().trim().min(2, "Course required").max(80),
  email: z.string().trim().email("Invalid email").max(255),
  password: z.string().min(6, "Min 6 characters").max(72),
});

type Field = {
  key: keyof typeof initial;
  label: string;
  placeholder: string;
  icon: React.ElementType;
  type?: string;
  hint: string;
};

const initial = { name: "", phone: "", age: "", college: "", course: "", email: "", password: "" };

const steps: Field[][] = [
  [
    { key: "name", label: "What should we call you?", placeholder: "Aanya Sharma", icon: User, hint: "Your display name across NovaMentor." },
    { key: "phone", label: "Your phone number", placeholder: "+91 98765 43210", icon: Phone, hint: "Used for OTP & parent alerts." },
  ],
  [
    { key: "age", label: "How old are you?", placeholder: "16", icon: Cake, type: "number", hint: "We tune the AI tutor's tone to your age." },
    { key: "college", label: "School / College", placeholder: "Nova Institute of Technology", icon: School, hint: "Shown on certificates." },
    { key: "course", label: "Course you're studying", placeholder: "B.Tech CSE · Class 11 PCM · etc.", icon: BookOpen, hint: "Personalises your learning path." },
  ],
  [
    { key: "email", label: "Your email", placeholder: "you@example.com", icon: Mail, type: "email", hint: "Used to sign in." },
    { key: "password", label: "Create a password", placeholder: "At least 6 characters", icon: Lock, type: "password", hint: "Keep it strong — it protects your progress." },
  ],
];

function SignupPage() {
  const nav = useNavigate();
  const [data, setData] = useState(initial);
  const [stepIdx, setStepIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const step = steps[stepIdx];
  const totalSteps = steps.length;
  const percent = Math.round(((stepIdx + 1) / (totalSteps + 1)) * 100);

  const update = (k: keyof typeof initial, v: string) => {
    setData((d) => ({ ...d, [k]: v }));
    setErrors((e) => ({ ...e, [k]: "" }));
  };

  const validateStep = () => {
    const partial: Record<string, any> = {};
    step.forEach((f) => (partial[f.key] = data[f.key]));
    const stepSchema = z.object(
      Object.fromEntries(step.map((f) => [f.key, (schema.shape as any)[f.key]])) as any
    );
    const result = stepSchema.safeParse(partial);
    if (!result.success) {
      const errs: Record<string, string> = {};
      result.error.issues.forEach((i) => (errs[String(i.path[0])] = i.message));
      setErrors(errs);
      return false;
    }
    return true;
  };

  const next = () => { if (validateStep()) setStepIdx((i) => Math.min(i + 1, totalSteps - 1)); };
  const back = () => setStepIdx((i) => Math.max(0, i - 1));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep()) return;
    const parsed = schema.safeParse(data);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach((i) => (errs[String(i.path[0])] = i.message));
      setErrors(errs);
      toast.error("Please fix the highlighted fields");
      return;
    }
    setLoading(true);
    const v = parsed.data;
    const { data: signUp, error } = await supabase.auth.signUp({
      email: v.email,
      password: v.password,
      options: {
        emailRedirectTo: `${window.location.origin}/app/dashboard`,
        data: { display_name: v.name },
      },
    });
    if (error) { setLoading(false); return toast.error(error.message); }

    // Save extended profile details (profile row is created by trigger)
    const uid = signUp.user?.id;
    if (uid) {
      await supabase.from("profiles").update({
        display_name: v.name,
        phone: v.phone,
        age: v.age,
        school: v.college,
        course: v.course,
      }).eq("id", uid);
    }

    setLoading(false);
    toast.success("Welcome to NovaMentor 🚀");
    nav({ to: "/app/dashboard" });
  };

  const isLast = stepIdx === totalSteps - 1;

  return (
    <div className="relative min-h-screen overflow-hidden flex items-center justify-center p-4">
      {/* Cosmic background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-[#1a0b2e] to-background" />
      <div className="absolute inset-0 opacity-40"
        style={{ backgroundImage: "radial-gradient(circle at 20% 30%, hsl(280 90% 60% / .4), transparent 40%), radial-gradient(circle at 80% 70%, hsl(260 90% 50% / .35), transparent 45%)" }} />
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 40 }).map((_, i) => (
          <div key={i} className="absolute w-1 h-1 rounded-full bg-white/60 animate-pulse"
            style={{
              top: `${(i * 37) % 100}%`,
              left: `${(i * 53) % 100}%`,
              animationDelay: `${(i % 7) * 0.3}s`,
              opacity: 0.3 + ((i % 5) * 0.15),
            }} />
        ))}
      </div>

      <div className="relative w-full max-w-xl">
        <div className="glass rounded-3xl p-6 sm:p-8 shadow-card border border-white/10">
          <Link to="/" className="flex items-center gap-2 justify-center mb-5">
            <div className="w-11 h-11 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
              <GraduationCap className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl tracking-tight">NovaMentor</span>
          </Link>

          {/* Stepper */}
          <div className="flex items-center gap-2 mb-6">
            {steps.map((_, i) => (
              <div key={i} className="flex-1 flex items-center gap-2">
                <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-all
                  ${i < stepIdx ? "bg-primary-glow text-primary-foreground" :
                    i === stepIdx ? "bg-gradient-primary text-primary-foreground shadow-glow scale-110" :
                    "bg-muted text-muted-foreground"}`}>
                  {i < stepIdx ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                </div>
                {i < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 ${i < stepIdx ? "bg-primary-glow" : "bg-muted"}`} />
                )}
              </div>
            ))}
          </div>

          <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
            <span>Step {stepIdx + 1} of {totalSteps}</span>
            <span>{percent}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden mb-6">
            <div className="h-full bg-gradient-primary transition-all duration-500" style={{ width: `${percent}%` }} />
          </div>

          {/* Heading */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 text-xs px-3 py-1 rounded-full bg-primary/20 text-primary-glow mb-2">
              <Sparkles className="w-3 h-3" /> Onboarding
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold">
              {stepIdx === 0 && <>Let's get to know <span className="bg-gradient-primary bg-clip-text text-transparent">you</span></>}
              {stepIdx === 1 && <>Tell us where you <span className="bg-gradient-primary bg-clip-text text-transparent">learn</span></>}
              {stepIdx === 2 && <>Last step — secure your <span className="bg-gradient-primary bg-clip-text text-transparent">account</span></>}
            </h1>
          </div>

          <form onSubmit={submit} className="space-y-5">
            {step.map((f) => {
              const Icon = f.icon;
              const err = errors[f.key];
              return (
                <div key={f.key} className="space-y-1.5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <Label htmlFor={f.key} className="text-sm">{f.label}</Label>
                  <div className={`relative group rounded-xl border transition-all
                    ${err ? "border-destructive" : "border-white/10 focus-within:border-primary-glow focus-within:shadow-glow"}`}>
                    <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-glow" />
                    <Input
                      id={f.key}
                      type={f.type ?? "text"}
                      placeholder={f.placeholder}
                      value={data[f.key]}
                      onChange={(e) => update(f.key, e.target.value)}
                      className="pl-10 bg-transparent border-0 focus-visible:ring-0 h-12"
                      autoFocus={f === step[0]}
                    />
                  </div>
                  {err ? (
                    <p className="text-xs text-destructive">{err}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">{f.hint}</p>
                  )}
                </div>
              );
            })}

            <div className="flex gap-2 pt-2">
              {stepIdx > 0 && (
                <Button type="button" variant="secondary" onClick={back} className="flex-1">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>
              )}
              {!isLast ? (
                <Button type="button" onClick={next} className="flex-1 bg-gradient-primary shadow-glow h-11">
                  Continue <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button type="submit" disabled={loading} className="flex-1 bg-gradient-primary shadow-glow h-11">
                  {loading ? "Launching…" : <>Launch my journey <Rocket className="w-4 h-4 ml-2" /></>}
                </Button>
              )}
            </div>
          </form>

          <p className="text-sm text-center mt-6 text-muted-foreground">
            Already orbiting? <Link to="/login" className="text-primary-glow hover:underline">Sign in</Link>
          </p>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          By continuing you agree to NovaMentor's terms & privacy policy.
        </p>
      </div>
    </div>
  );
}
