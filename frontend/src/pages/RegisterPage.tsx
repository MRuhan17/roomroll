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
import { BrandMark } from "@/components/landing/LandingPrimitives";

export function RegisterPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: register,
    onSuccess: (data) => {
      setAuth(data.user, data.token);
      navigate("/onboarding", { replace: true });
    },
    onError: (mutationError) => {
      setError(getApiErrorMessage(mutationError, "Registration failed"));
    },
  });

  return (
    <AuthShell>
      <Card className="w-full max-w-md border-primary/20 bg-card/95 glass-panel text-center">
        <CardHeader className="space-y-4 pb-8 flex flex-col items-center">
          <BrandMark />
          <p className="text-lg text-foreground font-serif tracking-wide mt-2">
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
              mutation.mutate({ displayName, email, password, termsAccepted, privacyAccepted });
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
            
            <div className="flex items-start space-x-2 mt-4">
              <input
                type="checkbox"
                id="terms"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-1 bg-background border-border/50 rounded-sm focus-visible:ring-primary/50 text-primary accent-primary"
                required
              />
              <Label htmlFor="terms" className="text-xs text-muted-foreground leading-snug">
                I agree to the <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link>
              </Label>
            </div>

            <div className="flex items-start space-x-2">
              <input
                type="checkbox"
                id="privacy"
                checked={privacyAccepted}
                onChange={(e) => setPrivacyAccepted(e.target.checked)}
                className="mt-1 bg-background border-border/50 rounded-sm focus-visible:ring-primary/50 text-primary accent-primary"
                required
              />
              <Label htmlFor="privacy" className="text-xs text-muted-foreground leading-snug">
                I have read and agree to the <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
              </Label>
            </div>

            {error ? <p className="text-sm text-accent" role="alert">{error}</p> : null}
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
