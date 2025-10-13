import { MorphHeader } from "@/components/MorphHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";

interface PatchNote {
  date: string;
  version?: string;
  changes: {
    title: string;
    description: string;
    type: "feature" | "improvement" | "fix";
  }[];
}

const patchNotes: PatchNote[] = [
  {
    date: "2025-10-13",
    version: "1.2.0",
    changes: [
      {
        title: "User Profiles",
        description: "Added comprehensive profile pages with stats tracking, customizable avatars, display names, and default leaderboard initials. View your Morph Rush and Morph Chain statistics all in one place!",
        type: "feature"
      },
      {
        title: "Streamlined Navigation",
        description: "Replaced the Sign Out button with a View Profile button in the main navigation for easier access to your account settings and stats.",
        type: "improvement"
      }
    ]
  },
  {
    date: "2025-10-06",
    version: "1.1.0",
    changes: [
      {
        title: "Morph Rush: Fair Play Updates",
        description: "Practice mode is now only available after completing your first daily attempt. Only your first daily attempt counts toward the leaderboard, ensuring fair competition.",
        type: "feature"
      },
      {
        title: "Morph Rush: Practice Mode Icon",
        description: "Removed the practice mode icon from the front page until you've completed your first daily attempt.",
        type: "improvement"
      }
    ]
  }
];

const typeColors = {
  feature: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  improvement: "bg-green-500/10 text-green-600 border-green-500/20",
  fix: "bg-orange-500/10 text-orange-600 border-orange-500/20"
};

const typeLabels = {
  feature: "New",
  improvement: "Improved",
  fix: "Fixed"
};

export default function WhatsNew() {
  return (
    <div className="min-h-screen bg-background">
      <MorphHeader />
      
      <main className="container max-w-4xl mx-auto px-4 py-8 md:py-12">
        <div className="flex items-center gap-3 mb-8">
          <Sparkles className="h-8 w-8 text-primary" />
          <h1 className="text-3xl md:text-4xl font-bold">What's New</h1>
        </div>

        <p className="text-muted-foreground mb-8 text-lg">
          Stay up to date with the latest features, improvements, and fixes to Morph Games.
        </p>

        <div className="space-y-6">
          {patchNotes.map((patch, idx) => (
            <Card key={idx} className="overflow-hidden">
              <CardHeader className="bg-muted/30">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">
                    {new Date(patch.date).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </CardTitle>
                  {patch.version && (
                    <Badge variant="outline" className="font-mono">
                      v{patch.version}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {patch.changes.map((change, changeIdx) => (
                    <div key={changeIdx} className="flex gap-3">
                      <Badge 
                        variant="outline" 
                        className={`${typeColors[change.type]} shrink-0 h-fit`}
                      >
                        {typeLabels[change.type]}
                      </Badge>
                      <div className="space-y-1">
                        <h3 className="font-semibold">{change.title}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {change.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 p-6 border border-border rounded-lg bg-muted/30">
          <p className="text-sm text-muted-foreground text-center">
            Have feedback or feature requests? We'd love to hear from you!
          </p>
        </div>
      </main>
    </div>
  );
}