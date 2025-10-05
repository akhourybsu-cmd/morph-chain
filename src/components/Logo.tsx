export const Logo = ({ className = "" }: { className?: string }) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg
        width="28"
        height="28"
        viewBox="0 0 28 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-primary"
        aria-hidden="true"
      >
        {/* Negative space path mark - M morphing into C */}
        <path
          d="M4 6 L4 22 L8 22 L8 10 L12 22 L16 22 L20 10 L20 22 L24 22 L24 6 L18 6 L14 18 L10 6 Z"
          fill="currentColor"
          opacity="0.2"
        />
        <path
          d="M6 8 L6 20 M10 8 L14 20 M18 8 L14 20 M22 8 L22 20"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="font-semibold text-lg tracking-tight">Morph Chain</span>
    </div>
  );
};
