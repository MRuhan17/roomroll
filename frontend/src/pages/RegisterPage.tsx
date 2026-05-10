import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
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
import { register } from "@/services/auth";
import { getApiErrorMessage } from "@/services/api";
import { useAuthStore } from "@/store/authStore";

export function RegisterPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: register,
    onSuccess: (data) => {
      setAuth(data.user, data.token);
      navigate("/rooms", { replace: true });
    },
    onError: (mutationError) => {
      setError(getApiErrorMessage(mutationError, "Registration failed"));
    },
  });

  return (
    <AuthShell>
      <Card className="w-full max-w-md border-primary/20 bg-card/95 glass-panel text-center">
        <CardHeader className="space-y-4 pb-8">
          <CardTitle className="font-serif text-4xl text-primary font-normal tracking-wide">
            RoomRoll
          </CardTitle>
          <p className="text-lg text-foreground font-serif tracking-wide">
            Forge Your Destiny
          </p>
          <p className="text-sm text-muted-foreground">
            Set up your identity and launch your first room.
          </p>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-6 text-left"
            onSubmit={(event) => {
              event.preventDefault();
              setError(null);
              mutation.mutate({ displayName, email, password });
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="name" className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                Known Title (Display Name)
              </Label>
              <Input
                id="name"
                placeholder="Enter display name"
                className="bg-background border-border/50 focus-visible:ring-primary/50 rounded-sm"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                True Name (Email)
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter email"
                className="bg-background border-border/50 focus-visible:ring-primary/50 rounded-sm"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                Secret Sigil (Password)
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a strong password"
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
              {mutation.isPending ? "Forging..." : "Create account"}
            </Button>
          </form>

          <p className="mt-8 text-center text-xs text-muted-foreground tracking-wide">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-primary hover:text-primary/80 transition-colors">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </AuthShell>
  );
}
