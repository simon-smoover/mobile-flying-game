/** Thin RAF wrapper; SceneManager owns the actual loop for this prototype. */
export class GameLoop {
  private running = false;

  constructor(private readonly tick: (dt: number, time: number) => void) {}

  start() {
    this.running = true;
    let last = performance.now();
    const loop = (t: number) => {
      if (!this.running) return;
      requestAnimationFrame(loop);
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      this.tick(dt, t / 1000);
    };
    requestAnimationFrame(loop);
  }

  stop() {
    this.running = false;
  }
}
