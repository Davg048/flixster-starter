import { useEffect, useState } from "react";
import MovieCard from "./MovieCard";
import './MovieList.css'

const MovieList = () => {
    const[movies, setMovies] = useState([])

    useEffect(() => {
        const fetchMovies = async () =>{
            const url = `https://api.themoviedb.org/3/movie/now_playing?api_key=${import.meta.env.VITE_API_KEY}&language=en-US&page=1`
            const response = await fetch(url)
            const data = await response.json()
            setMovies(data.results)


        }
        fetchMovies()
    }, [])

    return (
        <div className="movie-list">
            {movies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
            ))}
        </div>
    )
}

export default MovieList
