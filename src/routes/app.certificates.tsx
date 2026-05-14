import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Award, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/app/certificates")({ component: CertPage });

function CertPage() {
  const [name, setName] = useState("");
  const [topic, setTopic] = useState("Adaptive Learning Foundations");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const dn = (data.user?.user_metadata as any)?.display_name || data.user?.email?.split("@")[0] || "Learner";
      setName(dn);
    });
  }, []);

  const download = () => {
    const svg = document.getElementById("cert-svg") as unknown as SVGSVGElement | null;
    if (!svg) return;
    const blob = new Blob([new XMLSerializer().serializeToString(svg)], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `certificate-${topic}.svg`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold flex items-center gap-2"><Award className="w-6 h-6 text-primary-glow" /> Certificates</h1><p className="text-sm text-muted-foreground">Auto-generated when you complete a topic.</p></div>

      <div className="glass rounded-2xl p-4 shadow-card">
        <div className="grid sm:grid-cols-2 gap-3 mb-4">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
          <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Topic" />
        </div>
        <div className="bg-background rounded-xl overflow-hidden">
          <svg id="cert-svg" viewBox="0 0 800 560" className="w-full">
            <defs>
              <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#1a0b2e" /><stop offset="1" stopColor="#3b1d5b" />
              </linearGradient>
            </defs>
            <rect width="800" height="560" fill="url(#g)" />
            <rect x="20" y="20" width="760" height="520" fill="none" stroke="#a855f7" strokeWidth="2" rx="20" />
            <text x="400" y="110" textAnchor="middle" fill="#e9d5ff" fontSize="22" fontFamily="serif">NovaMentor</text>
            <text x="400" y="180" textAnchor="middle" fill="#fff" fontSize="42" fontWeight="bold">Certificate of Achievement</text>
            <text x="400" y="240" textAnchor="middle" fill="#c4b5fd" fontSize="16">This certifies that</text>
            <text x="400" y="300" textAnchor="middle" fill="#fff" fontSize="36" fontWeight="bold">{name || "Learner"}</text>
            <text x="400" y="350" textAnchor="middle" fill="#c4b5fd" fontSize="16">has successfully completed</text>
            <text x="400" y="395" textAnchor="middle" fill="#f0abfc" fontSize="24" fontWeight="600">{topic}</text>
            <text x="400" y="490" textAnchor="middle" fill="#a78bfa" fontSize="13">{new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}</text>
          </svg>
        </div>
        <Button onClick={download} className="mt-4 bg-gradient-primary shadow-glow"><Download className="w-4 h-4 mr-2" /> Download Certificate</Button>
      </div>
    </div>
  );
}
