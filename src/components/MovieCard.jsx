import './MovieCard.css'

// MovieCard receives a `movie` object and an `onClick` callback as props.
// onClick is called with the movie's id when the card is clicked.
const MovieCard = ({ movie, onClick }) => {
  // If the movie has a poster_path, build the full TMDb image URL.
  // If poster_path is null, fall back to the placeholder in /public.
  const posterUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : '/movie.png'

  return (
    <div
      className="movie-card"
      onClick={() => onClick(movie.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onClick(movie.id)
      }}
    >
      <img src={posterUrl} alt={`${movie.title} poster`} className="movie-poster" />
      <h3 className="movie-title">{movie.title}</h3>
      <p className="movie-rating">⭐ {movie.vote_average.toFixed(1)}</p>
    </div>
  )
}

export default MovieCard
