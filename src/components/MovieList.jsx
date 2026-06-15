import MovieCard from './MovieCard'
import './MovieList.css'

const MovieList = ({ movies, onCardClick }) => {
  return (
    <div className="movie-list">
      {movies.map((movie) => (
        <MovieCard key={movie.id} movie={movie} onClick={onCardClick} />
      ))}
    </div>
  )
}

export default MovieList
