import './Sidebar.css'

// Sidebar is a persistent left navigation bar with three "pages":
// Home, Favorites, and Watched. It's presentational — App owns the active
// `view` and the counts; the sidebar just renders the nav and reports clicks.
//
// Props:
//   view       - the active page: 'home' | 'favorites' | 'watched'
//   onNavigate - called with a page id when a nav item is clicked
//   favoritesCount / watchedCount - shown as badges next to the labels
const NAV = [
  { id: 'home', label: 'Home', icon: '🏠' },
  { id: 'favorites', label: 'Favorites', icon: '♥' },
  { id: 'watched', label: 'Watched', icon: '👁' },
]

const Sidebar = ({ view, onNavigate, favoritesCount, watchedCount }) => {
  const countFor = (id) =>
    id === 'favorites' ? favoritesCount : id === 'watched' ? watchedCount : null

  return (
    <nav className="sidebar" aria-label="Primary">
      <ul className="sidebar-nav">
        {NAV.map((item) => {
          const count = countFor(item.id)
          const isActive = view === item.id
          return (
            <li key={item.id}>
              <button
                type="button"
                className={isActive ? 'sidebar-link is-active' : 'sidebar-link'}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => onNavigate(item.id)}
              >
                <span className="sidebar-icon" aria-hidden="true">{item.icon}</span>
                <span className="sidebar-label">{item.label}</span>
                {count !== null && <span className="sidebar-badge">{count}</span>}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

export default Sidebar
