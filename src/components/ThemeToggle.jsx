import './ThemeToggle.css'

// ThemeToggle is a controlled button: App owns the `theme` value and passes a
// toggle callback. It's a real <button> so it's keyboard-focusable and gets the
// global :focus-visible ring for free. aria-pressed + a dynamic aria-label make
// its state and purpose clear to screen readers.
const ThemeToggle = ({ theme, onToggle }) => {
  const isLight = theme === 'light'
  return (
    <button
      className="theme-toggle"
      onClick={onToggle}
      aria-pressed={isLight}
      aria-label={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
      title={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
    >
      {/* Show the icon of the mode you'd switch TO. aria-hidden: the label
          above already conveys the meaning, so the emoji is decorative. */}
      <span aria-hidden="true">{isLight ? '🌙' : '☀️'}</span>
    </button>
  )
}

export default ThemeToggle
