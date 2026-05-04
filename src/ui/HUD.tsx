type HudProps = {
  visible: boolean;
  score: number;
  combo: number;
  themeLabel: string;
};

export function HUD({ visible, score, combo, themeLabel }: HudProps) {
  if (!visible) return null;
  return (
    <div className="hud">
      <div className="theme">{themeLabel}</div>
      <div className="score">{score}</div>
      <div className="combo">×{combo}</div>
    </div>
  );
}
