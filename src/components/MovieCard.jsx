import './MovieCard.css'

// MovieCard receives a `movie`, an `onClick` (open modal), a `featured` flag,
// and the favorite/watched state + toggle callbacks. The card itself is
// clickable (opens the modal); the favorite/watched buttons live inside it and
// must stop their clicks from bubbling up so they don't ALSO open the modal.
const MovieCard = ({
  movie,
  onClick,
  featured = false,
  isFavorite = false,
  isWatched = false,
  onToggleFavorite,
  onToggleWatched,
}) => {
  // If the movie has a poster_path, build the full TMDb image URL.
  // If poster_path is null, fall back to the placeholder in /public.
  const posterUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : '/movie.png'

  // Shared handler for the two corner buttons: stop the click from bubbling to
  // the card (which would open the modal), then run the given toggle.
  const handleToggle = (e, toggle) => {
    e.stopPropagation()
    toggle(movie.id)
  }

  // Build the class list so favorited/watched cards can be visually marked.
  const cardClasses = [
    'movie-card',
    featured && 'featured',
    isFavorite && 'is-favorite',
    isWatched && 'is-watched',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className={cardClasses}
      onClick={() => onClick(movie.id)}
      role="button"
      tabIndex={0}
      aria-label={`View details for ${movie.title}`}
      onKeyDown={(e) => {
        // Only react when the CARD itself is focused — not when the keydown
        // bubbled up from a nested button (favorite/watched). Otherwise
        // Enter/Space on those buttons would also open the modal.
        if (e.target !== e.currentTarget) return
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault() // stop Space from scrolling the page
          onClick(movie.id)
        }
      }}
    >
      {/* Poster wrapper is position:relative so the rating pill + action
          buttons can sit on it. */}
      <div className="poster-wrap">
        <img src={posterUrl} alt={`${movie.title} poster`} className="movie-poster" />
        <span className="movie-rating">⭐ {movie.vote_average.toFixed(1)}</span>

        {/* Favorite / watched toggles. aria-pressed conveys on/off state to
            screen readers; the label updates so it's never just an icon. */}
        <div className="card-actions">
          <button
            type="button"
            className="card-action favorite-btn"
            aria-pressed={isFavorite}
            aria-label={isFavorite ? `Remove ${movie.title} from favorites` : `Add ${movie.title} to favorites`}
            title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            onClick={(e) => handleToggle(e, onToggleFavorite)}
          >
            {isFavorite ? '♥' : '♡'}
          </button>
          <button
            type="button"
            className="card-action watched-btn"
            aria-pressed={isWatched}
            aria-label={isWatched ? `Mark ${movie.title} as not watched` : `Mark ${movie.title} as watched`}
            title={isWatched ? 'Mark as not watched' : 'Mark as watched'}
            onClick={(e) => handleToggle(e, onToggleWatched)}
          >
            {isWatched ? '✓' : '👁'}
          </button>
        </div>
      </div>
      <h3 className="movie-title">{movie.title}</h3>
    </div>
  )
}

export default MovieCard
