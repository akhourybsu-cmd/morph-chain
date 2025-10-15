import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Archive, Calendar, FileText, Info } from "lucide-react";

export default function MorphArchive() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Morph Archive</h1>
        <p className="text-muted-foreground mt-2">
          Historical record of retired features and experimental modes
        </p>
      </div>

      <Card className="border-amber-500/20 bg-amber-500/5">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Info className="h-5 w-5 text-amber-500" />
            <CardTitle>About the Archive</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            This archive preserves retired game modes, experimental features, and design iterations from Morph Games' evolution.
          </p>
          <p className="text-muted-foreground">
            Content here is maintained for historical reference and potential future reuse. All archived features are admin-only and not visible to public users.
          </p>
        </CardContent>
      </Card>

      <Separator />

      {/* 6L Archive Entry */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Archive className="h-5 w-5" />
                <CardTitle>6-Letter Word Puzzles (6L Mode)</CardTitle>
              </div>
              <CardDescription>Retired word length variant</CardDescription>
            </div>
            <Badge variant="secondary">Archived</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 text-sm">
            <div>
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Calendar className="h-4 w-4" />
                <span className="font-medium">Date Archived</span>
              </div>
              <p>October 15, 2025</p>
            </div>

            <div>
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <FileText className="h-4 w-4" />
                <span className="font-medium">Reason for Removal</span>
              </div>
              <p className="text-muted-foreground">
                6-letter puzzles were found to be too restrictive for most players. The "change up to 2 letters per move" rule (Δ≤2) 
                created a denser graph that was difficult to navigate, leading to frequent dead-ends and player frustration. 
                After analyzing player data and feedback, the decision was made to focus on 4L and 5L formats which provide 
                better balance between challenge and solvability.
              </p>
            </div>

            <Separator />

            <div>
              <h4 className="font-semibold mb-2">Game Mechanics (6L)</h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Transform 6-letter words by changing up to 2 letters per move</li>
                <li>Move limit: typically 10-14 moves (minDistance + 5)</li>
                <li>50 curated puzzle pairs (CURATED_6L_PUZZLES)</li>
                <li>Minimum distance: 3 steps between start and goal</li>
                <li>Dictionary: v1.2-core6L-notheme (Modern U.S. English)</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Archived Resources</h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li><code className="text-xs bg-muted px-1 py-0.5 rounded">src/lib/curatedPuzzles6L.ts</code> - 50 validated puzzle pairs</li>
                <li><code className="text-xs bg-muted px-1 py-0.5 rounded">public/dict/manifest.json</code> - Dictionary version v1.2-core6L-notheme</li>
                <li><code className="text-xs bg-muted px-1 py-0.5 rounded">VALID_WORDS_6</code> - Filtered 6-letter word set</li>
                <li>Database migration: 6L leaderboard tables (archived but preserved)</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Player Data</h4>
              <p className="text-muted-foreground">
                All 6L player statistics, game sessions, and leaderboard entries have been preserved in the database 
                but are no longer visible in public interfaces. Admins can query this data for historical analysis.
              </p>
            </div>

            <div className="bg-muted/50 p-3 rounded-lg border">
              <p className="text-xs text-muted-foreground">
                <strong>Note:</strong> This content is maintained for internal reference only. The 6L code remains in the repository 
                but is disconnected from public-facing gameplay. If future iterations require 6L functionality, 
                all necessary assets and documentation are preserved here.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Future Archive Template */}
      <Card className="opacity-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Archive className="h-5 w-5" />
                <CardTitle>Future Archived Features</CardTitle>
              </div>
              <CardDescription>Placeholder for future deprecations</CardDescription>
            </div>
            <Badge variant="outline">Template</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            As Morph Games evolves, additional features, modes, or experiments may be archived here. 
            Each entry will include deprecation date, rationale, technical resources, and preservation details.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
