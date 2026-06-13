"use client";

// Procedural audio generator using Web Audio API
// This avoids having to download external sound files and ensures instant availability.

let audioCtx: AudioContext | null = null;
let sfxEnabled = true;

// Safe initializer for AudioContext (must run after user interaction)
function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    // Standard audio context
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  
  // Resume if suspended (browser security policy)
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  
  return audioCtx;
}

// Check if sound is enabled
export function isSoundEnabled(): boolean {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("tercio-sfx-enabled");
    sfxEnabled = saved !== "false";
  }
  return sfxEnabled;
}

// Toggle sound status
export function setSoundEnabled(enabled: boolean): void {
  sfxEnabled = enabled;
  if (typeof window !== "undefined") {
    localStorage.setItem("tercio-sfx-enabled", enabled ? "true" : "false");
  }
}

// 1. Coins sound (clinking)
export function playCoinSound() {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  
  // Play 2-3 quick metallic clinks
  for (let i = 0; i < 3; i++) {
    const delay = i * 0.06;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    // High-pitched metallic frequencies
    osc.type = "sine";
    osc.frequency.setValueAtTime(1200 + Math.random() * 600, now + delay);
    
    gain.gain.setValueAtTime(0.12, now + delay);
    gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.08);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(now + delay);
    osc.stop(now + delay + 0.1);
  }
}

// 2. Sword sound (clashing steel)
export function playSwordSound() {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  // Sound 1: Metal resonance (high pitch decay)
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();

  osc1.type = "triangle";
  osc1.frequency.setValueAtTime(800, now);
  osc1.frequency.linearRampToValueAtTime(200, now + 0.3);

  osc2.type = "sine";
  osc2.frequency.setValueAtTime(630, now);
  osc2.frequency.linearRampToValueAtTime(150, now + 0.25);

  // Sound 2: Impact noise burst
  const bufferSize = ctx.sampleRate * 0.15; // 0.15 seconds
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  
  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = "bandpass";
  noiseFilter.frequency.setValueAtTime(1000, now);
  noiseFilter.frequency.exponentialRampToValueAtTime(300, now + 0.12);
  noiseFilter.Q.setValueAtTime(3, now);

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.2, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

  gain.gain.setValueAtTime(0.15, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

  // Connections
  osc1.connect(gain);
  osc2.connect(gain);
  gain.connect(ctx.destination);

  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(ctx.destination);

  osc1.start(now);
  osc2.start(now);
  noise.start(now);

  osc1.stop(now + 0.4);
  osc2.stop(now + 0.4);
  noise.stop(now + 0.2);
}

// 3. Paper scroll / page flip sound
export function playPageSound() {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  
  // Synthesize soft paper rustle using noise and filters
  const bufferSize = ctx.sampleRate * 0.25; // 0.25 seconds
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(600, now);
  filter.frequency.linearRampToValueAtTime(250, now + 0.22);
  filter.Q.setValueAtTime(1.5, now);
  
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.05, now);
  gain.gain.linearRampToValueAtTime(0.08, now + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
  
  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  
  source.start(now);
  source.stop(now + 0.3);
}

// 4. Drum thud (marching / action start)
export function playDrumSound() {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.type = "sine";
  osc.frequency.setValueAtTime(130, now);
  osc.frequency.exponentialRampToValueAtTime(35, now + 0.18);
  
  // Soft saturation distortion
  const waveShaper = ctx.createWaveShaper();
  const makeDistortionCurve = (amount = 20) => {
    const k = typeof amount === "number" ? amount : 50;
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;
    for (let i = 0; i < n_samples; ++i) {
      const x = (i * 2) / n_samples - 1;
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    return curve;
  };
  waveShaper.curve = makeDistortionCurve(10);
  
  gain.gain.setValueAtTime(0.35, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
  
  osc.connect(waveShaper);
  waveShaper.connect(gain);
  gain.connect(ctx.destination);
  
  osc.start(now);
  osc.stop(now + 0.25);
}

// 5. Victory fanfare
export function playVictorySound() {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  
  // Simple fanfare chord notes: C4 (261.63), E4 (329.63), G4 (392.00), C5 (523.25)
  const notes = [261.63, 329.63, 392.00, 523.25];
  
  notes.forEach((freq, idx) => {
    const noteDelay = idx * 0.08;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    // Trumpet-like triangle shape
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, now + noteDelay);
    
    // Slight vibrato
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.setValueAtTime(8, now + noteDelay);
    lfoGain.gain.setValueAtTime(5, now + noteDelay);
    
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    
    gain.gain.setValueAtTime(0.0, now + noteDelay);
    gain.gain.linearRampToValueAtTime(0.12, now + noteDelay + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, now + noteDelay + 0.45);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    lfo.start(now + noteDelay);
    osc.start(now + noteDelay);
    
    lfo.stop(now + noteDelay + 0.5);
    osc.stop(now + noteDelay + 0.5);
  });
}

// 6. Defeat sound (descending dark tone)
export function playDefeatSound() {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  
  // Descending, dark chord
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc1.type = "sawtooth";
  osc1.frequency.setValueAtTime(140, now);
  osc1.frequency.linearRampToValueAtTime(85, now + 0.6);
  
  osc2.type = "sine";
  osc2.frequency.setValueAtTime(110, now);
  osc2.frequency.linearRampToValueAtTime(65, now + 0.75);
  
  // Low-pass filter to make it muddy and dark
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(300, now);
  filter.frequency.exponentialRampToValueAtTime(100, now + 0.7);
  
  gain.gain.setValueAtTime(0.2, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
  
  osc1.connect(filter);
  osc2.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  
  osc1.start(now);
  osc2.start(now);
  
  osc1.stop(now + 0.9);
  osc2.stop(now + 0.9);
}
