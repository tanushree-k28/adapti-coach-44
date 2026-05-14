import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard, Brain, Mic, FileText, BarChart3, Award, Trophy,
  Users, User, Crown, Sparkles, LogOut, GraduationCap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/app/tutor", label: "AI Tutor", icon: Brain },
  { to: "/app/voice", label: "Voice Tutor", icon: Mic },
  { to: "/app/notes", label: "Smart Notes", icon: FileText },
  { to: "/app/reports", label: "Daily Report", icon: BarChart3 },
  { to: "/app/certificates", label: "Certificates", icon: Award },
  { to: "/app/rewards", label: "Rewards & Medals", icon: Trophy },
  { to: "/app/parent", label: "Parent Dashboard", icon: Users },
  { to: "/app/features", label: "More Features", icon: Sparkles },
  { to: "/app/premium", label: "Premium", icon: Crown },
  { to: "/app/profile", label: "Profile", icon: User },
] as const;

export function AppSidebar() {
  const loc = useLocation();
  const nav = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    nav({ to: "/" });
  };

  return (
    <aside className="hidden md:flex w-64 flex-col bg-sidebar border-r border-sidebar-border min-h-screen sticky top-0">
      <div className="p-6 flex items-center gap-2">
        <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
          <GraduationCap className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <div className="font-bold text-sidebar-foreground leading-tight">NovaMentor</div>
          <div className="text-[10px] text-muted-foreground tracking-wider">ADAPTIVE AI</div>
        </div>
      </div>
      <nav className="flex-1 px-3 space-y-1">
        {items.map((it) => {
          const active = loc.pathname.startsWith(it.to);
          const Icon = it.icon;
          return (
            <Link
              key={it.to}
              to={it.to}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all",
                active
                  ? "bg-gradient-primary text-primary-foreground shadow-glow"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
            >
              <Icon className="w-4 h-4" />
              <span>{it.label}</span>
            </Link>
          );
        })}
      </nav>
      <button
        onClick={handleLogout}
        className="m-3 flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent transition-colors"
      >
        <LogOut className="w-4 h-4" /> Sign out
      </button>
    </aside>
  );
}
