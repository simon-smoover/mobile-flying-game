import { Howl, Howler } from 'howler';

export type IntensityLevel = 0 | 1 | 2;

/**
 * Modular Howler-based audio system.
 * Uses placeholder files from `/public/audio` until replaced by real licensed assets.
 */
export class AudioManager {
  private initialized = false;
  private musicStarted = false;
  private intensity: IntensityLevel = 0;

  masterVolume = 1;
  musicVolume = 0.8;
  sfxVolume = 0.95;

  private musicIntro!: Howl;
  private musicDrive!: Howl;
  private boostLayer!: Howl;
  private collectSfx!: Howl;
  private crashSfx!: Howl;
  private uiClickSfx!: Howl;

  init() {
    if (this.initialized) return;
    this.initialized = true;

    this.musicIntro = this.createHowl('/audio/music_loop_128bpm.mp3', true, 0.65, 'music');
    this.musicDrive = this.createHowl('/audio/music_loop_128bpm.mp3', true, 0.85, 'music');
    this.boostLayer = this.createHowl('/audio/boost_layer_128bpm.mp3', true, 0, 'music');

    this.collectSfx = this.createHowl('/audio/collect.wav', false, 1, 'sfx');
    this.crashSfx = this.createHowl('/audio/crash.wav', false, 1, 'sfx');
    this.uiClickSfx = this.createHowl('/audio/ui_click.wav', false, 0.8, 'sfx');

    this.applyVolumes();
  }

  startMusic() {
    if (!this.initialized) this.init();
    if (this.musicStarted) return;
    this.musicStarted = true;
    this.ensurePlaying(this.musicIntro);
    this.ensurePlaying(this.musicDrive);
    this.ensurePlaying(this.boostLayer);
    this.setIntensity(1);
  }

  stopMusic() {
    if (!this.initialized) return;
    this.musicStarted = false;
    this.musicIntro.stop();
    this.musicDrive.stop();
    this.boostLayer.stop();
  }

  playCollect() {
    if (!this.initialized) return;
    this.collectSfx.stop();
    this.collectSfx.play();
  }

  playBoostStart() {
    if (!this.initialized) return;
    this.boostLayer.fade(this.boostLayer.volume(), this.scaledMusic(0.75), 300);
  }

  playBoostEnd() {
    if (!this.initialized) return;
    this.boostLayer.fade(this.boostLayer.volume(), 0, 300);
  }

  playCrash() {
    if (!this.initialized) return;
    this.crashSfx.stop();
    this.crashSfx.play();
    // Quick dip after crash; restart sets intensity back to driving.
    this.setIntensity(0);
  }

  playUiClick() {
    if (!this.initialized) return;
    this.uiClickSfx.stop();
    this.uiClickSfx.play();
  }

  setIntensity(level: number) {
    if (!this.initialized) return;
    const clamped = (level < 1 ? 0 : level < 2 ? 1 : 2) as IntensityLevel;
    this.intensity = clamped;
    if (!this.musicStarted) return;

    // Level 0: ambient intro, Level 1: driving loop, Level 2: +boost layer.
    const introTarget = clamped === 0 ? 0.6 : 0.05;
    const driveTarget = clamped >= 1 ? 0.85 : 0.18;
    const boostTarget = clamped === 2 ? 0.75 : 0;

    this.musicIntro.fade(this.musicIntro.volume(), this.scaledMusic(introTarget), 240);
    this.musicDrive.fade(this.musicDrive.volume(), this.scaledMusic(driveTarget), 240);
    this.boostLayer.fade(this.boostLayer.volume(), this.scaledMusic(boostTarget), 300);
  }

  setMasterVolume(value: number) {
    this.masterVolume = clamp01(value);
    this.applyVolumes();
  }

  setMusicVolume(value: number) {
    this.musicVolume = clamp01(value);
    this.applyVolumes();
  }

  setSfxVolume(value: number) {
    this.sfxVolume = clamp01(value);
    this.applyVolumes();
  }

  private applyVolumes() {
    Howler.volume(this.masterVolume);
    if (!this.initialized) return;
    this.musicIntro.volume(this.scaledMusic(this.intensity === 0 ? 0.6 : 0.05));
    this.musicDrive.volume(this.scaledMusic(this.intensity >= 1 ? 0.85 : 0.18));
    this.boostLayer.volume(this.scaledMusic(this.intensity === 2 ? 0.75 : 0));
    this.collectSfx.volume(this.scaledSfx(1));
    this.crashSfx.volume(this.scaledSfx(1));
    this.uiClickSfx.volume(this.scaledSfx(0.8));
  }

  private scaledMusic(base: number) {
    return clamp01(base * this.musicVolume);
  }

  private scaledSfx(base: number) {
    return clamp01(base * this.sfxVolume);
  }

  private ensurePlaying(sound: Howl) {
    if (!sound.playing()) sound.play();
  }

  private createHowl(src: string, loop: boolean, baseVolume: number, channel: 'music' | 'sfx') {
    return new Howl({
      src: [src],
      loop,
      volume: channel === 'music' ? this.scaledMusic(baseVolume) : this.scaledSfx(baseVolume),
      html5: false,
      preload: true,
      onloaderror: (_id, err) => {
        console.warn(`[AudioManager] Failed to load ${src}`, err);
      },
      onplayerror: (_id, err) => {
        console.warn(`[AudioManager] Failed to play ${src}`, err);
      },
    });
  }

  dispose() {
    if (!this.initialized) return;
    this.stopMusic();
    this.musicIntro.unload();
    this.musicDrive.unload();
    this.boostLayer.unload();
    this.collectSfx.unload();
    this.crashSfx.unload();
    this.uiClickSfx.unload();
    this.initialized = false;
  }
}

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}
