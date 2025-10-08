import { MorphHeader } from "@/components/MorphHeader";
import { Card } from "@/components/ui/card";

const Press = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <MorphHeader />
      
      <main className="flex-1 container mx-auto px-4 py-8 md:py-12 max-w-4xl">
        <h1 className="text-3xl md:text-4xl font-bold mb-8">Press & Media</h1>
        
        <div className="space-y-8">
          <Card className="p-6 space-y-4">
            <h2 className="text-2xl font-bold">About Morph Games</h2>
            <p className="text-muted-foreground leading-relaxed">
              Morph Games is a collection of daily "change-one-thing" puzzles that challenge 
              players to transform words and colors through incremental changes. Featuring 
              three distinct game modes, each puzzle is carefully curated to be solvable 
              using modern English vocabulary.
            </p>
          </Card>

          <Card className="p-6 space-y-4">
            <h2 className="text-2xl font-bold">Game Overview</h2>
            <div className="space-y-4 text-muted-foreground">
              <div>
                <h3 className="font-semibold text-foreground mb-2">Morph Chain</h3>
                <p>A daily word ladder puzzle where players transform a starting word into a goal word by changing one letter at a time.</p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Morph Prism</h3>
                <p>A color transformation puzzle that challenges players to match a target color by adjusting HSL values one channel at a time.</p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Morph Rush</h3>
                <p>A 2-minute speed challenge where players chain together as many word transformations as possible for maximum points.</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <h2 className="text-2xl font-bold">Key Features</h2>
            <ul className="list-disc list-inside space-y-2 ml-4 text-muted-foreground">
              <li>Daily puzzles synchronized to New York timezone</li>
              <li>Spoiler-free sharing functionality</li>
              <li>Modern English vocabulary only</li>
              <li>Multiple difficulty levels and game modes</li>
              <li>Clean, accessible interface</li>
            </ul>
          </Card>

          <Card className="p-6 space-y-4">
            <h2 className="text-2xl font-bold">Contact</h2>
            <p className="text-muted-foreground">
              For press inquiries, interviews, or media assets, please contact us through 
              our website or social media channels.
            </p>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Press;
