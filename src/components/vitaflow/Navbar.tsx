import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Bot, CalendarDays, History, Leaf, LogOut, Salad, User, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const Navbar = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeRoutineId, setActiveRoutineId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { setActiveRoutineId(null); return; }
    (supabase as any)
      .from("health_profiles")
      .select("active_routine_id")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }: any) => setActiveRoutineId(data?.active_routine_id ?? null));
  }, [user]);

  const routineHref = activeRoutineId ? `/result?id=${activeRoutineId}&tab=week` : "/history";
  const mealsHref = activeRoutineId ? `/result?id=${activeRoutineId}&tab=meals` : "/history";
  const menuItems = [
    { to: "/", label: "Início", end: true, auth: false },
    { to: "/account", label: "Perfil", auth: true },
    { to: "/history", label: "Histórico", auth: true, icon: History },
    { to: "/account?tab=chat", label: "Chat", auth: true, icon: Bot },
    { to: routineHref, label: "Rotina da semana", auth: true, icon: CalendarDays },
    { to: mealsHref, label: "Plano alimentar", auth: true, icon: Salad },
    { to: "/about", label: "Sobre nós", auth: false },
    { to: "/account", label: "Conta", auth: true, icon: UserCircle },
  ];

  const linkCls = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-medium transition-colors hover:text-primary ${
      isActive ? "text-primary" : "text-muted-foreground"
    }`;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-lg">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-hero shadow-soft transition-transform group-hover:scale-105">
            <Leaf className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold tracking-tight">VitaFlow</span>
        </Link>

        <nav className="hidden lg:flex items-center gap-3">
          {menuItems.filter((item) => !item.auth || user).map((item) => {
            const Icon = item.icon;
            return (
              <NavLink key={`${item.to}-${item.label}`} to={item.to} end={item.end} className={linkCls}>
                <span className="inline-flex items-center gap-1.5">
                  {Icon && <Icon className="h-3.5 w-3.5" />}
                  {item.label}
                </span>
              </NavLink>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span className="max-w-[140px] truncate">{user.email}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => signOut().then(() => navigate("/"))}>
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button variant="default" size="sm" onClick={() => navigate("/auth")}>
              Entrar
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};