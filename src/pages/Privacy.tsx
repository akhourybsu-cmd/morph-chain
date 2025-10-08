import { MorphHeader } from "@/components/MorphHeader";
import { Card } from "@/components/ui/card";

const Privacy = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <MorphHeader />
      
      <main className="flex-1 container mx-auto px-4 py-8 md:py-12 max-w-4xl">
        <h1 className="text-3xl md:text-4xl font-bold mb-8">Privacy Policy</h1>
        
        <Card className="p-6 space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-4">Data Collection</h2>
            <p className="text-muted-foreground leading-relaxed">
              Morph Games collects minimal data to provide game functionality. We store:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 mt-4 text-muted-foreground">
              <li>Game progress and statistics (stored locally in your browser)</li>
              <li>User preferences and settings</li>
              <li>Puzzle completion data for daily challenges</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-4">Local Storage</h2>
            <p className="text-muted-foreground leading-relaxed">
              Most game data is stored locally on your device using browser local storage. 
              This data remains on your device and is not transmitted to our servers unless 
              you explicitly choose to sync your progress.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-4">Third-Party Services</h2>
            <p className="text-muted-foreground leading-relaxed">
              We do not share your personal information with third parties. Our games do not 
              contain tracking pixels, advertising networks, or analytics services that 
              collect personally identifiable information.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-4">Cookies</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use essential cookies to maintain your game session and preferences. 
              These cookies are necessary for the games to function properly.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-4">Your Rights</h2>
            <p className="text-muted-foreground leading-relaxed">
              You can clear your game data at any time through your browser settings. 
              This will reset your progress and remove all locally stored information.
            </p>
          </div>

          <div className="pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Last updated: January 2025
            </p>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default Privacy;
