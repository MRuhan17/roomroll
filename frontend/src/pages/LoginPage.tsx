import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthShell } from "@/components/AuthShell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login } from "@/services/auth";
import { getApiErrorMessage } from "@/services/api";
import { useAuthStore } from "@/store/authStore";
import { BrandMark } from "@/components/landing/LandingPrimitives";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const redirectTo = (location.state as { from?: string } | null)?.from ?? "/campaigns";

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      setAuth(data.user, data.token);
      navigate(redirectTo, { replace: true });
    },
    onError: (mutationError) => {
      setError(getApiErrorMessage(mutationError, "Login failed"));
    },
  });

  return (
    <AuthShell>
      <Card className="w-full max-w-md border-primary/20 bg-card/95 glass-panel text-center">
        <CardHeader className="space-y-4 pb-8 flex flex-col items-center">
          <BrandMark />
          <p className="text-lg text-foreground font-serif tracking-wide mt-2">
            Summon Your Identity
          </p>
          <p className="text-sm text-muted-foreground">
            Enter the codes to resume your campaign.
          </p>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-6 text-left"
            onSubmit={(event) => {
              event.preventDefault();
              setError(null);
              mutation.mutate({ email, password });
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                True Name (Email)
              </Label>
              <Input
                id="email"
                type="email"
                className="bg-background border-border/50 focus-visible:ring-primary/50 rounded-sm"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                  Secret Sigil (Password)
                </Label>
                <button
                  type="button"
                  className="text-[10px] font-bold tracking-widest text-primary/80 transition hover:text-primary uppercase"
                >
                  Forgot Spell?
                </button>
              </div>
              <Input
                id="password"
                type="password"
                className="bg-background border-border/50 focus-visible:ring-primary/50 rounded-sm"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>
            {error ? <p className="text-sm text-accent">{error}</p> : null}
            <Button 
              type="submit" 
              className="w-full bg-primary/10 text-primary border border-primary/30 hover:bg-primary hover:text-primary-foreground font-serif tracking-widest transition-all rounded-sm uppercase mt-4" 
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Summoning..." : "Awaken"}
            </Button>
          </form>

          <div className="mt-8 relative flex items-center py-5">
            <div className="flex-grow border-t border-border/40"></div>
            <span className="flex-shrink-0 mx-4 text-[10px] text-muted-foreground uppercase tracking-widest">Or Forge Pact With</span>
            <div className="flex-grow border-t border-border/40"></div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" className="bg-background border-border/40 hover:bg-white/5 rounded-sm text-xs tracking-wider text-muted-foreground hover:text-foreground">
              Google Archive
            </Button>
            <Button variant="outline" className="bg-background border-border/40 hover:bg-white/5 rounded-sm text-xs tracking-wider text-muted-foreground hover:text-foreground">
              Discord Guild
            </Button>
          </div>

          <p className="mt-8 text-center text-xs text-muted-foreground tracking-wide">
            No lineage recorded?{" "}
            <Link to="/register" className="font-medium text-primary hover:text-primary/80 transition-colors">
              Begin Your Journey
            </Link>
          </p>
        </CardContent>
      </Card>
    </AuthShell>
  );
}
