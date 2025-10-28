import { MorphHeader } from "@/components/MorphHeader";
import { Card } from "@/components/ui/card";

const Rules = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <MorphHeader />
      
      <main className="flex-1 container mx-auto px-4 py-8 md:py-12 max-w-4xl">
        <h1 className="text-3xl md:text-4xl font-bold mb-8">How to Play</h1>
        
        <div className="space-y-8">
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-chain to-chain bg-clip-text text-transparent">
              Morph Chain
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p>Transform the starting word into the goal word by changing one letter at a time.</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Each step must be a valid English word</li>
                <li>Change only one letter per move</li>
                <li>Complete the puzzle in the minimum number of moves</li>
                <li>No word can be used twice</li>
              </ul>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4 bg-gradient-grid bg-clip-text text-transparent">
              Morph Grid
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p>Build words on a 5x5 grid by connecting adjacent letters.</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Connect adjacent letters (horizontally, vertically, or diagonally)</li>
                <li>Each letter can only be used once per word</li>
                <li>Longer words score more points</li>
                <li>Strategic morphing and word placement is key</li>
              </ul>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4 bg-gradient-rush bg-clip-text text-transparent">
              Morph Rush
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p>Create as many word transformations as possible in 2 minutes.</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Start with a 4-letter word</li>
                <li>Change one letter to make new words</li>
                <li>Chain words together for multiplier bonuses</li>
                <li>Quick successive plays increase your flow multiplier</li>
                <li>Use Scout to reveal hints and Undo to reverse moves</li>
              </ul>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Rules;
