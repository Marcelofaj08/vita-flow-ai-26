import { Link } from "react-router-dom";
import { Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Props = {
  title?: string;
  description?: string;
  cta?: string;
  variant?: "card" | "inline" | "overlay";
  children?: React.ReactNode;
};

export const PremiumBadge = () => (
  <Badge className="bg-gradient-hero text-primary-foreground border-0 gap-1">
    <Sparkles className="h-3 w-3" /> Premium
  </Badge>
);

export const PremiumLock = ({
  title = "Funcionalidade Premium",
  description = "Desbloqueia esta funcionalidade com o plano Premium.",
  cta = "Desbloquear Premium",
  variant = "card",
  children,
}: Props) => {
  if (variant === "overlay") {
    return (
      <div className="relative">
        <div className="pointer-events-none select-none blur-sm opacity-60">{children}</div>
        <div className="absolute inset-0 flex items-center justify-center bg-background/40 backdrop-blur-[2px] rounded-2xl">
          <div className="text-center p-6 rounded-2xl bg-background/90 border border-border/60 shadow-soft max-w-sm">
            <div className="mx-auto h-10 w-10 rounded-full bg-gradient-hero flex items-center justify-center mb-3">
              <Lock className="h-5 w-5 text-primary-foreground" />
            </div>
            <h3 className="font-bold">{title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
            <Button asChild className="mt-4 rounded-full bg-gradient-hero text-primary-foreground border-0">
              <Link to="/pricing"><Sparkles className="h-4 w-4 mr-1" /> {cta}</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-accent/40 p-3">
        <div className="flex items-center gap-2 text-sm">
          <Lock className="h-4 w-4 text-primary" />
          <span className="font-medium">{title}</span>
        </div>
        <Button asChild size="sm" className="rounded-full bg-gradient-hero text-primary-foreground border-0">
          <Link to="/pricing">{cta}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-dashed border-primary/40 bg-gradient-card p-6 text-center shadow-soft">
      <div className="mx-auto h-12 w-12 rounded-full bg-gradient-hero flex items-center justify-center">
        <Sparkles className="h-6 w-6 text-primary-foreground" />
      </div>
      <h3 className="mt-3 text-lg font-bold">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">{description}</p>
      <Button asChild className="mt-4 rounded-full bg-gradient-hero text-primary-foreground border-0">
        <Link to="/pricing"><Sparkles className="h-4 w-4 mr-1" /> {cta}</Link>
      </Button>
    </div>
  );
};