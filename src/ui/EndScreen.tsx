type EndProps = {
  visible: boolean;
  score: number;
  onRestart: () => void;
};

export function EndScreen({ visible, score, onRestart }: EndProps) {
  if (!visible) return null;
  return (
    <div className="overlay end">
      <p>Wipeout</p>
      <p className="bigScore">{score}</p>
      <button type="button" onClick={onRestart}>
        Again
      </button>
    </div>
  );
}
