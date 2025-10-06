import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Save } from "lucide-react";
import { format } from "date-fns";

export default function Configuration() {
  const [configs, setConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      const { data, error } = await supabase
        .from("admin_config")
        .select("*")
        .order("key");

      if (error) throw error;
      setConfigs(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching configuration",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateConfig = async (configId: string, newValue: any) => {
    try {
      const { error } = await supabase
        .from("admin_config")
        .update({ value: newValue })
        .eq("id", configId);

      if (error) throw error;

      toast({
        title: "Configuration updated",
        description: "Settings saved successfully",
      });

      fetchConfigs();
    } catch (error: any) {
      toast({
        title: "Error updating configuration",
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
        <h1 className="text-3xl font-bold">Configuration</h1>
        <p className="text-muted-foreground">System settings and parameters</p>
      </div>

      <div className="grid gap-4">
        {configs.map((config) => (
          <Card key={config.id}>
            <CardHeader>
              <CardTitle className="text-lg">{config.key}</CardTitle>
              {config.description && (
                <CardDescription>{config.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  value={JSON.stringify(config.value)}
                  onChange={(e) => {
                    try {
                      const newValue = JSON.parse(e.target.value);
                      updateConfig(config.id, newValue);
                    } catch {
                      // Invalid JSON, ignore
                    }
                  }}
                  className="font-mono"
                />
                <Button size="icon" variant="outline">
                  <Save className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Last updated: {format(new Date(config.updated_at), "MMM d, yyyy HH:mm")}
              </p>
            </CardContent>
          </Card>
        ))}

        {configs.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No configuration settings found
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
