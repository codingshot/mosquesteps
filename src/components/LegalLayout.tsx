import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import logo from "@/assets/logo.png";

const LegalLayout = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="min-h-screen bg-background">
    <header className="border-b border-border">
      <div className="container py-4 flex items-center gap-2">
        <Link to="/" className="flex items-center gap-2 text-foreground">
          <ArrowLeft className="w-5 h-5" />
          <img src={logo} alt="MosqueSteps" className="w-7 h-7" />
        </Link>
        <span className="font-bold text-foreground">{title}</span>
      </div>
    </header>
    <main className="container py-10 max-w-3xl">
      <h1 className="text-3xl font-bold text-foreground mb-8">{title}</h1>
      <div className="prose prose-sm max-w-none text-muted-foreground space-y-6">
        {children}
      </div>
    </main>
  </div>
);

export default LegalLayout;
