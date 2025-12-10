export const ChainInstructionText = () => {
  return (
    <div className="px-4 py-4 text-center">
      <p className="text-sm text-[hsl(var(--chain-text-secondary))] leading-relaxed max-w-xs mx-auto">
        Change one letter at a time. Each step must be a valid word.
      </p>
      <p className="text-xs text-[hsl(var(--chain-text-muted))] mt-2">
        Example: COLD → CORD → CARD → CARE
      </p>
    </div>
  );
};
