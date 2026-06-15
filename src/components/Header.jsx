import './Header.css'

// Header is a presentational component: no state, no props, no API calls.
// It just renders the app's branding bar at the top of the page.
// We use the semantic <header> element so screen readers and browsers
// understand this is the page's banner region.
const Header = () => {
  return (
    <header className="App-header">
      <h1 className="app-title">🎬 Flixster</h1>
      <p className="app-tagline">Now playing in theaters</p>
    </header>
  )
}

export default Header
