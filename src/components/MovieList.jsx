import MovieCard from './MovieCard'
import './MovieList.css'

const MovieList = ({
  movies,
  onCardClick,
  favorites,
  watched,
  onToggleFavorite,
  onToggleWatched,
}) => {
  return (
    <div className="movie-list">
      {movies.map((movie, index) => (
        // The first card is "featured" — it spans 2×2 in the grid to break
        // the uniform layout and give the eye a place to land.
        <MovieCard
          key={movie.id}
          movie={movie}
          onClick={onCardClick}
          featured={index === 0}
          isFavorite={favorites.has(movie.id)}
          isWatched={watched.has(movie.id)}
          onToggleFavorite={onToggleFavorite}
          onToggleWatched={onToggleWatched}
        />
      ))}
    </div>
  )
}

export default MovieList
