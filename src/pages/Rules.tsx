import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { PrestigeThemeToggle } from "@/components/shared/PrestigeThemeToggle";

const Rules = () => {
  const navigate = useNavigate();
  
  return (
    <div 
      className="min-h-screen flex flex-col"
      style={{ background: 'hsl(var(--grid-page-bg))' }}
    >
      {/* Header */}
      <header 
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid hsl(var(--grid-divider))' }}
      >
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm font-medium transition-colors"
          style={{ color: 'hsl(var(--grid-text-secondary))' }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'hsl(var(--grid-text-primary))'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'hsl(var(--grid-text-secondary))'}
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        
        <h1 
          className="font-serif text-lg font-semibold"
          style={{ color: 'hsl(var(--grid-text-primary))' }}
        >
          How to Play
        </h1>
        
        <PrestigeThemeToggle colorVar="--grid-text-secondary" />
      </header>
      
      <main className="flex-1 container mx-auto px-4 py-6 md:py-10 max-w-xl">
        <div className="space-y-6">
          {/* Morph Chain */}
          <RuleCard
            title="Morph Chain"
            accent="--accent-chain"
            rules={[
              "Transform START into GOAL by changing one letter at a time",
              "Each step must be a valid English word",
              "No word can be used twice",
              "Complete within the move limit",
            ]}
          />

          {/* Morph Grid */}
          <RuleCard
            title="Morph Grid"
            accent="--accent-grid"
            rules={[
              "Morph all tiles from orange → blue → purple",
              "Drag to chain adjacent letters (diagonals allowed)",
              "Words must be 4+ letters",
              "Complete in 20 moves or less to win",
            ]}
          />

          {/* Morph Rush */}
          <RuleCard
            title="Morph Rush"
            accent="--accent-rush"
            rules={[
              "Chain as many words as possible in 2 minutes",
              "Each word differs by one letter from the previous",
              "Tap a letter, then tap a position to place it",
              "No word can repeat within a run",
            ]}
          />
        </div>
      </main>
    </div>
  );
};

interface RuleCardProps {
  title: string;
  accent: string;
  rules: string[];
}

const RuleCard = ({ title, accent, rules }: RuleCardProps) => {
  return (
    <div 
      className="rounded-xl p-5"
      style={{ 
        background: 'hsl(var(--grid-card-bg))',
        border: '1px solid hsl(var(--grid-card-border))',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.04)'
      }}
    >
      <h2 
        className="font-serif text-lg font-semibold mb-3"
        style={{ color: `hsl(var(${accent}))` }}
      >
        {title}
      </h2>
      <ul className="space-y-2">
        {rules.map((rule, i) => (
          <li 
            key={i}
            className="flex items-start gap-2 text-sm"
            style={{ color: 'hsl(var(--grid-text-secondary))' }}
          >
            <span 
              className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ background: `hsl(var(${accent}))` }}
            />
            {rule}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Rules;
