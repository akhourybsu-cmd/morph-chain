interface SimilarityMeterProps {
  similarity: number;
}

export const SimilarityMeter = ({ similarity }: SimilarityMeterProps) => {
  const percentage = Math.round(similarity * 100);
  
  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-sm font-mono font-semibold min-w-[3rem] text-right">
        {percentage}%
      </span>
    </div>
  );
};
