const COLOR_OPTIONS = [{ key: 'w', label: 'White' }, { key: 'b', label: 'Black' }];
const DIFFICULTY_OPTIONS = [{ key: 'easy', label: 'Easy' }, { key: 'medium', label: 'Medium' }, { key: 'hard', label: 'Hard' }];
const GAME_MODE_OPTIONS = [{ key: 'ai', label: 'vs Computer' }, { key: 'local', label: 'vs Human (local)' }];

function OptionButtons({ options, selected, onSelect }) {
  return <div className="welcome-difficulty-options">{options.map((option) => <button key={option.key} type="button" className={option.key === selected ? 'welcome-difficulty-option active' : 'welcome-difficulty-option'} onClick={() => onSelect(option.key)} aria-pressed={option.key === selected}>{option.label}</button>)}</div>;
}

export default function GameSetup({ mode, difficulty, onModeChange, onDifficultyChange, onStart }) {
  return <div className="welcome-backdrop"><div className="welcome-card" role="dialog" aria-label="Choose player color"><span className="label">Welcome</span><p>Set up your game</p><div className="welcome-section"><span className="label">Game mode</span><OptionButtons options={GAME_MODE_OPTIONS} selected={mode} onSelect={onModeChange} /></div>{mode === 'ai' && <div className="welcome-section"><span className="label">Computer level</span><OptionButtons options={DIFFICULTY_OPTIONS} selected={difficulty} onSelect={onDifficultyChange} /></div>}<div className="welcome-section"><span className="label">{mode === 'local' ? 'Board orientation' : 'Play as'}</span><div className="welcome-options">{COLOR_OPTIONS.map((option) => <button key={option.key} type="button" onClick={() => onStart(option.key)}>{mode === 'local' ? `Start (${option.label} at bottom)` : `Play as ${option.label}`}</button>)}</div></div></div></div>;
}
