# Flixster — Planning Spec

> First-draft spec. Edit freely — anything here is a starting point to react to, not a final decision.

---

## 1. Component Architecture

**Hierarchy**

```
App
├── Header
├── SearchBar
├── (sort control — SortControl)
├── MovieList
│   └── MovieCard (one per movie)
├── MovieModal (rendered only when a movie is selected)
└── Footer
```

| Component | Responsibility | Renders | Props received | Owns state? |
|-----------|----------------|---------|----------------|-------------|
| **App** | Top-level container; owns all shared state and data fetching. | Header, SearchBar, SortControl, MovieList, MovieModal, Footer | none | **Yes** — movie list, query, page, selected movie, sort, loading, error |
| **Header** | App title/branding bar. | App name/logo (uses `.App-header` CSS) | none (or `title`) | No |
| **SearchBar** | Lets the user type and submit a search query. | A form with text input + submit button; a "clear/back to Now Playing" control | `onSearch(query)`, `onClear`, `query` | Local only (controlled input text) |
| **SortControl** | Lets the user pick a sort order for the displayed list. | A `<select>` or buttons (e.g. Title A–Z, Release date, Rating) | `sortOption`, `onSortChange(option)` | No (lifts to App) |
| **MovieList** | Lays out the grid of movie cards. | A grid container mapping movies → MovieCard | `movies[]`, `onCardClick(id)` | No |
| **MovieCard** | Displays one movie's poster + summary info. | Poster image, title, rating/release (uses `.movie-card` CSS) | `movie`, `onClick(id)` | No |
| **MovieModal** | Shows full details for the selected movie, including AI insight. | Overlay with poster, title, overview, runtime, genres, AI recommendation; close button | `movie` (detailed), `onClose`, `loading`, `aiInsight` | No (display only) |
| **Footer** | Static footer / TMDb attribution. | Attribution text/links | none | No |

---

## 2. API Contracts

Base URL: `https://api.themoviedb.org/3`
Image base: `https://image.tmdb.org/t/p/w500` + `poster_path`
Auth: `?api_key=${import.meta.env.VITE_API_KEY}` (or Bearer token header — pick one and be consistent).

### 2a. Now Playing
- **URL:** `GET /movie/now_playing`
- **Required params:** `api_key`, `language=en-US`, `page` (for pagination / "Load More")
- **Response fields used:** `results[]` → `id`, `title`, `poster_path`, `vote_average`, `release_date`; top-level `page`, `total_pages`
- **Errors to handle:** non-200 status, empty `results`, network failure, missing `poster_path` (fallback image)

### 2b. Search
- **URL:** `GET /search/movie`
- **Required params:** `api_key`, `language=en-US`, `query` (URL-encoded), `page`
- **Response fields used:** same as Now Playing (`results[]` shape is identical)
- **Errors to handle:** empty query (don't fire request), zero results ("No movies found"), non-200, network failure

### 2c. Movie Details (for the modal)
- **URL:** `GET /movie/{movie_id}`
- **Required params:** `api_key`, `language=en-US`
- **Response fields used:** `runtime`, `genres[]` (`.name`), `overview`, `title`, `poster_path`, `vote_average`, `release_date`
- **Why separate:** Now Playing/Search don't return `runtime` or `genres` — the modal must fetch details by ID on card click.
- **Errors to handle:** invalid/missing ID, non-200, network failure, loading state while details fetch

---

## 3. State Architecture

| State | Type | Initial | Owner | Updated by |
|-------|------|---------|-------|------------|
| `movies` | array | `[]` | App | Now Playing fetch, Search fetch, "Load More" (append), sort |
| `query` | string | `""` | App | SearchBar submit / clear |
| `page` | number | `1` | App | "Load More" button; reset to 1 on new search |
| `totalPages` | number | `1` | App | set from API response |
| `selectedMovie` | object \| null | `null` | App | MovieCard click (set), modal close (null) |
| `sortOption` | string | `"none"` (or `"popularity"`) | App | SortControl change |
| `isLoading` | boolean | `false` | App | true before fetch, false after |
| `error` | string \| null | `null` | App | set on failed fetch, cleared on retry |
| `aiInsight` | string \| null | `null` | App | set after AI call completes (see §5) |
| `searchText` | string | `""` | SearchBar (local) | input onChange |

**Note on sorting:** sort can be applied client-side on the current `movies` array (derived value, possibly via `useMemo`) rather than stored separately — decide based on whether you sort what's loaded or re-query the API.

---

## 4. Data Flow

On mount, **App** fetches `/movie/now_playing`, receives a JSON body, and stores `data.results` into `movies` state. The raw results are mostly usable as-is, but each card needs a light transform: build the full poster URL (`image base + poster_path`), handle a `null` `poster_path` with a fallback, and format `release_date` (and `vote_average` rounding) for display. `movies` is passed as a prop to **MovieList**, which maps each entry to a **MovieCard**.

When a user clicks a MovieCard, the card calls `onClick(movie.id)`. That ID bubbles up to App, which fires a **second fetch** to `/movie/{id}` for full details (runtime + genres), stores the result in `selectedMovie`, and renders **MovieModal**. So the click → ID → details-fetch path is: `MovieCard onClick(id)` → `App handleCardClick(id)` → `fetch(/movie/id)` → `setSelectedMovie(details)` → modal renders.

Searching swaps the data source: SearchBar submit sets `query`, resets `page` to 1, and App fetches `/search/movie?query=...` instead of Now Playing. Clearing the search returns to Now Playing.

---

## 5. AI Feature Spec

- **Where it displays:** inside **MovieModal**, below the overview — a short "Why you might watch this" blurb.
- **Context sent to the AI:** the selected movie's `title`, `genres` (names), and `overview`.
- **What the AI returns:** a 2–3 sentence watch recommendation written for someone deciding whether to watch.
- **State:** `aiInsight` (string | null) owned by App, passed to MovieModal as a prop; plus reuse `isLoading`/a dedicated `aiLoading` flag while the request is in flight. Reset to `null` when the modal closes or a new movie is selected.
- **Open questions to resolve at Milestone 8:** which provider/endpoint, where the call runs (the key must not leak to the browser — a serverless function or proxy may be needed), and how to handle AI errors gracefully (modal still works without the blurb).
