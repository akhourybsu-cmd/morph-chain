import { SLOTS } from '@/lib/morphcode/types';

interface FeedbackPipsProps {
  exact: number;
  shifted: number;
  animate?: boolean;
}

export const FeedbackPips = ({ exact, shifted, animate }: FeedbackPipsProps) => {
  const miss = SLOTS - exact - shifted;
  const pips = [
    ...Array(exact).fill('exact'),
    ...Array(shifted).fill('shifted'),
    ...Array(miss).fill('miss'),
  ];

  return (
    <div className="flex gap-1 items-center">
      {pips.map((type, i) => (
        <span
          key={i}
          className={`w-2.5 h-2.5 rounded-full ${animate ? 'animate-scale-in' : ''}`}
          style={{
            background:
              type === 'exact' ? 'hsl(var(--code-exact))'
              : type === 'shifted' ? 'hsl(var(--code-shifted))'
              : 'hsl(var(--code-divider))',
            boxShadow:
              type === 'exact' ? '0 0 6px hsl(var(--code-exact) / 0.5)'
              : type === 'shifted' ? '0 0 6px hsl(var(--code-shifted) / 0.5)'
              : 'none',
            animationDelay: animate ? `${i * 100}ms` : undefined,
            animationFillMode: 'both',
          }}
        />
      ))}
    </div>
  );
};
