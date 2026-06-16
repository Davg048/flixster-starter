import { useEffect, useRef } from 'react'
import './Sidebar.css'

// Sidebar is a presentational drawer. App resolves the favorited/watched IDs
// into full movie objects (via the moviesById registry) and passes them in as
// arrays. The sidebar lists them and exposes filter/clear controls.
//
// Props:
//   isOpen          - whether the drawer is shown
//   onClose         - close the drawer
//   favoriteMovies  - array of movie objects the user favorited
//   watchedMovies   - array of movie objects the user marked watched
//   filterMode      - 'all' | 'favorites' | 'watched' (which list filters the grid)
//   onFilter        - set the grid filter to a given mode
//   onSelectMovie   - open a movie's modal (by id)
const Sidebar = ({
  isOpen,
  onClose,
  favoriteMovies,
  watchedMovies,
  filterMode,
  onFilter,
  onSelectMovie,
}) => {
  const asideRef = useRef(null)
  const closeBtnRef = useRef(null)
  // Hold the latest onClose in a ref so the focus/Escape effect can depend on
  // [isOpen] ALONE. If onClose (a fresh inline closure each render) were a dep,
  // the effect would tear down and re-run on every App re-render while open —
  // flickering focus and clobbering the captured trigger.
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  // Toggle the `inert` PROPERTY imperatively. React 18 doesn't forward the
  // inert JSX prop to the DOM (that's React 19), so we set it via the ref.
  // Inert removes the closed drawer's buttons from the tab order AND the
  // accessibility tree, fixing the focus-trap / aria-hidden-focus issues.
  useEffect(() => {
    if (asideRef.current) asideRef.current.inert = !isOpen
  }, [isOpen])

  // Focus management + Escape-to-close. Keyed on [isOpen] only, so it runs
  // exactly on open/close transitions.
  useEffect(() => {
    if (!isOpen) return

    // The trigger ("Your Lists" button) had focus at the moment we opened.
    // Captured as a local const so re-renders can't overwrite it.
    const trigger = document.activeElement
    // Move focus into the drawer so keyboard users land here.
    closeBtnRef.current?.focus()

    const handleKey = (e) => {
      if (e.key === 'Escape') onCloseRef.current()
    }
    window.addEventListener('keydown', handleKey)

    return () => {
      window.removeEventListener('keydown', handleKey)
      // On close, return focus to the trigger that opened the drawer.
      if (trigger instanceof HTMLElement) trigger.focus()
    }
  }, [isOpen])

  // Opening a movie from the sidebar also closes the drawer, so the modal
  // isn't competing with the drawer for the screen.
  const handleSelect = (id) => {
    onSelectMovie(id)
    onClose()
  }

  // A small reusable list block for "Favorites" and "Watched".
  const renderList = (label, movies, mode) => (
    <section className="sidebar-section">
      <div className="sidebar-section-head">
        <h3>{label}</h3>
        <span className="sidebar-count">{movies.length}</span>
        {/* Filter the main grid by this list. Clicking the active one clears
            the filter (toggles back to 'all'). */}
        <button
          type="button"
          className="sidebar-filter"
          aria-pressed={filterMode === mode}
          onClick={() => onFilter(filterMode === mode ? 'all' : mode)}
        >
          {filterMode === mode ? 'Clear filter' : 'Filter grid'}
        </button>
      </div>

      {movies.length === 0 ? (
        <p className="sidebar-empty">Nothing here yet.</p>
      ) : (
        <ul className="sidebar-list">
          {movies.map((movie) => (
            <li key={movie.id}>
              <button
                type="button"
                className="sidebar-item"
                onClick={() => handleSelect(movie.id)}
              >
                <img
                  className="sidebar-thumb"
                  src={
                    movie.poster_path
                      ? `https://image.tmdb.org/t/p/w92${movie.poster_path}`
                      : '/movie.png'
                  }
                  alt={`${movie.title} poster`}
                />
                <span className="sidebar-item-title">{movie.title}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )

  return (
    <>
      {/* Dimmed backdrop; clicking it closes the drawer. Only when open. */}
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}

      {/* The drawer stays in the DOM and slides via a CSS class so it animates
          both directions. When closed, `inert` removes it from the tab order
          AND the accessibility tree — without it, the off-screen buttons would
          still be Tab-focusable (a focus trap + aria-hidden violation). */}
      <aside
        ref={asideRef}
        className={isOpen ? 'sidebar is-open' : 'sidebar'}
        aria-label="Your movie lists"
      >
        <div className="sidebar-head">
          <h2>Your Lists</h2>
          <button
            type="button"
            className="sidebar-close"
            onClick={onClose}
            aria-label="Close sidebar"
            ref={closeBtnRef}
          >
            ✕
          </button>
        </div>

        {renderList('♥ Favorites', favoriteMovies, 'favorites')}
        {renderList('✓ Watched', watchedMovies, 'watched')}
      </aside>
    </>
  )
}

export default Sidebar
