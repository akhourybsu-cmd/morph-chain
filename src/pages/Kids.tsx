import { MorphHeader } from "@/components/MorphHeader";
import { Card } from "@/components/ui/card";

const Kids = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <MorphHeader />
      
      <main className="flex-1 container mx-auto px-4 py-8 md:py-12 max-w-4xl">
        <h1 className="text-3xl md:text-4xl font-bold mb-8">Morph Games for Kids</h1>
        
        <Card className="p-6 space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-4">Educational & Safe</h2>
            <p className="text-muted-foreground leading-relaxed">
              Morph Games are designed to be educational word puzzles that help build vocabulary 
              and problem-solving skills. All games use modern English words and are appropriate 
              for players of all ages.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-4">Recommended Ages</h2>
            <ul className="space-y-2 text-muted-foreground">
              <li><strong>Morph Chain:</strong> Ages 8+ (great for vocabulary building)</li>
              <li><strong>Morph Prism:</strong> Ages 10+ (introduces color theory)</li>
              <li><strong>Morph Rush:</strong> Ages 10+ (fast-paced word building)</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-4">Tips for Young Players</h2>
            <ul className="list-disc list-inside space-y-2 ml-4 text-muted-foreground">
              <li>Start with the daily puzzle and explore the archive to play more</li>
              <li>Use the hint system when you get stuck</li>
              <li>Try different word lengths (4 or 5 letters) to find your comfort level</li>
              <li>Play together with family members for collaborative fun</li>
            </ul>
          </div>

          <div className="pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Morph Games contain no ads, in-app purchases, or external links. 
              All content is moderated and family-friendly.
            </p>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default Kids;
