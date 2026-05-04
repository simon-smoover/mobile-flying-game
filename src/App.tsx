import { useEffect, useRef, useState } from 'react';
import { FlightGame, type UiSnapshot } from './engine/FlightGame';
import { EndScreen } from './ui/EndScreen';
import { HUD } from './ui/HUD';
import { StartScreen } from './ui/StartScreen';

export default function App() {
  const viewportRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<FlightGame | null>(null);
  const [ui, setUi] = useState<UiSnapshot>({
    state: 'menu',
    score: 0,
    combo: 1,
    themeLabel: 'loading',
  });

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const game = new FlightGame(el, setUi);
    gameRef.current = game;
    return () => {
      game.dispose();
      gameRef.current = null;
    };
  }, []);

  return (
    <div className="app">
      <div className="viewport" ref={viewportRef} />
      <HUD
        visible={ui.state === 'playing'}
        score={ui.score}
        combo={ui.combo}
        themeLabel={ui.themeLabel}
      />
      <StartScreen visible={ui.state === 'menu'} onStart={() => gameRef.current?.start()} />
      <EndScreen
        visible={ui.state === 'crashed'}
        score={ui.score}
        onRestart={() => gameRef.current?.restart()}
      />
    </div>
  );
}
