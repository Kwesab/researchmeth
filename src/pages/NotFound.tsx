import { Link } from "react-router-dom";
import { GraduationCap, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 animate-in">
      <div className="text-center max-w-md">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
          style={{ background: "var(--gradient-gold)", boxShadow: "0 4px 24px hsl(43 85% 58% / 0.3)" }}
        >
          <GraduationCap className="w-8 h-8" style={{ color: "hsl(var(--navy-deep))" }} />
        </div>
        <h1 className="font-display text-6xl font-bold mb-2" style={{ color: "hsl(var(--foreground))" }}>
          404
        </h1>
        <p className="text-lg mb-6" style={{ color: "hsl(var(--muted-foreground))" }}>
          Page not found
        </p>
        <Link to="/">
          <Button
            className="gap-2 rounded-xl"
            style={{ background: "var(--gradient-gold)", color: "hsl(var(--navy-deep))" }}
          >
            <Home className="w-4 h-4" />
            Back to Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
