/** Pointer / touch drag steering in normalized -1..1 (clamped). */
export class InputController {
  steerX = 0;
  steerY = 0;
  private active = false;
  private lastX = 0;
  private lastY = 0;
  private readonly sensitivity = 0.0045;

  constructor(private readonly el: HTMLElement) {
    el.style.touchAction = 'none';
    el.addEventListener('pointerdown', this.onDown);
    el.addEventListener('pointermove', this.onMove);
    el.addEventListener('pointerup', this.onUp);
    el.addEventListener('pointercancel', this.onUp);
    el.addEventListener('pointerleave', this.onLeave);
  }

  private readonly onDown = (e: PointerEvent) => {
    this.active = true;
    this.lastX = e.clientX;
    this.lastY = e.clientY;
    try {
      this.el.setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  private readonly onMove = (e: PointerEvent) => {
    if (!this.active) return;
    const dx = e.clientX - this.lastX;
    const dy = e.clientY - this.lastY;
    this.lastX = e.clientX;
    this.lastY = e.clientY;
    this.steerX = clamp(this.steerX + dx * this.sensitivity, -1, 1);
    this.steerY = clamp(this.steerY - dy * this.sensitivity, -1, 1);
  };

  private readonly onUp = (e: PointerEvent) => {
    this.active = false;
    try {
      this.el.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  private readonly onLeave = () => {
    this.active = false;
  };

  /** Decay toward center when not dragging (called each frame). */
  relax(dt: number, rate = 1.1) {
    if (this.active) return;
    const k = Math.exp(-rate * dt);
    this.steerX *= k;
    this.steerY *= k;
  }

  dispose() {
    this.el.removeEventListener('pointerdown', this.onDown);
    this.el.removeEventListener('pointermove', this.onMove);
    this.el.removeEventListener('pointerup', this.onUp);
    this.el.removeEventListener('pointercancel', this.onUp);
    this.el.removeEventListener('pointerleave', this.onLeave);
  }
}

function clamp(v: number, a: number, b: number) {
  return Math.min(b, Math.max(a, v));
}
