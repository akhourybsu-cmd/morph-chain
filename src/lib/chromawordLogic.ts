// Pure scoring + colorization. Dictionary is injected by caller (use Morph Chain's pipeline).

import {
  HSV, CHROMA_WEIGHTS, VALUE_EXACT, VALUE_PRESENT, VALUE_ABSENT,
  SAT_ABSENT_GATE, letterHue, letterSaturation, alphaIndex, circDist, hsvToHex, lerp
} from './chromawordConfig'

export type Weights = { presence: number; position: number; alpha: number }
export type TileMeta = { present: boolean; posMatch: boolean; alphaDistance: number }
export type TileOut  = { hsv: HSV; hex: string }
export type ScoreOut = { similarity: number; tiles: TileOut[]; meta: TileMeta[]; win: boolean }

export function scoreGuess(guess: string, target: string, weights: Weights = CHROMA_WEIGHTS): ScoreOut {
  const T = target.toUpperCase().split('')
  const G = guess.toUpperCase().split('')
  const len = T.length

  // Presence (multiset-aware): counts in target
  const tCounts: Record<string, number> = {}
  for (const ch of T) tCounts[ch] = (tCounts[ch] || 0) + 1

  const presentMask = G.map(ch => (tCounts[ch] || 0) > 0)
  const posMatch    = G.map((ch, i) => T[i] === ch)
  const alphaDist   = G.map((ch, i) => circDist(alphaIndex(ch), alphaIndex(T[i])) / 13) // 0..1

  const perCosts = G.map((_, i) =>
    weights.presence * (presentMask[i] ? 0 : 1) +
    weights.position * (posMatch[i] ? 0 : (presentMask[i] ? 0.5 : 1)) +
    weights.alpha    * alphaDist[i]
  )
  const maxCost = weights.presence + weights.position + weights.alpha
  const similarity = 1 - (perCosts.reduce((a,b)=>a+b,0) / (len * maxCost))

  const tiles: TileOut[] = G.map((ch, i) => {
    const hGuess = letterHue(ch)
    const hTarget = letterHue(T[i])
    const t = 1 - alphaDist[i]
    const h = lerp(hGuess, hTarget, t)
    const present = presentMask[i]
    const pos = posMatch[i]
    const s = letterSaturation(ch) * (present ? 1 : SAT_ABSENT_GATE)
    const v = pos ? VALUE_EXACT : (present ? VALUE_PRESENT : VALUE_ABSENT)
    const hsv: HSV = { h, s, v }
    return { hsv, hex: hsvToHex(hsv) }
  })

  const meta: TileMeta[] = G.map((_, i) => ({
    present: presentMask[i], posMatch: posMatch[i], alphaDistance: alphaDist[i]
  }))

  const win = posMatch.every(Boolean) && guess.length === target.length
  return { similarity, tiles, meta, win }
}
