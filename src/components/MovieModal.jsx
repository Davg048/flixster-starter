import { useEffect } from 'react'
import './MovieModal.css'

// MovieModal is presentational: App fetches the details and passes them in.
// Props:
//   movie   - the detailed movie object (or null while loading)
//   loading - true while the details fetch is in flight
//   error   - a message string if the fetch failed, else null
//   onClose - callback to close the modal
const MovieModal = ({ movie, loading, error, onClose }) => {
  // Let the user press Escape to close the modal.
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    // Cleanup: remove the listener when the modal unmounts.
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  const backdropUrl =
    movie && movie.backdrop_path
      ? `https://image.tmdb.org/t/p/w780${movie.backdrop_path}`
      : null

  return (
    // Clicking the dark overlay (outside the modal box) closes the modal.
    <div className="modal-overlay" onClick={onClose}>
      {/* stopPropagation keeps clicks inside the box from bubbling to the overlay */}
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">
          ✕
        </button>

        {loading && <p className="modal-status">Loading details…</p>}

        {error && <p className="modal-status">{error}</p>}

        {!loading && !error && movie && (
          <>
            {backdropUrl && (
              <img
                src={backdropUrl}
                alt={`${movie.title} backdrop`}
                className="modal-backdrop"
              />
            )}
            <h2 className="modal-title">{movie.title}</h2>
            <div className="modal-meta">
              {movie.release_date && <span>{movie.release_date}</span>}
              {movie.runtime ? <span>{movie.runtime} min</span> : null}
            </div>
            {movie.genres && movie.genres.length > 0 && (
              <div className="modal-genres">
                {movie.genres.map((genre) => (
                  <span key={genre.id} className="genre-tag">
                    {genre.name}
                  </span>
                ))}
              </div>
            )}
            <p className="modal-overview">{movie.overview}</p>
          </>
        )}
      </div>
    </div>
  )
}

export default MovieModal
