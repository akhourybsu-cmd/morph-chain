import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

export default function FeatureFlags() {
  const [flags, setFlags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchFlags();
  }, []);

  const fetchFlags = async () => {
    try {
      const { data, error } = await supabase
        .from("feature_flags")
        .select("*")
        .order("key");

      if (error) throw error;
      setFlags(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching flags",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleFlag = async (flagId: string, currentState: boolean) => {
    try {
      const { error } = await supabase
        .from("feature_flags")
        .update({ enabled: !currentState })
        .eq("id", flagId);

      if (error) throw error;

      toast({
        title: "Feature flag updated",
        description: `Flag ${!currentState ? "enabled" : "disabled"}`,
      });

      fetchFlags();
    } catch (error: any) {
      toast({
        title: "Error updating flag",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Feature Flags</h1>
        <p className="text-muted-foreground">Enable or disable features dynamically</p>
      </div>

      <div className="grid gap-4">
        {flags.map((flag) => (
          <Card key={flag.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{flag.key}</CardTitle>
                  {flag.description && (
                    <CardDescription>{flag.description}</CardDescription>
                  )}
                </div>
                <Switch
                  checked={flag.enabled}
                  onCheckedChange={() => toggleFlag(flag.id, flag.enabled)}
                />
              </div>
            </CardHeader>
            {flag.rollout_percentage !== null && (
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Rollout: {flag.rollout_percentage}%
                </p>
              </CardContent>
            )}
          </Card>
        ))}

        {flags.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No feature flags configured
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
