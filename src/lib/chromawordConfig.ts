// Single source of truth for Chromaword math + visuals (set in stone).

export const CHROMA_WEIGHTS = Object.freeze({ presence: 0.5, position: 0.3, alpha: 0.2 })
export const CHROMA_HUE_MAP_VERSION = 'A2Z_hsv_v1'
export const CHROMA_DICT_VERSION_5L = 'core5L_v1'

// Brightness (value) channels
export const VALUE_EXACT = 1.00
export const VALUE_PRESENT = 0.72
export const VALUE_ABSENT = 0.48

// Saturation bounds + gate
export const SAT_MIN = 0.45
export const SAT_MAX = 0.90
export const SAT_ABSENT_GATE = 0.40

const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const FREQ = 'ETAOINSHRDLUCMFYWGPBVKXQJZ' // frequency proxy

export const alphaIndex = (ch: string) => {
  const i = ALPHA.indexOf(ch.toUpperCase())
  return i >= 0 ? i : 0
}

// circular distance on A..Z wheel
export const circDist = (a: number, b: number) => {
  const diff = Math.abs(a - b)
  return Math.min(diff, 26 - diff)
}

// hue for letter (A..Z mapped around wheel)
export const letterHue = (ch: string) => {
  const idx = alphaIndex(ch)
  return Math.round((idx / 26) * 360)
}

// saturation scaled by letter frequency (rarer letters slightly less saturated)
export const letterSaturation = (ch: string) => {
  const r = FREQ.indexOf(ch.toUpperCase())
  const norm = r < 0 ? 1 : r / (FREQ.length - 1) // 0..1
  const s = SAT_MIN + (SAT_MAX - SAT_MIN) * (1 - norm)
  return Math.min(SAT_MAX, Math.max(SAT_MIN, s))
}

// HSV utils
export type HSV = { h: number; s: number; v: number }
export const hsvToRgb = ({ h, s, v }: HSV) => {
  const c = v * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = v - c
  let r=0,g=0,b=0
  if (0<=h && h<60){r=c;g=x;b=0}
  else if (60<=h && h<120){r=x;g=c;b=0}
  else if (120<=h && h<180){r=0;g=c;b=x}
  else if (180<=h && h<240){r=0;g=x;b=c}
  else if (240<=h && h<300){r=x;g=0;b=c}
  else {r=c;g=0;b=x}
  const R = Math.round((r+m)*255), G = Math.round((g+m)*255), B = Math.round((b+m)*255)
  return { r:R, g:G, b:B }
}
export const rgbToHex = (r:number,g:number,b:number) =>
  '#' + [r,g,b].map(x=>x.toString(16).padStart(2,'0')).join('')
export const hsvToHex = (hsv: HSV) => {
  const { r, g, b } = hsvToRgb(hsv)
  return rgbToHex(r,g,b)
}
export const lerp = (a:number,b:number,t:number) => a + (b-a)*t
