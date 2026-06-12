import './MovieCard.css'

// MovieCard receives one `movie` object as a prop. The { movie } syntax
// "destructures" it out of props so we can use `movie` directly.
const MovieCard = ({ movie }) => {
  // If the movie has a poster_path, build the full TMDb image URL.
  // If poster_path is null, fall back to the placeholder in /public.
  const posterUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : '/movie.png'

  return (
    <div className="movie-card">
      <img src={posterUrl} alt={movie.title} className="movie-poster" />
      <h3 className="movie-title">{movie.title}</h3>
      <p className="movie-rating">⭐ {movie.vote_average.toFixed(1)}</p>
    </div>
  )
}

export default MovieCard
