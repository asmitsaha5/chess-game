export default function GameOverModal({ status, onRestart }) {
  return <div className="game-over-backdrop"><div className="game-over" role="status"><span>Game over</span><p>{status.title}</p><strong>{status.detail}</strong><button type="button" onClick={onRestart}>Play again</button></div></div>;
}
