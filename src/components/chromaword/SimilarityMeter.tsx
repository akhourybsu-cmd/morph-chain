export default function SimilarityMeter({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, Math.round(value * 100)))
  return (
    <div
      role="img" aria-label={`Spectrum alignment ${pct} percent`}
      style={{
        height: 14,
        borderRadius: 999,
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.10)',
        overflow: 'hidden',
        boxShadow: 'inset 0 0 10px rgba(0,0,0,0.35)'
      }}
    >
      <div
        style={{
          width: pct + '%',
          height: '100%',
          background: 'linear-gradient(90deg,#ff62c8,#ff7f50,#ffd873,#8bff8b,#7fd0ff,#9a86ff,#ce6bff)'
        }}
      />
    </div>
  )
}
