import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { MorphHeader } from "@/components/MorphHeader";
import { MorphChainTitle, MorphGridTitle, MorphRushTitle } from "@/components/GameTitles";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { loadRushStats } from "@/lib/rushStorage";
import { loadGridStats } from "@/lib/gridStorage";
import { loadStats } from "@/lib/storage";

type MyStats = {
  user_id: string;
  rush_plays: number;
  rush_best_score: number;
  rush_avg_score: number;
  rush_best_multiplier: number;
  rush_time_ms: number;
  chain_plays: number;
  chain_best_moves: number;
  chain_clears: number;
  chain_avg_time_ms: number;
};

type Profile = {
  user_id: string;
  display_name: string | null;
  default_initials: string | null;
  avatar_path: string | null;
};

export default function ProfilePage() {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<MyStats | null>(null);
  const [saving, setSaving] = useState(false);
  const [pwdSaving, setPwdSaving] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
  }, []);

  const user = session?.user;

  useEffect(() => {
    if (!user) return;

    // Ensure a row exists
    supabase.from("user_profiles")
      .upsert({ user_id: user.id }, { onConflict: "user_id" })
      .then(() => {
        supabase.from("user_profiles")
          .select("*").eq("user_id", user.id).single()
          .then(({ data }) => setProfile(data as Profile | null));
      });

    supabase.from("v_my_stats").select("*").single().then(({ data }) => {
      setStats(data as MyStats | null);
    });
  }, [user?.id]);

  // Load local stats for displaying when not signed in or as backup
  const [localRushStats] = useState(() => loadRushStats());
  const [localGridStats] = useState(() => loadGridStats());
  const [localChainStats] = useState(() => loadStats());

  const rushTime = useMemo(() => {
    if (!stats) return "0m";
    const minutes = Math.round((stats.rush_time_ms || 0) / 60000);
    return `${minutes}m`;
  }, [stats]);

  if (!user) {
    return (
      <>
        <MorphHeader />
        <main className="max-w-4xl mx-auto p-6 space-y-8">
          <Card>
            <CardContent className="p-6 space-y-4">
              <h2 className="text-xl font-bold">Create a profile to save these stats</h2>
              <p className="text-muted-foreground">Your local stats are tracked on this device. Sign up to sync them across devices!</p>
              <Button onClick={() => navigate('/login')} className="mt-4">Log In or Sign Up</Button>
              
              {/* Show local stats */}
              <div className="pt-6 border-t">
                <h3 className="text-lg font-semibold mb-4">Your Local Stats</h3>
                <Accordion type="single" collapsible defaultValue="chain" className="space-y-2">
                  <AccordionItem value="chain" className="border rounded-lg px-4">
                    <AccordionTrigger className="hover:no-underline">
                      <MorphChainTitle className="text-xl" />
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <Stat label="Plays" value={localChainStats.overall.played} />
                        <Stat label="Wins" value={localChainStats.overall.won} />
                        <Stat label="Current Streak" value={localChainStats.overall.currentStreak} />
                        <Stat label="Best Streak" value={localChainStats.overall.maxStreak} />
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="rush" className="border rounded-lg px-4">
                    <AccordionTrigger className="hover:no-underline">
                      <MorphRushTitle className="text-xl" />
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <Stat label="Plays" value={localRushStats.normal.gamesPlayed + localRushStats.hard.gamesPlayed} />
                        <Stat label="Best Score" value={Math.max(localRushStats.normal.highScore, localRushStats.hard.highScore)} />
                        <Stat label="Total Words" value={localRushStats.normal.totalWords + localRushStats.hard.totalWords} />
                        <Stat label="Max Multiplier" value={`${Math.max(localRushStats.normal.maxMultiplier, localRushStats.hard.maxMultiplier).toFixed(1)}x`} />
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="grid" className="border rounded-lg px-4">
                    <AccordionTrigger className="hover:no-underline">
                      <MorphGridTitle className="text-xl" />
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <Stat label="Plays" value={localGridStats.gamesPlayed} />
                        <Stat label="Completed" value={localGridStats.gamesCompleted} />
                        <Stat label="Best Moves" value={localGridStats.bestMoves ?? 0} />
                        <Stat label="Completion Rate" value={`${Math.round(localGridStats.completionRate * 100)}%`} />
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </CardContent>
          </Card>
        </main>
      </>
    );
  }

  const onSaveProfile = async () => {
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase.from("user_profiles").update({
      display_name: profile.display_name?.trim() || null,
      default_initials: profile.default_initials?.toUpperCase().slice(0, 3) || null,
    }).eq("user_id", user.id);
    
    if (error) {
      toast({
        title: "Error",
        description: "Failed to save profile",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Saved",
        description: "Profile updated successfully"
      });
    }
    setSaving(false);
  };

  const onUploadAvatar = async () => {
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Error",
        description: "Only JPEG, PNG, WebP, or GIF images are allowed",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "Error",
        description: "File must be under 5MB",
        variant: "destructive"
      });
      return;
    }

    const ext = file.name.split(".").pop()?.toLowerCase();
    const path = `${user.id}/avatar_${Date.now()}.${ext}`;
    
    const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, {
      cacheControl: "3600",
      upsert: true,
      contentType: file.type,
    });

    if (uploadError) {
      toast({
        title: "Error",
        description: "Failed to upload avatar",
        variant: "destructive"
      });
      return;
    }

    const { error: updateError } = await supabase.from("user_profiles")
      .update({ avatar_path: path })
      .eq("user_id", user.id);

    if (updateError) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive"
      });
    } else {
      setProfile(p => p ? { ...p, avatar_path: path } : p);
      toast({
        title: "Success",
        description: "Avatar uploaded successfully"
      });
    }
  };

  const onChangePassword = async (currentPassword: string, newPassword: string) => {
    try {
      setPwdSaving(true);
      
      // Re-authenticate to verify current password
      const { error: reauthErr } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: currentPassword,
      });
      
      if (reauthErr) {
        toast({
          title: "Error",
          description: "Current password is incorrect",
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase.auth.updateUser({ password: newPassword });
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Password updated successfully"
      });
    } catch (e: any) {
      toast({
        title: "Error",
        description: e.message ?? "Failed to update password",
        variant: "destructive"
      });
    } finally {
      setPwdSaving(false);
    }
  };

  const avatarUrl = profile?.avatar_path
    ? supabase.storage.from("avatars").getPublicUrl(profile.avatar_path).data.publicUrl
    : null;

  return (
    <>
      <MorphHeader />
      <main className="max-w-4xl mx-auto p-6 space-y-8">
        <div className="flex items-center gap-4">
          <img
            src={avatarUrl ?? "https://placehold.co/96x96?text=MG"}
            className="w-24 h-24 rounded-full object-cover"
            alt="avatar"
          />
          <div>
            <h1 className="text-2xl font-bold">Your Profile</h1>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>

        <section className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle>Profile Settings</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium">Display Name</label>
                <Input
                  value={profile?.display_name ?? ""}
                  onChange={e => setProfile(p => p ? { ...p, display_name: e.target.value } : p)}
                  placeholder="Optional"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Default Leaderboard Initials (0–3 chars)</label>
                <Input
                  value={profile?.default_initials ?? ""}
                  onChange={e => setProfile(p => p ? { ...p, default_initials: e.target.value } : p)}
                  placeholder="e.g., AK"
                  maxLength={3}
                />
              </div>
              <div className="flex items-center gap-2">
                <Input type="file" accept="image/*" onChange={e => setFile(e.target.files?.[0] ?? null)} />
                <Button variant="secondary" onClick={onUploadAvatar} disabled={!file}>Upload</Button>
              </div>
              <Button onClick={onSaveProfile} disabled={saving} className="w-full">
                {saving ? "Saving..." : "Save Changes"}
              </Button>
              {user.email === "akhourybsu@gmail.com" && (
                <Button onClick={() => navigate('/admin/analytics')} variant="outline" className="w-full">
                  Analytics
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Change Password</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <ChangePasswordForm onSubmit={onChangePassword} busy={pwdSaving} />
            </CardContent>
          </Card>
        </section>

        <section>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">My Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible defaultValue="chain" className="space-y-2">
                <AccordionItem value="chain" className="border rounded-lg px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <MorphChainTitle className="text-xl" />
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <Stat label="Plays" value={stats?.chain_plays ?? 0} />
                      <Stat label="Best Moves" value={stats?.chain_best_moves ?? 0} />
                      <Stat label="Clears" value={stats?.chain_clears ?? 0} />
                      <Stat label="Avg Time" value={`${Math.round((stats?.chain_avg_time_ms ?? 0)/1000)}s`} />
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="rush" className="border rounded-lg px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <MorphRushTitle className="text-xl" />
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <Stat label="Plays" value={stats?.rush_plays ?? 0} />
                      <Stat label="Best Score" value={stats?.rush_best_score ?? 0} />
                      <Stat label="Avg Score" value={stats?.rush_avg_score ?? 0} />
                      <Stat label="Best Multiplier" value={`${stats?.rush_best_multiplier ?? 0}x`} />
                      <Stat label="Time Played" value={rushTime} />
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="grid" className="border rounded-lg px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <MorphGridTitle className="text-xl" />
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <Stat label="Coming Soon" value="Track Grid stats" />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </section>

        <Card>
          <CardHeader><CardTitle>Data Management</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-4">
                Clear all local game data, progress, and settings. This action cannot be undone.
              </p>
              <Button 
                variant="destructive" 
                onClick={() => {
                  if (confirm('Are you sure you want to clear all local data? This cannot be undone.')) {
                    localStorage.clear();
                    toast({
                      title: "Data Cleared",
                      description: "All local game data has been reset"
                    });
                    window.location.reload();
                  }
                }}
              >
                Reset Local Data
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="pt-6 border-t">
          <Button variant="ghost" className="text-destructive hover:text-destructive" onClick={() => {
            supabase.auth.signOut();
            navigate('/');
          }}>
            Sign Out
          </Button>
        </div>
      </main>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border p-3">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="text-xl font-semibold">{value}</div>
    </div>
  );
}

function ChangePasswordForm({ onSubmit, busy }: { onSubmit: (current: string, next: string) => void; busy: boolean }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");

  return (
    <form
      className="space-y-3"
      onSubmit={e => {
        e.preventDefault();
        if (next !== confirm) {
          alert("Passwords do not match.");
          return;
        }
        if (next.length < 8) {
          alert("Password must be at least 8 characters.");
          return;
        }
        onSubmit(current, next);
        setCurrent("");
        setNext("");
        setConfirm("");
      }}
    >
      <div>
        <label className="text-sm font-medium">Current Password</label>
        <Input type="password" value={current} onChange={e => setCurrent(e.target.value)} required />
      </div>
      <div>
        <label className="text-sm font-medium">New Password</label>
        <Input type="password" value={next} onChange={e => setNext(e.target.value)} required />
      </div>
      <div>
        <label className="text-sm font-medium">Confirm New Password</label>
        <Input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required />
      </div>
      <Button type="submit" disabled={busy} className="w-full">
        {busy ? "Updating..." : "Update Password"}
      </Button>
    </form>
  );
}
