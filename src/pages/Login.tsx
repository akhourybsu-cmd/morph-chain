import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { PrestigeThemeToggle } from "@/components/shared/PrestigeThemeToggle";
import { ArrowLeft } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (!rememberMe) {
        window.addEventListener('beforeunload', async () => {
          await supabase.auth.signOut();
        });
      }

      toast({
        title: "Welcome back!",
        description: "Your progress is now synced across devices.",
      });

      navigate("/");
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/`,
      });

      if (error) throw error;

      toast({
        title: "Password reset email sent",
        description: "Check your email for the password reset link.",
      });

      setShowForgotPassword(false);
    } catch (error: any) {
      toast({
        title: "Password reset failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setResetLoading(false);
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
          Sign In
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
              Welcome Back
            </h2>
            <p className="text-sm" style={{ color: 'hsl(var(--home-text-secondary))' }}>
              Sign in to sync your progress
            </p>
          </div>

          {showForgotPassword ? (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <Label 
                  htmlFor="reset-email" 
                  className="text-xs font-medium uppercase tracking-wider"
                  style={{ color: 'hsl(var(--home-text-muted))' }}
                >
                  Email
                </Label>
                <Input
                  id="reset-email"
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
              <Button type="submit" className="w-full" disabled={resetLoading}>
                {resetLoading ? "Sending..." : "Send Reset Link"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => setShowForgotPassword(false)}
              >
                Back to Sign In
              </Button>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
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
                <div className="flex items-center justify-between">
                  <Label 
                    htmlFor="password"
                    className="text-xs font-medium uppercase tracking-wider"
                    style={{ color: 'hsl(var(--home-text-muted))' }}
                  >
                    Password
                  </Label>
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-xs hover:underline"
                    style={{ color: 'hsl(var(--home-accent))' }}
                  >
                    Forgot password?
                  </button>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ 
                    background: 'hsl(var(--home-page-bg))',
                    borderColor: 'hsl(var(--home-divider))',
                    color: 'hsl(var(--home-text-primary))'
                  }}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                />
                <Label
                  htmlFor="remember"
                  className="text-sm font-normal cursor-pointer"
                  style={{ color: 'hsl(var(--home-text-secondary))' }}
                >
                  Keep me signed in
                </Label>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          )}

          <div 
            className="mt-5 pt-5 text-center text-sm"
            style={{ borderTop: '1px solid hsl(var(--home-divider))' }}
          >
            <span style={{ color: 'hsl(var(--home-text-muted))' }}>
              Don't have an account?{" "}
            </span>
            <Link 
              to="/signup" 
              className="font-medium hover:underline"
              style={{ color: 'hsl(var(--home-accent))' }}
            >
              Sign up
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}