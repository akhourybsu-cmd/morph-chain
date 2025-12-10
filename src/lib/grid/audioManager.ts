// Web Audio API sound manager for Morph Grid
let audioContext: AudioContext | null = null;

// Pentatonic scale notes for tile selection (C4 to A4)
const PENTATONIC_FREQUENCIES = [261.63, 293.66, 329.63, 392.00, 440.00];

const getAudioContext = (): AudioContext | null => {
  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
      console.warn('Web Audio API not supported');
      return null;
    }
  }
  
  // Resume if suspended (required by browsers after user interaction)
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  
  return audioContext;
};

// Create an oscillator with envelope
const playTone = (
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume: number = 0.15,
  attackTime: number = 0.01,
  decayTime: number = 0.1
) => {
  const ctx = getAudioContext();
  if (!ctx) return;

  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

  // ADSR envelope
  gainNode.gain.setValueAtTime(0, ctx.currentTime);
  gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + attackTime);
  gainNode.gain.linearRampToValueAtTime(volume * 0.7, ctx.currentTime + attackTime + decayTime);
  gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + duration);
};

// Tile selection sound - rising pitch based on chain position
export const playTileSelect = (chainIndex: number) => {
  const noteIndex = Math.min(chainIndex, PENTATONIC_FREQUENCIES.length - 1);
  const frequency = PENTATONIC_FREQUENCIES[noteIndex];
  playTone(frequency, 0.08, 'sine', 0.12, 0.005, 0.03);
};

// Backtrack sound - descending soft blip
export const playBacktrack = () => {
  const ctx = getAudioContext();
  if (!ctx) return;

  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(400, ctx.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.08);

  gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
  gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.08);

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + 0.08);
};

// Invalid move sound - low muted thud
export const playInvalidMove = () => {
  const ctx = getAudioContext();
  if (!ctx) return;

  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.type = 'triangle';
  oscillator.frequency.setValueAtTime(80, ctx.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.1);

  gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
  gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.1);

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + 0.1);
};

// Word submission sound - escalating chimes based on word length
export const playWordSubmit = (wordLength: number) => {
  const ctx = getAudioContext();
  if (!ctx) return;

  // Base frequencies and intensity based on word length
  const configs: Record<number, { freqs: number[]; volume: number; duration: number }> = {
    3: { freqs: [523.25], volume: 0.12, duration: 0.15 },           // C5 - soft single note
    4: { freqs: [523.25, 659.25], volume: 0.14, duration: 0.2 },    // C5, E5 - two notes
    5: { freqs: [523.25, 659.25, 783.99], volume: 0.16, duration: 0.25 }, // C5, E5, G5 - chord
    6: { freqs: [523.25, 659.25, 783.99, 1046.5], volume: 0.18, duration: 0.3 }, // Add C6
    7: { freqs: [523.25, 659.25, 783.99, 1046.5, 1318.5], volume: 0.2, duration: 0.35 }, // Epic fanfare
  };

  const config = configs[Math.min(wordLength, 7)] || configs[3];

  config.freqs.forEach((freq, i) => {
    setTimeout(() => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(config.volume, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + config.duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + config.duration);
    }, i * 40); // Stagger notes slightly
  });
};

// Tile upgrade sound - shimmer power-up effect
export const playTileUpgrade = (fromTier: 'orange' | 'blue' = 'orange') => {
  const ctx = getAudioContext();
  if (!ctx) return;

  // Higher pitch for blue->purple upgrade
  const baseFreq = fromTier === 'blue' ? 880 : 660;

  // Create a shimmer effect with multiple quick notes
  [0, 1, 2].forEach((i) => {
    setTimeout(() => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq + i * 100, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(baseFreq + i * 150 + 200, ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.12);
    }, i * 30);
  });
};

// Initialize audio context on first user interaction
export const initAudio = () => {
  getAudioContext();
};
