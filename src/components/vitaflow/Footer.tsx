import { Link } from "react-router-dom";
import { Leaf } from "lucide-react";

export const Footer = () => (
  <footer className="border-t border-border/40 bg-muted/30 mt-20">
    <div className="container py-12 grid gap-8 md:grid-cols-3">
      <div>
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-hero">
            <Leaf className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-bold">VitaFlow</span>
        </Link>
        <p className="mt-3 text-sm text-muted-foreground max-w-xs">
          O teu assistente pessoal de saúde e organização, com inteligência artificial.
        </p>
      </div>
      <div>
        <h4 className="font-semibold mb-3 text-sm">Aplicação</h4>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li><Link to="/generate" className="hover:text-primary">Criar rotina</Link></li>
          <li><Link to="/history" className="hover:text-primary">Histórico</Link></li>
          <li><Link to="/about" className="hover:text-primary">Sobre nós</Link></li>
        </ul>
      </div>
      <div>
        <h4 className="font-semibold mb-3 text-sm">Legal</h4>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li><Link to="/privacy" className="hover:text-primary">Privacidade & Termos</Link></li>
        </ul>
        <p className="mt-4 text-xs text-muted-foreground/80">
          ⚠️ O VitaFlow não substitui aconselhamento médico ou nutricional profissional.
        </p>
      </div>
    </div>
    <div className="border-t border-border/40 py-4 text-center text-xs text-muted-foreground">
      © {new Date().getFullYear()} VitaFlow. Feito com cuidado.
    </div>
  </footer>
);