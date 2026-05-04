# Dream Surfer — Test strategy

## Goals

1. **Regression safety** for terrain / clipping logic (CPU mirror of GPU displacement).
2. **Manual coverage** for mobile feel, audio policy, and visuals (cannot be fully automated in CI without device lab).

---

## Test sets

| Set | Type | Where |
|-----|------|--------|
| A | Automated unit | `npm run test` (Vitest) |
| B | Automated static | `npm run lint`, `npm run build` |
| C | Manual / exploratory | Device + browser matrix |
| D | Manual audio | First user gesture, headphones |

---

## Set A — Automated unit tests (`src/world/terrainHeight.test.ts`)

| ID | Case | Expect |
|----|------|--------|
| A1 | `hash2` deterministic | Same inputs → same output, in `[0,1)` |
| A2 | `noise2` bounded | Output in `[0,1]` |
| A3 | `fbm2` finite grid | Many `(x,z)` samples finite, non-explosive |
| A4 | `terrainSurfaceWorldY` sane range | Typical inputs yield plausible Y band |
| A5 | `clampYAboveTerrain` contract | Returned `y ≥ surface + clearance` for a deep sink input |
| A6 | Golden `terrainDisplacementH(0,0,0,0,0)` | Locks CPU path to shader math (update golden if shader changes) |

**When to update golden (A6):** Any edit to `terrain.glsl` vertex displacement or `terrainHeight.ts` noise/fbm must update the expected value and be reviewed with a WebGL sanity check (Set C3).

---

## Set B — Build & lint

| ID | Command | Expect |
|----|---------|--------|
| B1 | `npm run lint` | Exit 0 |
| B2 | `npm run build` | Exit 0, `dist/` produced |

---

## Set C — Manual / exploratory (clipping & motion)

Run on **Chrome Android** + **Safari iOS** (or your target), production build (`npm run preview` or Vercel URL).

| ID | Case | Steps | Pass |
|----|------|-------|------|
| C1 | Dive under “sea” | During flight, drag **hard down** for ≥5s while steering | Never see void under mesh; sphere stays above waves; camera never “under” the floor for sustained frames |
| C2 | Boost dive | Trigger boost, repeat C1 | Same as C1 |
| C3 | Shader / CPU drift check | Visual: note max wave height; compare with dev overlay (optional) | No systematic gap between mesh and clamped player |
| C4 | Long run | 3+ minutes straight | No progressive drift, stable FPS |
| C5 | Restart loop | Crash → Again ×10 | No duplicate canvases / audio nodes (memory) |

---

## Set D — Audio

| ID | Case | Steps | Pass |
|----|------|-------|------|
| D1 | Autoplay policy | Cold load, tap **Surf** once | Techno + SFX audible |
| D2 | Pumping bed | Fly with/without boost | Bus ducks on kick; bass audible |
| D3 | Crash duck | Crash into obstacle | Crash SFX plays; bed recoverable next run |

---

## Execution order (release checklist)

1. `npm run lint`
2. `npm run test`
3. `npm run build`
4. Manual C1–C2 + D1 on at least one phone
5. Git push / deploy

---

## Out of scope (later)

- Visual pixel-diff against GPU readback (heavy).
- Playwright 3D assertions (flaky without deterministic seed/time).
