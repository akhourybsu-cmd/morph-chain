export default function ChromaTile({ letter, bgHex, glow }: { letter: string; bgHex: string; glow?: boolean }) {
  return (
    <div
      className={`cw-tile ${glow ? 'cw-glow' : ''}`}
      style={{ background: bgHex, borderColor: 'rgba(255,255,255,0.12)' }}
    >
      <span className="cw-letter">{letter}</span>
      <span className="cw-sheen" />
    </div>
  )
}
