import { useEffect, useState } from 'react'
import './MovieModal.css'

// Calls OpenRouter to generate a short "Worth seeing?" take from the movie's
// title, genres, and overview. Returns the AI text on success, or a friendly
// fallback string on any failure (network, rate limit/429, bad shape) so the
// modal never breaks. See planning.md §5 for the prompt spec.
//
// We hit OpenRouter's "openrouter/free" auto-router — it picks an available
// free model for us, which sidesteps the per-model rate limits/retirements
// that plague pinned free slugs.
async function getMovieInsight(title, genres, overview) {
  const API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY
  const FALLBACK =
    "We couldn't generate a recommendation for this one — check out the overview above!"

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        // OpenRouter uses the referer for app attribution; it can also
        // affect free-tier rate limiting.
        'HTTP-Referer': window.location.href,
      },
      body: JSON.stringify({
        model: 'openrouter/free',
        messages: [
          {
            role: 'system',
            content:
              'You are a sharp, honest film concierge helping someone decide whether to see a movie that is currently in theaters. You have not seen the film yourself; you reason only from the title, genres, and official overview provided. Write 2-3 sentences (about 45 words max) on who would enjoy it and what mood or occasion it suits. Plain text only: no markdown, no headings, no preamble, no "I" statements. Do not reveal plot beyond the given overview, do not invent facts (cast, ratings, box office) not provided, avoid generic hype like "a must-see".',
          },
          {
            role: 'user',
            content: `Should I see this in theaters? Give me your "Worth seeing?" take.\n\nTitle: ${title}\nGenres: ${genres || 'Unknown'}\nOverview: ${overview || 'No overview available.'}`,
          },
        ],
      }),
    })

    if (!response.ok) throw new Error(`OpenRouter error: ${response.status}`)
    const data = await response.json()
    // Guard against an unexpected response shape before reading deep into it.
    const text = data?.choices?.[0]?.message?.content
    return text ? text.trim() : FALLBACK
  } catch (error) {
    console.error('AI insight failed:', error)
    return FALLBACK
  }
}

// MovieModal is presentational: App fetches the details and passes them in.
// Props:
//   movie   - the detailed movie object (or null while loading)
//   loading - true while the details fetch is in flight
//   error   - a message string if the fetch failed, else null
//   onClose - callback to close the modal
const MovieModal = ({ movie, loading, error, onClose }) => {
  // AI "Worth seeing?" take. Lives here in the modal so it resets automatically
  // when the modal unmounts on close (see planning.md §5).
  const [aiInsight, setAiInsight] = useState(null)
  const [loadingInsight, setLoadingInsight] = useState(false)

  // Let the user press Escape to close the modal.
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    // Cleanup: remove the listener when the modal unmounts.
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  // Once the movie details are loaded, fetch the AI insight. Keyed on the
  // movie id so it re-runs if a different movie's details arrive.
  useEffect(() => {
    if (!movie || !movie.id) return

    // `ignore` guards against a race: if the movie changes (or the modal
    // closes) before the await resolves, we skip the stale setState.
    let ignore = false
    const genreNames = movie.genres ? movie.genres.map((g) => g.name).join(', ') : ''

    setLoadingInsight(true)
    setAiInsight(null)

    getMovieInsight(movie.title, genreNames, movie.overview)
      .then((text) => {
        if (!ignore) setAiInsight(text)
      })
      .finally(() => {
        if (!ignore) setLoadingInsight(false)
      })

    return () => {
      ignore = true
    }
  }, [movie?.id])

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

            {/* AI "Worth seeing?" take. Shows a loading line during the call,
                then the recommendation (or the fallback string on failure). */}
            <div className="ai-insight">
              <h3 className="ai-insight-label">✨ Worth seeing?</h3>
              {loadingInsight ? (
                <p className="ai-insight-loading">Getting a recommendation…</p>
              ) : (
                <p className="ai-insight-text">{aiInsight}</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default MovieModal
