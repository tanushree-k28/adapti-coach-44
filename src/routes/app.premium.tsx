import { createFileRoute } from "@tanstack/react-router";
import { Crown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/app/premium")({ component: PremiumPage });

function PremiumPage() {
  const plans = [
    { name: "Free", price: "$0", features: ["AI Tutor (limited)", "Daily report", "Basic certificates"] },
    { name: "Pro", price: "$9/mo", features: ["Unlimited AI Tutor", "Voice tutor in any language", "Smart notes", "Priority support"], featured: true },
    { name: "Family", price: "$19/mo", features: ["Up to 5 learners", "Parent dashboard", "All Pro features", "AR/VR lessons"] },
  ];
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow"><Crown className="w-5 h-5 text-primary-foreground" /></div>
        <div><h1 className="text-2xl font-bold">Premium Plans</h1><p className="text-sm text-muted-foreground">Unlock the full NovaMentor experience.</p></div>
      </div>
      <div className="grid sm:grid-cols-3 gap-4">
        {plans.map((p) => (
          <div key={p.name} className={`glass rounded-2xl p-6 shadow-card ${p.featured ? "ring-2 ring-primary shadow-glow" : ""}`}>
            {p.featured && <div className="text-xs uppercase tracking-wider text-primary-glow mb-2">Most popular</div>}
            <h3 className="font-bold text-xl">{p.name}</h3>
            <div className="text-3xl font-bold mt-2 text-gradient">{p.price}</div>
            <ul className="mt-4 space-y-2 text-sm">{p.features.map((f) => (<li key={f} className="flex items-center gap-2"><Check className="w-4 h-4 text-primary-glow" />{f}</li>))}</ul>
            <Button onClick={() => toast.info("Payments integration coming soon")} className="w-full mt-5 bg-gradient-primary shadow-glow">Choose {p.name}</Button>
          </div>
        ))}
      </div>
      <p className="text-center text-xs text-muted-foreground">Festival promos: 🎉 Diwali 30% off • 🎄 Holiday bundles • 🎓 Student discount</p>
    </div>
  );
}
