import { Howler } from 'howler';

/** Procedural SFX via Web Audio; Howler owns global volume / unlock helpers. */
export class AudioManager {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private ambient: OscillatorNode | null = null;
  private ambientGain: GainNode | null = null;

  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.55;
      this.master.connect(this.ctx.destination);

      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.value = 0.08;
      this.ambient = this.ctx.createOscillator();
      this.ambient.type = 'sine';
      this.ambient.frequency.value = 110;
      this.ambient.connect(this.ambientGain);
      this.ambientGain.connect(this.master);
      this.ambient.start();
    }
    void this.ctx?.resume();
  }

  setVolume(v: number) {
    Howler.volume(v);
    if (this.master) this.master.gain.value = v * 0.55;
  }

  setBoostDrive(amount: number) {
    if (!this.ambientGain) return;
    this.ambientGain.gain.value = 0.06 + amount * 0.14;
    if (this.ambient) this.ambient.frequency.value = 110 + amount * 55;
  }

  playCollect() {
    this.beep(880, 0.05, 0.12, 'sine');
    this.beep(1320, 0.04, 0.08, 'triangle');
  }

  playBoost() {
    this.beep(220, 0.12, 0.2, 'sawtooth');
    this.beep(440, 0.1, 0.16, 'square');
  }

  playCrash() {
    this.beep(120, 0.22, 0.35, 'sawtooth');
    this.beep(60, 0.35, 0.2, 'sine');
  }

  private beep(freq: number, dur: number, vol: number, type: OscillatorType) {
    if (!this.ctx || !this.master) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.value = 0.0001;
    o.connect(g);
    g.connect(this.master);
    const t0 = this.ctx.currentTime;
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.start(t0);
    o.stop(t0 + dur + 0.02);
  }

  dispose() {
    try {
      this.ambient?.stop();
    } catch {
      /* ignore */
    }
    this.ctx?.close();
    this.ctx = null;
    this.master = null;
    this.ambient = null;
    this.ambientGain = null;
  }
}
