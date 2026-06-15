import './MovieCard.css'

// MovieCard receives a `movie` object, an `onClick` callback, and a `featured`
// flag as props. onClick is called with the movie's id when the card is clicked.
// `featured` (the first card) renders larger via a CSS class.
const MovieCard = ({ movie, onClick, featured = false }) => {
  // If the movie has a poster_path, build the full TMDb image URL.
  // If poster_path is null, fall back to the placeholder in /public.
  const posterUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : '/movie.png'

  return (
    <div
      className={featured ? 'movie-card featured' : 'movie-card'}
      onClick={() => onClick(movie.id)}
      role="button"
      tabIndex={0}
      aria-label={`View details for ${movie.title}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onClick(movie.id)
      }}
    >
      {/* Poster wrapper is position:relative so the rating pill can sit on it. */}
      <div className="poster-wrap">
        <img src={posterUrl} alt={`${movie.title} poster`} className="movie-poster" />
        <span className="movie-rating">⭐ {movie.vote_average.toFixed(1)}</span>
      </div>
      <h3 className="movie-title">{movie.title}</h3>
    </div>
  )
}

export default MovieCard
