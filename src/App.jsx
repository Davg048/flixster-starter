import { useState, useEffect } from 'react'
import './App.css'
import MovieList from './components/MovieList'
import SearchBar from './components/SearchBar'
import MovieModal from './components/MovieModal'
import SortControl from './components/SortControl'
import Header from './components/Header'
import Footer from './components/Footer'
import Sidebar from './components/Sidebar'


// Decide the starting theme ONCE (lazy initializer): a saved choice wins;
// otherwise fall back to the OS preference. Runs before first paint.
const getInitialTheme = () => {
  const saved = localStorage.getItem('flixster-theme')
  if (saved === 'light' || saved === 'dark') return saved
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

const App = () => {
  const [movies, setMovies] = useState([])
  const [page, setPage] = useState(1)
  const [query, setQuery] = useState('')
  const [totalPages, setTotalPages] = useState(1)
  const [sortOption, setSortOption] = useState('none')

  // Theme: 'dark' (default) or 'light'. Applied to <html> via data-theme so the
  // [data-theme='light'] CSS block can override the :root variables.
  const [theme, setTheme] = useState(getInitialTheme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('flixster-theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }

  // Modal state (Milestone 4)
  const [selectedMovieId, setSelectedMovieId] = useState(null)
  const [selectedMovieDetails, setSelectedMovieDetails] = useState(null)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [detailsError, setDetailsError] = useState(null)

  // Favorites & Watched (stretch). Each is a Set of movie IDs — Sets make
  // membership checks (favorites.has(id)) cheap and de-dupe for free. Not
  // persisted: they reset on reload, which is the spec's intent.
  const [favorites, setFavorites] = useState(() => new Set())
  const [watched, setWatched] = useState(() => new Set())

  // Toggle helpers. We build a NEW Set each time — mutating the existing one
  // in place wouldn't change its identity, so React wouldn't re-render.
  const toggleFavorite = (id) => {
    setFavorites((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleWatched = (id) => {
    setWatched((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Registry of every movie we've fetched, keyed by id. favorites/watched only
  // store IDs, but the sidebar needs full movie objects to show poster+title —
  // and a movie you favorited in Search results won't be in the current Now
  // Playing `movies` array. This cache lets us resolve any favorited/watched id
  // back to its object regardless of the current view.
  const [moviesById, setMoviesById] = useState(() => new Map())

  // Sidebar drawer open/closed, and which list (if any) filters the main grid.
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [filterMode, setFilterMode] = useState('all') // 'all' | 'favorites' | 'watched'

  // If the active filter's list becomes empty (e.g. you un-favorited the last
  // one), drop back to 'all' so the grid is never stranded empty with no escape.
  useEffect(() => {
    if (filterMode === 'favorites' && favorites.size === 0) setFilterMode('all')
    if (filterMode === 'watched' && watched.size === 0) setFilterMode('all')
  }, [filterMode, favorites, watched])

  const fetchMovies = async (pageToFetch, searchQuery) => {
    const baseUrl = searchQuery 
    ? `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(searchQuery)}`
    : `https://api.themoviedb.org/3/movie/now_playing?`
    const url = `${baseUrl}&api_key=${import.meta.env.VITE_API_KEY}&language=en-US&page=${pageToFetch}`

    const response = await fetch(url)
    const data = await response.json()

    setMovies((prevMovies) =>
      pageToFetch === 1 ? data.results : [...prevMovies, ...data.results]
  )
  setTotalPages(data.total_pages)

  // Record every fetched movie in the id→movie registry so the sidebar can
  // resolve favorited/watched IDs even after we switch views.
  setMoviesById((prev) => {
    const next = new Map(prev)
    for (const movie of data.results) next.set(movie.id, movie)
    return next
  })
  }
    // Run once on mount: load page 1 of Now Playing (empty query = Now Playing)
    useEffect(() => {
      fetchMovies(1, '')
    }, [])
  
    // Called by SearchBar when the user submits a search
    const handleSearch = (searchQuery) => {
      setQuery(searchQuery)
      setPage(1)
      setFilterMode('all') // searching exits any sidebar filter
      fetchMovies(1, searchQuery)
    }

    // Called when the user clears search / clicks "Now Playing"
    const handleClear = () => {
      setQuery('')
      setPage(1)
      setFilterMode('all') // returning to Now Playing exits any filter
      fetchMovies(1, '')
    }
  
    // Called by the "Load More" button
    const handleLoadMore = () => {
      const nextPage = page + 1
      setPage(nextPage)
      fetchMovies(nextPage, query)
    }

    // When a card is clicked, store its id — this opens the modal and
    // triggers the details fetch below.
    const handleCardClick = (id) => {
      setSelectedMovieId(id)
    }

    // Close the modal: clearing the id unmounts it and we reset details.
    const handleCloseModal = () => {
      setSelectedMovieId(null)
      setSelectedMovieDetails(null)
      setDetailsError(null)
    }

    // Whenever a movie is selected, fetch its full details (runtime, genres,
    // backdrop) from the Movie Details endpoint.
    useEffect(() => {
      if (selectedMovieId === null) return

      const fetchDetails = async () => {
        setDetailsLoading(true)
        setDetailsError(null)
        try {
          const url = `https://api.themoviedb.org/3/movie/${selectedMovieId}?api_key=${import.meta.env.VITE_API_KEY}&language=en-US`
          const response = await fetch(url)
          if (!response.ok) {
            throw new Error(`Request failed (${response.status})`)
          }
          const data = await response.json()
          setSelectedMovieDetails(data)
        } catch (err) {
          setDetailsError("We couldn't load this movie's details. Please try again.")
        } finally {
          setDetailsLoading(false)
        }
      }

      fetchDetails()
    }, [selectedMovieId])

    // Sort a COPY of any movie list (don't mutate state). Reused for both the
    // main grid and the filtered views so ordering is consistent everywhere.
    const sortMovies = (list) =>
      [...list].sort((a, b) => {
        if (sortOption === 'title') return a.title.localeCompare(b.title)
        if (sortOption === 'release_date') return b.release_date.localeCompare(a.release_date) // newest first
        if (sortOption === 'vote_average') return b.vote_average - a.vote_average // highest first
        return 0 // "none": keep original order
      })

    // Resolve favorited/watched IDs to full movie objects via the registry.
    // filter(Boolean) drops any id we can't resolve yet (defensive).
    const favoriteMovies = [...favorites].map((id) => moviesById.get(id)).filter(Boolean)
    const watchedMovies = [...watched].map((id) => moviesById.get(id)).filter(Boolean)

    // The grid: when filtered, draw from the SAME registry-backed lists the
    // sidebar uses (not the current view) so the grid and sidebar always agree
    // and a filter can never strand the grid empty after switching views.
    const visibleMovies =
      filterMode === 'favorites'
        ? sortMovies(favoriteMovies)
        : filterMode === 'watched'
        ? sortMovies(watchedMovies)
        : sortMovies(movies)

    // Label + count for the section header. Reflects search vs Now Playing,
    // and whether a sidebar filter is active.
    const sectionTitle =
      filterMode === 'favorites'
        ? 'Favorites'
        : filterMode === 'watched'
        ? 'Watched'
        : query
        ? `Results for "${query}"`
        : 'Now Playing'

    return (
      <div className="App">
        <Header theme={theme} onToggleTheme={toggleTheme} />
        <main className="page">
          {/* One toolbar row groups search + sort instead of two stacked
              centered islands, aligned to the same max-width as the grid. */}
          <div className="toolbar">
            <SearchBar onSearch={handleSearch} onClear={handleClear} />
            <SortControl sortOption={sortOption} onSortChange={setSortOption} />
            <button
              type="button"
              className="lists-toggle"
              onClick={() => setIsSidebarOpen(true)}
            >
              ☰ Your Lists ({favorites.size + watched.size})
            </button>
          </div>

          {/* Section header turns the wall of posters into a labeled section
              and gives a live result count. When a sidebar filter is active,
              show an on-grid "Clear filter" so the user is never stuck. */}
          <header className="section-head">
            <h2 className="section-title">{sectionTitle}</h2>
            <span className="section-count">{visibleMovies.length} films</span>
            {filterMode !== 'all' && (
              <button
                type="button"
                className="clear-filter"
                onClick={() => setFilterMode('all')}
              >
                Clear filter ✕
              </button>
            )}
          </header>

          <MovieList
            movies={visibleMovies}
            onCardClick={handleCardClick}
            favorites={favorites}
            watched={watched}
            onToggleFavorite={toggleFavorite}
            onToggleWatched={toggleWatched}
          />
          {/* Hide Load More while a sidebar filter is active — paginating would
              fetch more Now Playing movies into a filtered view. */}
          {filterMode === 'all' && page < totalPages && (
            <button className="load-more" onClick={handleLoadMore}>
              Load More
            </button>
          )}
          {selectedMovieId !== null && (
            <MovieModal
              movie={selectedMovieDetails}
              loading={detailsLoading}
              error={detailsError}
              onClose={handleCloseModal}
            />
          )}
        </main>
        <Footer />

        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          favoriteMovies={favoriteMovies}
          watchedMovies={watchedMovies}
          filterMode={filterMode}
          onFilter={setFilterMode}
          onSelectMovie={handleCardClick}
        />
      </div>
    )
  
  
}

export default App
