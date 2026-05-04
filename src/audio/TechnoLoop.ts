/**
 * Procedural 4/4 techno loop (four-on-the-floor kick, 16th hats/shaker, rolling bass).
 * Sidechain ducks the musical bus — not the kick — for a simple “pumping” feel.
 */

export class TechnoLoop {
  private ctx: AudioContext | null = null;
  private out: GainNode | null = null;
  private bus: GainNode | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private next16 = 0;
  private step = 0;
  private readonly bpm = 126;

  attach(ctx: AudioContext, destination: AudioNode) {
    this.ctx = ctx;
    this.out = ctx.createGain();
    this.out.gain.value = 0.42;
    this.out.connect(destination);

    this.bus = ctx.createGain();
    this.bus.gain.value = 1;
    this.bus.connect(this.out);

    const sp16 = 60 / this.bpm / 4;
    this.next16 = ctx.currentTime + 0.05;
    this.step = 0;
    this.timer = setInterval(() => this.schedule(), 80);
    while (this.next16 < ctx.currentTime + 0.35) {
      this.scheduleOne(sp16);
    }
  }

  private schedule() {
    if (!this.ctx) return;
    const sp16 = 60 / this.bpm / 4;
    while (this.next16 < this.ctx.currentTime + 0.25) {
      this.scheduleOne(sp16);
    }
  }

  private scheduleOne(sp16: number) {
    if (!this.ctx || !this.out || !this.bus) return;
    const t = this.next16;
    const beat = this.step >> 2;
    const sixteenth = this.step & 15;

    if (sixteenth % 4 === 0) {
      this.kick(t);
      this.duckBus(t, sp16 * 0.38);
    }
    if (sixteenth % 4 === 2) {
      this.closedHat(t);
    }
    if (sixteenth % 2 === 1) {
      this.shaker(t, sixteenth);
    }
    if (sixteenth === 0 || sixteenth === 8) {
      const root = 55 * (1 + (beat % 2) * 0.25);
      this.bassNote(t, sp16 * 3.8, root);
    }

    this.next16 += sp16;
    this.step += 1;
  }

  private duckBus(t: number, dur: number) {
    if (!this.ctx || !this.bus) return;
    const g = this.bus.gain;
    g.cancelScheduledValues(t);
    g.setValueAtTime(1, t);
    g.linearRampToValueAtTime(0.42, t + 0.014);
    g.linearRampToValueAtTime(1, t + dur);
  }

  private kick(t: number) {
    if (!this.ctx || !this.out) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    o.type = 'sine';
    o.frequency.setValueAtTime(152, t);
    o.frequency.exponentialRampToValueAtTime(48, t + 0.09);
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.62, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
    o.connect(filter);
    filter.connect(g);
    g.connect(this.out);
    o.start(t);
    o.stop(t + 0.22);
  }

  private closedHat(t: number) {
    if (!this.ctx || !this.bus) return;
    const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.03, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2.2);
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const hp = this.ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 7200;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.24, t + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.055);
    src.connect(hp);
    hp.connect(g);
    g.connect(this.bus);
    src.start(t);
    src.stop(t + 0.065);
  }

  private shaker(t: number, sixteenth: number) {
    if (!this.ctx || !this.bus) return;
    const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.02, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.35;
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const g = this.ctx.createGain();
    const accent = sixteenth % 8 === 5 ? 0.11 : 0.065;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(accent, t + 0.001);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);
    src.connect(g);
    g.connect(this.bus);
    src.start(t);
    src.stop(t + 0.04);
  }

  private bassNote(t: number, dur: number, freq: number) {
    if (!this.ctx || !this.bus) return;
    const o = this.ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(freq, t);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(240, t);
    filter.frequency.linearRampToValueAtTime(1100, t + dur * 0.32);
    filter.frequency.exponentialRampToValueAtTime(130, t + dur);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.13, t + 0.018);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(filter);
    filter.connect(g);
    g.connect(this.bus);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  setPump(amount: number) {
    if (!this.out) return;
    this.out.gain.value = 0.35 + amount * 0.28;
  }

  dispose() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    try {
      this.out?.disconnect();
      this.bus?.disconnect();
    } catch {
      /* ignore */
    }
    this.ctx = null;
    this.out = null;
    this.bus = null;
  }
}
