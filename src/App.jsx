import { useState, useEffect } from 'react'
import './App.css'
import MovieList from './components/MovieList'
import SearchBar from './components/SearchBar'
import MovieModal from './components/MovieModal'
import SortControl from './components/SortControl'
import Header from './components/Header'
import Footer from './components/Footer'


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
  }
    // Run once on mount: load page 1 of Now Playing (empty query = Now Playing)
    useEffect(() => {
      fetchMovies(1, '')
    }, [])
  
    // Called by SearchBar when the user submits a search
    const handleSearch = (searchQuery) => {
      setQuery(searchQuery)
      setPage(1)
      fetchMovies(1, searchQuery)
    }
  
    // Called when the user clears search / clicks "Now Playing"
    const handleClear = () => {
      setQuery('')
      setPage(1)
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

    // Sort a COPY of movies just before rendering (don't mutate state).
    // "none" leaves the original API order untouched.
    const sortedMovies = [...movies].sort((a, b) => {
      if (sortOption === 'title') {
        return a.title.localeCompare(b.title)
      }
      if (sortOption === 'release_date') {
        return b.release_date.localeCompare(a.release_date) // newest first
      }
      if (sortOption === 'vote_average') {
        return b.vote_average - a.vote_average // highest first
      }
      return 0 // "none": keep original order
    })

    // Label + count for the section header. Reflects whether we're showing
    // search results or the default Now Playing list.
    const sectionTitle = query ? `Results for "${query}"` : 'Now Playing'

    return (
      <div className="App">
        <Header theme={theme} onToggleTheme={toggleTheme} />
        <main className="page">
          {/* One toolbar row groups search + sort instead of two stacked
              centered islands, aligned to the same max-width as the grid. */}
          <div className="toolbar">
            <SearchBar onSearch={handleSearch} onClear={handleClear} />
            <SortControl sortOption={sortOption} onSortChange={setSortOption} />
          </div>

          {/* Section header turns the wall of posters into a labeled section
              and gives a live result count. */}
          <header className="section-head">
            <h2 className="section-title">{sectionTitle}</h2>
            <span className="section-count">{sortedMovies.length} films</span>
          </header>

          <MovieList movies={sortedMovies} onCardClick={handleCardClick} />
          {page < totalPages && (
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
      </div>
    )
  
  
}

export default App
