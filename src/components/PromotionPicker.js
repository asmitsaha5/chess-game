const PROMOTION_OPTIONS = [{ piece: 'q', label: 'Queen' }, { piece: 'r', label: 'Rook' }, { piece: 'b', label: 'Bishop' }, { piece: 'n', label: 'Knight' }];

export default function PromotionPicker({ onChoose }) {
  return <div className="promotion-backdrop"><div className="promotion-picker" role="dialog" aria-label="Choose promotion piece"><span className="label">Promote pawn</span><div className="promotion-options">{PROMOTION_OPTIONS.map((option) => <button key={option.piece} type="button" onClick={() => onChoose(option.piece)}>{option.label}</button>)}</div></div></div>;
}
