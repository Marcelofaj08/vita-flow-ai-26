import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Bell, History, Leaf, LogOut, Menu, User, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const Navbar = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!user) {
      setAvatarUrl(null);
      setIsAdmin(false);
      return;
    }
    supabase
      .from("profiles")
      .select("avatar_url")
      .eq("id", user.id)
      .maybeSingle()
      .then(async ({ data }) => {
        if (!data?.avatar_url) { setAvatarUrl(null); return; }
        const { data: signed } = await supabase.storage.from("avatars").createSignedUrl(data.avatar_url, 60 * 60);
        setAvatarUrl(signed?.signedUrl ?? null);
      });

    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle()
      .then(({ data }) => setIsAdmin(!!data));
  }, [user]);

  const menuItems = [
    { to: "/", label: "Início", end: true, auth: false },
    { to: "/history", label: "Histórico", auth: true, icon: History },
    { to: "/notifications", label: "Notificações", auth: true, icon: Bell },
    { to: "/about", label: "Sobre", auth: false },
  ];

  const linkCls = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-medium transition-colors hover:text-primary ${
      isActive ? "text-primary" : "text-muted-foreground"
    }`;

  const visibleItems = menuItems.filter((item) => !item.auth || user);
  if (isAdmin) {
    visibleItems.push({ to: "/admin", label: "Admin", auth: true, icon: UserCircle });
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-lg">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                aria-label="Abrir menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-hero">
                    <Leaf className="h-4 w-4 text-primary-foreground" />
                  </div>
                  VitaFlow
                </SheetTitle>
              </SheetHeader>
              <nav className="mt-6 flex flex-col gap-1">
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={`m-${item.to}-${item.label}`}
                      to={item.to}
                      end={item.end}
                      onClick={() => setMobileOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                          isActive
                            ? "bg-accent text-accent-foreground"
                            : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                        }`
                      }
                    >
                      {Icon && <Icon className="h-4 w-4" />}
                      {item.label}
                    </NavLink>
                  );
                })}
                {user && (
                  <Button
                    variant="ghost"
                    className="mt-3 justify-start gap-3 px-3"
                    onClick={() => {
                      setMobileOpen(false);
                      signOut().then(() => navigate("/"));
                    }}
                  >
                    <LogOut className="h-4 w-4" /> Sair
                  </Button>
                )}
              </nav>
            </SheetContent>
          </Sheet>

          <Link to="/" className="flex items-center gap-2 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-hero shadow-soft transition-transform group-hover:scale-105">
            <Leaf className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold tracking-tight">VitaFlow</span>
        </Link>
        </div>

        <nav className="hidden lg:flex items-center gap-3">
          {visibleItems.map((item) => {
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
              <Link to="/account" className="hidden sm:block">
                <Avatar className="h-8 w-8 border border-border/60 hover:ring-2 hover:ring-primary/40 transition-all">
                  <AvatarImage src={avatarUrl ?? undefined} alt="Foto de perfil" />
                  <AvatarFallback className="text-xs bg-gradient-hero text-primary-foreground">
                    {user.email?.[0]?.toUpperCase() ?? "U"}
                  </AvatarFallback>
                </Avatar>
              </Link>
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