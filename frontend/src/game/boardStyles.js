export const BOARD_THEMES = {
  classic: { name: 'Classic', light: '#f0d9b5', dark: '#b58863', lastMove: 'rgba(244, 201, 93, 0.42)', selected: 'rgba(255, 214, 102, 0.72)', move: 'rgba(40, 56, 38, 0.32)', capture: 'rgba(183, 48, 48, 0.5)' },
  ocean: { name: 'Ocean', light: '#d5edf6', dark: '#4f8fa8', lastMove: 'rgba(244, 201, 93, 0.44)', selected: 'rgba(255, 214, 102, 0.76)', move: 'rgba(12, 70, 92, 0.32)', capture: 'rgba(187, 62, 62, 0.54)' },
  forest: { name: 'Forest', light: '#e3e1bd', dark: '#6f8f4e', lastMove: 'rgba(244, 201, 93, 0.44)', selected: 'rgba(255, 214, 102, 0.76)', move: 'rgba(38, 76, 48, 0.34)', capture: 'rgba(160, 50, 46, 0.56)' },
};

export function getHighlightStyles(square, legalMoves, theme) {
  const styles = { [square]: { background: `radial-gradient(circle, transparent 58%, ${theme.selected} 60%, ${theme.selected} 72%, transparent 74%)` } };
  legalMoves.forEach((move) => {
    styles[move.to] = move.captured
      ? { background: `radial-gradient(circle, transparent 50%, ${theme.capture} 52%, ${theme.capture} 72%, transparent 74%)` }
      : { background: `radial-gradient(circle, ${theme.move} 18%, transparent 20%)` };
  });
  return styles;
}

export function getLastMoveStyles(lastMove, theme) {
  if (!lastMove) return {};
  return { [lastMove.from]: { background: `linear-gradient(${theme.lastMove}, ${theme.lastMove})` }, [lastMove.to]: { background: `linear-gradient(${theme.lastMove}, ${theme.lastMove})` } };
}
