import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, useSearchParams } from "react-router-dom";
import { PrestigeThemeToggle } from "@/components/shared/PrestigeThemeToggle";
import { GameStatsTiles } from "@/components/profile/GameStatsTiles";
import { FriendsPanel } from "@/components/social/FriendsPanel";
import { ArrowLeft, LogOut, KeyRound, Upload, Trash2, Users } from "lucide-react";

type Profile = {
  user_id: string;
  display_name: string | null;
  default_initials: string | null;
  avatar_path: string | null;
};

export default function ProfilePage() {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [saving, setSaving] = useState(false);
  const [pwdSaving, setPwdSaving] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [showPwdForm, setShowPwdForm] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'profile' | 'friends'>(
    searchParams.get('tab') === 'friends' ? 'friends' : 'profile'
  );

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setSession(session);
    });
    
    return () => subscription.unsubscribe();
  }, []);

  const user = session?.user;

  useEffect(() => {
    if (!user) return;

    supabase.from("user_profiles")
      .upsert({ user_id: user.id }, { onConflict: "user_id" })
      .then(() => {
        supabase.from("user_profiles")
          .select("*").eq("user_id", user.id).single()
          .then(({ data }) => setProfile(data as Profile | null));
      });
  }, [user?.id]);

  const onSaveProfile = async () => {
    if (!profile || !user) return;
    setSaving(true);
    const { error } = await supabase.from("user_profiles").update({
      display_name: profile.display_name?.trim() || null,
      default_initials: profile.default_initials?.toUpperCase().slice(0, 3) || null,
    }).eq("user_id", user.id);
    
    if (error) {
      toast({ title: "Error", description: "Failed to save profile", variant: "destructive" });
    } else {
      toast({ title: "Saved", description: "Profile updated successfully" });
    }
    setSaving(false);
  };

  const onUploadAvatar = async () => {
    if (!file || !user) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast({ title: "Error", description: "Only JPEG, PNG, WebP, or GIF images are allowed", variant: "destructive" });
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({ title: "Error", description: "File must be under 5MB", variant: "destructive" });
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
      toast({ title: "Error", description: "Failed to upload avatar", variant: "destructive" });
      return;
    }

    const { error: updateError } = await supabase.from("user_profiles")
      .update({ avatar_path: path })
      .eq("user_id", user.id);

    if (updateError) {
      toast({ title: "Error", description: "Failed to update profile", variant: "destructive" });
    } else {
      setProfile(p => p ? { ...p, avatar_path: path } : p);
      setFile(null);
      toast({ title: "Success", description: "Avatar uploaded successfully" });
    }
  };

  const onChangePassword = async (currentPassword: string, newPassword: string) => {
    if (!user) return;
    try {
      setPwdSaving(true);
      
      const { error: reauthErr } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: currentPassword,
      });
      
      if (reauthErr) {
        toast({ title: "Error", description: "Current password is incorrect", variant: "destructive" });
        return;
      }

      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      
      toast({ title: "Success", description: "Password updated successfully" });
      setShowPwdForm(false);
    } catch (e: any) {
      toast({ title: "Error", description: e.message ?? "Failed to update password", variant: "destructive" });
    } finally {
      setPwdSaving(false);
    }
  };

  const avatarUrl = profile?.avatar_path
    ? supabase.storage.from("avatars").getPublicUrl(profile.avatar_path).data.publicUrl
    : null;

  // Unauthenticated view
  if (!user) {
    return (
      <div className="min-h-dvh flex flex-col" style={{ background: 'hsl(var(--home-page-bg))' }}>
        <header 
          className="h-14 flex items-center justify-between px-4 sticky top-0 z-10"
          style={{ 
            background: 'hsl(var(--home-page-bg))',
            borderBottom: '1px solid hsl(var(--home-divider))' 
          }}
        >
          <button onClick={() => navigate('/')} className="p-1.5 rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/10">
            <ArrowLeft className="w-5 h-5" style={{ color: 'hsl(var(--home-text-muted))' }} />
          </button>
          <h1 className="font-playfair font-semibold" style={{ color: 'hsl(var(--home-text-primary))' }}>Account</h1>
          <PrestigeThemeToggle colorVar="--home-text-muted" />
        </header>

        <main className="flex-1 container mx-auto px-4 py-6 max-w-lg">
          <div 
            className="rounded-xl p-6"
            style={{ 
              background: 'hsl(var(--home-card-bg))',
              border: '1px solid hsl(var(--home-card-border))',
              boxShadow: '0 4px 12px rgba(0,0,0,0.04)'
            }}
          >
            <h2 className="font-playfair text-xl font-semibold mb-2" style={{ color: 'hsl(var(--home-text-primary))' }}>
              Create an Account
            </h2>
            <p className="text-sm mb-4" style={{ color: 'hsl(var(--home-text-secondary))' }}>
              Sign up to sync your stats across devices!
            </p>
            <Button onClick={() => navigate('/login')} className="w-full">
              Log In or Sign Up
            </Button>
          </div>

          {/* Local Stats */}
          <div className="mt-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-3 px-1" style={{ color: 'hsl(var(--home-text-muted))' }}>
              Your Local Stats
            </h3>
            <GameStatsTiles />
          </div>
        </main>
      </div>
    );
  }

  // Authenticated view
  return (
    <div className="min-h-dvh flex flex-col" style={{ background: 'hsl(var(--home-page-bg))' }}>
      <header 
        className="h-14 flex items-center justify-between px-4 sticky top-0 z-10"
        style={{ 
          background: 'hsl(var(--home-page-bg))',
          borderBottom: '1px solid hsl(var(--home-divider))' 
        }}
      >
        <button onClick={() => navigate('/')} className="p-1.5 rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/10">
          <ArrowLeft className="w-5 h-5" style={{ color: 'hsl(var(--home-text-muted))' }} />
        </button>
        <h1 className="font-playfair font-semibold" style={{ color: 'hsl(var(--home-text-primary))' }}>My Account</h1>
        <PrestigeThemeToggle colorVar="--home-text-muted" />
      </header>

      <main className="flex-1 container mx-auto px-4 py-6 max-w-lg space-y-6">
        {/* Tab Switcher */}
        <div className="flex gap-1 p-1 rounded-lg" style={{ background: 'hsl(var(--home-divider))' }}>
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'profile' ? '' : 'opacity-60'}`}
            style={{
              background: activeTab === 'profile' ? 'hsl(var(--home-card-bg))' : 'transparent',
              color: 'hsl(var(--home-text-primary))',
            }}
          >
            Profile
          </button>
          <button
            onClick={() => setActiveTab('friends')}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors flex items-center justify-center gap-1.5 ${activeTab === 'friends' ? '' : 'opacity-60'}`}
            style={{
              background: activeTab === 'friends' ? 'hsl(var(--home-card-bg))' : 'transparent',
              color: 'hsl(var(--home-text-primary))',
            }}
          >
            <Users className="w-3.5 h-3.5" />
            Friends
          </button>
        </div>

        {activeTab === 'friends' ? (
          <div
            className="rounded-xl p-5"
            style={{
              background: 'hsl(var(--home-card-bg))',
              border: '1px solid hsl(var(--home-card-border))',
              boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
            }}
          >
            <FriendsPanel accentVar="--home-accent" />
          </div>
        ) : (
        <>
        {/* Profile Card */}
        <div 
          className="rounded-xl p-5"
          style={{ 
            background: 'hsl(var(--home-card-bg))',
            border: '1px solid hsl(var(--home-card-border))',
            boxShadow: '0 4px 12px rgba(0,0,0,0.04)'
          }}
        >
          <div className="flex items-center gap-4 mb-5">
            <div className="relative">
              <img
                src={avatarUrl ?? "https://placehold.co/64x64?text=MG"}
                className="w-16 h-16 rounded-full object-cover"
                style={{ border: '2px solid hsl(var(--home-divider))' }}
                alt="avatar"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-playfair font-semibold text-lg truncate" style={{ color: 'hsl(var(--home-text-primary))' }}>
                {profile?.display_name || 'Player'}
              </p>
              <p className="text-sm truncate" style={{ color: 'hsl(var(--home-text-muted))' }}>
                {user.email}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium uppercase tracking-wider" style={{ color: 'hsl(var(--home-text-muted))' }}>
                Display Name
              </label>
              <Input
                value={profile?.display_name ?? ""}
                onChange={e => setProfile(p => p ? { ...p, display_name: e.target.value } : p)}
                placeholder="Your name"
                className="mt-1"
                style={{ 
                  background: 'hsl(var(--home-page-bg))',
                  borderColor: 'hsl(var(--home-divider))',
                  color: 'hsl(var(--home-text-primary))'
                }}
              />
            </div>
            <div>
              <label className="text-xs font-medium uppercase tracking-wider" style={{ color: 'hsl(var(--home-text-muted))' }}>
                Leaderboard Initials (3 chars)
              </label>
              <Input
                value={profile?.default_initials ?? ""}
                onChange={e => setProfile(p => p ? { ...p, default_initials: e.target.value } : p)}
                placeholder="ABC"
                maxLength={3}
                className="mt-1"
                style={{ 
                  background: 'hsl(var(--home-page-bg))',
                  borderColor: 'hsl(var(--home-divider))',
                  color: 'hsl(var(--home-text-primary))'
                }}
              />
            </div>
            <div>
              <label className="text-xs font-medium uppercase tracking-wider" style={{ color: 'hsl(var(--home-text-muted))' }}>
                Avatar
              </label>
              <div className="flex gap-2 mt-1">
                <Input 
                  type="file" 
                  accept="image/*" 
                  onChange={e => setFile(e.target.files?.[0] ?? null)} 
                  className="flex-1"
                  style={{ 
                    background: 'hsl(var(--home-page-bg))',
                    borderColor: 'hsl(var(--home-divider))',
                    color: 'hsl(var(--home-text-primary))'
                  }}
                />
                <Button variant="outline" onClick={onUploadAvatar} disabled={!file} size="icon">
                  <Upload className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <Button onClick={onSaveProfile} disabled={saving} className="w-full">
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>

        {/* Stats Card */}
        <div 
          className="rounded-xl p-5"
          style={{ 
            background: 'hsl(var(--home-card-bg))',
            border: '1px solid hsl(var(--home-card-border))',
            boxShadow: '0 4px 12px rgba(0,0,0,0.04)'
          }}
        >
          <h3 className="font-playfair font-semibold text-lg mb-4" style={{ color: 'hsl(var(--home-text-primary))' }}>
            My Stats
          </h3>
          <GameStatsTiles />
        </div>

        {/* Security Card */}
        <div 
          className="rounded-xl p-5"
          style={{ 
            background: 'hsl(var(--home-card-bg))',
            border: '1px solid hsl(var(--home-card-border))',
            boxShadow: '0 4px 12px rgba(0,0,0,0.04)'
          }}
        >
          <h3 className="font-playfair font-semibold text-lg mb-4" style={{ color: 'hsl(var(--home-text-primary))' }}>
            Security
          </h3>
          
          {showPwdForm ? (
            <ChangePasswordForm onSubmit={onChangePassword} busy={pwdSaving} onCancel={() => setShowPwdForm(false)} />
          ) : (
            <Button variant="outline" onClick={() => setShowPwdForm(true)} className="w-full gap-2">
              <KeyRound className="w-4 h-4" /> Change Password
            </Button>
          )}
        </div>

        {/* Data Management & Sign Out */}
        <div 
          className="rounded-xl p-5"
          style={{ 
            background: 'hsl(var(--home-card-bg))',
            border: '1px solid hsl(var(--home-card-border))',
            boxShadow: '0 4px 12px rgba(0,0,0,0.04)'
          }}
        >
          <h3 className="font-playfair font-semibold text-lg mb-4" style={{ color: 'hsl(var(--home-text-primary))' }}>
            Data & Account
          </h3>
          
          <div className="space-y-3">
            <Button 
              variant="outline" 
              onClick={() => {
                if (confirm('Are you sure you want to clear all local data? This cannot be undone.')) {
                  localStorage.clear();
                  toast({ title: "Data Cleared", description: "All local game data has been reset" });
                  window.location.reload();
                }
              }}
              className="w-full gap-2"
            >
              <Trash2 className="w-4 h-4" /> Reset Local Data
            </Button>
            
            <Button 
              variant="ghost" 
              className="w-full gap-2 text-destructive hover:text-destructive hover:bg-destructive/10" 
              onClick={() => {
                supabase.auth.signOut();
                navigate('/');
              }}
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </Button>
          </div>
        </div>

        {/* Admin link for specific user */}
        {user.email === "akhourybsu@gmail.com" && (
          <Button onClick={() => navigate('/admin/analytics')} variant="outline" className="w-full">
            Analytics Dashboard
          </Button>
        )}
        </>
        )}
      </main>
    </div>
  );
}
function ChangePasswordForm({ onSubmit, busy, onCancel }: {
  onSubmit: (current: string, next: string) => void; 
  busy: boolean;
  onCancel: () => void;
}) {
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
      }}
    >
      <div>
        <label className="text-xs font-medium uppercase tracking-wider" style={{ color: 'hsl(var(--home-text-muted))' }}>
          Current Password
        </label>
        <Input 
          type="password" 
          value={current} 
          onChange={e => setCurrent(e.target.value)} 
          required 
          className="mt-1"
          style={{ 
            background: 'hsl(var(--home-page-bg))',
            borderColor: 'hsl(var(--home-divider))',
            color: 'hsl(var(--home-text-primary))'
          }}
        />
      </div>
      <div>
        <label className="text-xs font-medium uppercase tracking-wider" style={{ color: 'hsl(var(--home-text-muted))' }}>
          New Password
        </label>
        <Input 
          type="password" 
          value={next} 
          onChange={e => setNext(e.target.value)} 
          required 
          className="mt-1"
          style={{ 
            background: 'hsl(var(--home-page-bg))',
            borderColor: 'hsl(var(--home-divider))',
            color: 'hsl(var(--home-text-primary))'
          }}
        />
      </div>
      <div>
        <label className="text-xs font-medium uppercase tracking-wider" style={{ color: 'hsl(var(--home-text-muted))' }}>
          Confirm New Password
        </label>
        <Input 
          type="password" 
          value={confirm} 
          onChange={e => setConfirm(e.target.value)} 
          required 
          className="mt-1"
          style={{ 
            background: 'hsl(var(--home-page-bg))',
            borderColor: 'hsl(var(--home-divider))',
            color: 'hsl(var(--home-text-primary))'
          }}
        />
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" disabled={busy} className="flex-1">
          {busy ? "Updating..." : "Update"}
        </Button>
      </div>
    </form>
  );
}