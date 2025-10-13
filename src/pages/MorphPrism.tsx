import { useMemo, useState } from 'react'
import { scoreGuess } from '../lib/chromawordLogic'
import SimilarityMeter from '../components/chromaword/SimilarityMeter'
import ChromaTile from '../components/chromaword/ChromaTile'
import { VALID_WORDS_5 } from '@/lib/gameLogic'

type Props = { dict5?: Set<string>; puzzleId?: string; target?: string }
const DEFAULT_TARGET = 'SHINE'

export default function MorphPrism({ dict5 = VALID_WORDS_5, puzzleId = 'cw_demo_001', target = DEFAULT_TARGET }: Props) {
  const WORD_LEN = target.length
  const MAX_GUESSES = 6

  type Guess = { word: string; colors: string[]; similarity: number }
  const [rows, setRows] = useState<Guess[]>([])
  const [current, setCurrent] = useState('')
  const [win, setWin] = useState(false)
  const [revealSpectrum, setRevealSpectrum] = useState(false)
  const [message, setMessage] = useState('')

  const spectrum = useMemo(() => {
    if (!rows.length) return []
    return scoreGuess(rows[rows.length-1].word, target).tiles
  }, [rows, target])

  const submit = () => {
    if (win) return
    if (current.length !== WORD_LEN) { setMessage('Not enough letters'); return }
    const word = current.toUpperCase()
    if (!dict5.has(word)) { setMessage('Not in dictionary'); return }
    const scored = scoreGuess(word, target)
    const colors = scored.tiles.map(t => t.hex)
    const guess = { word, colors, similarity: scored.similarity }
    const next = [...rows, guess]
    setRows(next)
    setCurrent(''); setMessage('')
    if (scored.win) { setWin(true); setRevealSpectrum(true) }
    else if (next.length >= MAX_GUESSES) { setRevealSpectrum(true) }
  }

  return (
    <div className="cw-container">
      <header className="cw-header">
        <div className="cw-logo">CHROMAWORD</div>
        <div className="cw-controls">
          <span className="cw-badge">Puzzle: {puzzleId}</span>
          <button className="cw-ghost" onClick={()=>setRevealSpectrum(v=>!v)}>{revealSpectrum? 'Hide' : 'Show'} Spectrum</button>
        </div>
      </header>

      <div className="cw-top">
        <div className="cw-spectrum" style={{
          opacity: revealSpectrum ? 1 : 0.2,
          background: spectrum.length ? `linear-gradient(90deg, ${spectrum.map(t=>t.hex).join(',')})` : undefined
        }} />
        <div className="cw-subtle">{win? '✨ Prism complete!' : 'Type a 5-letter word. Color = closeness; bar = alignment.'}</div>
        <div className="cw-input">
          <input className="cw-textin" maxLength={WORD_LEN} value={current}
            onChange={e=>setCurrent(e.target.value.toUpperCase().replace(/[^A-Z]/g,'').slice(0,WORD_LEN))}
            placeholder="TYPE HERE" />
          <button className="cw-primary" onClick={submit}>Submit</button>
        </div>
      </div>

      <main className="cw-board">
        {rows.map((r, idx) => (
          <div className="cw-row" style={{ ['--len' as any]: WORD_LEN }} key={idx}>
            {Array.from({ length: WORD_LEN }).map((_, i) => (
              <ChromaTile key={i} letter={(r.word[i]||'')} bgHex={r.colors[i]||'transparent'} glow/>
            ))}
            <SimilarityMeter value={r.similarity}/>
          </div>
        ))}
        {!win && rows.length < MAX_GUESSES && (
          <div className="cw-row" style={{ ['--len' as any]: WORD_LEN }}>
            {Array.from({ length: WORD_LEN }).map((_, i) => (
              <ChromaTile key={i} letter={(current[i]||'')} bgHex={'transparent'}/>
            ))}
            <SimilarityMeter value={0}/>
          </div>
        )}
      </main>

      <div className="cw-footer">
        <div>{message}</div>
        <div className="cw-legend">Color intensity ≈ presence/position • Hue ≈ letter proximity • Bar ≈ alignment</div>
      </div>
    </div>
  )
}
