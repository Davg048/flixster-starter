import './Header.css'
import ThemeToggle from './ThemeToggle'

// Header renders the app's branding bar plus the theme toggle. It owns no state
// itself — `theme` and `onToggleTheme` are passed down from App.
// We use the semantic <header> element so screen readers and browsers
// understand this is the page's banner region.
const Header = ({ theme, onToggleTheme }) => {
  return (
    <header className="App-header">
      {/* Two-tone wordmark: "Flix" in the default light, "ster" in cream so
          the brand accent appears where identity lives. The 🎬 is decorative,
          so aria-hidden keeps screen readers from announcing "clapper board". */}
      <h1 className="app-title">
        <span className="brand-mark" aria-hidden="true">🎬</span>
        Flix<span className="brand-accent">ster</span>
      </h1>
      <p className="app-tagline">Now playing in theaters</p>
      <ThemeToggle theme={theme} onToggle={onToggleTheme} />
    </header>
  )
}

export default Header
