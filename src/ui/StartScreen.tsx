type StartProps = {
  visible: boolean;
  onStart: () => void;
};

export function StartScreen({ visible, onStart }: StartProps) {
  if (!visible) return null;
  return (
    <div className="overlay start">
      <h1>Dream Surfer</h1>
      <p>Drag anywhere to steer through the corridor. Rings raise your combo. Gates and long chains trigger boost.</p>
      <button type="button" onClick={onStart}>
        Surf
      </button>
    </div>
  );
}
