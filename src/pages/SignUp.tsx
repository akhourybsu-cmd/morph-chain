import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { PrestigeThemeToggle } from "@/components/shared/PrestigeThemeToggle";
import { ArrowLeft } from "lucide-react";

export default function SignUp() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (error) throw error;

      toast({
        title: "Account created!",
        description: "You can now sign in to sync your progress.",
      });

      navigate("/login");
    } catch (error: any) {
      toast({
        title: "Sign up failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col" style={{ background: 'hsl(var(--home-page-bg))' }}>
      {/* Header */}
      <header 
        className="h-14 flex items-center justify-between px-4"
        style={{ borderBottom: '1px solid hsl(var(--home-divider))' }}
      >
        <button 
          onClick={() => navigate('/')} 
          className="p-1.5 rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/10"
        >
          <ArrowLeft className="w-5 h-5" style={{ color: 'hsl(var(--home-text-muted))' }} />
        </button>
        <h1 className="font-playfair font-semibold" style={{ color: 'hsl(var(--home-text-primary))' }}>
          Sign Up
        </h1>
        <PrestigeThemeToggle colorVar="--home-text-muted" />
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div 
          className="w-full max-w-sm rounded-xl p-6"
          style={{ 
            background: 'hsl(var(--home-card-bg))',
            border: '1px solid hsl(var(--home-card-border))',
            boxShadow: '0 8px 24px rgba(0,0,0,0.06)'
          }}
        >
          <div className="text-center mb-6">
            <h2 className="font-playfair text-2xl font-bold mb-1" style={{ color: 'hsl(var(--home-text-primary))' }}>
              Create Account
            </h2>
            <p className="text-sm" style={{ color: 'hsl(var(--home-text-secondary))' }}>
              Sign up to sync your stats across devices
            </p>
          </div>

          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="space-y-2">
              <Label 
                htmlFor="email"
                className="text-xs font-medium uppercase tracking-wider"
                style={{ color: 'hsl(var(--home-text-muted))' }}
              >
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ 
                  background: 'hsl(var(--home-page-bg))',
                  borderColor: 'hsl(var(--home-divider))',
                  color: 'hsl(var(--home-text-primary))'
                }}
              />
            </div>
            <div className="space-y-2">
              <Label 
                htmlFor="password"
                className="text-xs font-medium uppercase tracking-wider"
                style={{ color: 'hsl(var(--home-text-muted))' }}
              >
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                style={{ 
                  background: 'hsl(var(--home-page-bg))',
                  borderColor: 'hsl(var(--home-divider))',
                  color: 'hsl(var(--home-text-primary))'
                }}
              />
            </div>
            <div className="space-y-2">
              <Label 
                htmlFor="confirmPassword"
                className="text-xs font-medium uppercase tracking-wider"
                style={{ color: 'hsl(var(--home-text-muted))' }}
              >
                Confirm Password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                style={{ 
                  background: 'hsl(var(--home-page-bg))',
                  borderColor: 'hsl(var(--home-divider))',
                  color: 'hsl(var(--home-text-primary))'
                }}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating account..." : "Sign Up"}
            </Button>
          </form>

          <div 
            className="mt-5 pt-5 text-center text-sm"
            style={{ borderTop: '1px solid hsl(var(--home-divider))' }}
          >
            <span style={{ color: 'hsl(var(--home-text-muted))' }}>
              Already have an account?{" "}
            </span>
            <Link 
              to="/login" 
              className="font-medium hover:underline"
              style={{ color: 'hsl(var(--home-accent))' }}
            >
              Sign in
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}