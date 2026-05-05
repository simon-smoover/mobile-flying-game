# Dream Surfer

Browser prototype: Vite + React + TypeScript + Three.js. See [prd.md](./prd.md) for vision, scope, and module plan. QA matrix: [test strategy.md](./test strategy.md).

## Local

```bash
npm install
npm run dev
npm run test   # unit tests (terrain / clipping math)
```

## Vercel

Connect this GitHub repository in Vercel, choose **Vite**, defaults: build `npm run build`, output `dist`.

## Audio Assets

`public/audio/` contains placeholders expected by `src/audio/AudioManager.ts`:

- `music_loop_128bpm.mp3`
- `boost_layer_128bpm.mp3`
- `collect.wav`
- `crash.wav`
- `ui_click.wav`

Replace these with original/licensed royalty-free assets (no copyrighted game music).
